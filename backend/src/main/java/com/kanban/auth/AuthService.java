package com.kanban.auth;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import com.kanban.auth.config.JwtProperties;
import com.kanban.auth.dto.*;
import com.kanban.auth.token.JwtTokenProvider;
import com.kanban.user.User;
import com.kanban.user.UserRepository;
import com.kanban.user.UserStatus;
import com.kanban.workspace.UserWorkspaceService;
import com.kanban.workspace.WorkspaceMemberRepository;
import com.kanban.util.EmailUtil;
import com.kanban.util.EmailTemplateUtil;
import com.kanban.exception.InvalidTokenException;
import com.kanban.exception.TokenExpiredException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

        private final UserRepository userRepository;
        private final AuthTokenRepository authTokenRepository;
        private final WorkspaceMemberRepository workspaceMemberRepository;
        private final UserWorkspaceService userWorkspaceService;
        private final PasswordEncoder passwordEncoder;
        private final JwtTokenProvider tokenProvider;
        private final JwtProperties jwtProperties;
        private final EmailUtil emailUtil;
        private final EmailTemplateUtil emailTemplateUtil;

        @Value("${security.cookie.secure}")
        private boolean cookieSecure;

        @Value("${security.cookie.same-site}")
        private String cookieSameSite;

        @Value("${security.cookie.domain:#{null}}")
        private String cookieDomain;

        @Value("${app.frontend.url}")
        private String frontendUrl;

        public ResponseEntity<AuthResponse> signup(SignupRequest request) {
                log.info("📝 [signup] 회원가입 시작 - email: {}", request.email());

                if (userRepository.findByEmail(request.email()).isPresent()) {
                        log.warn("⚠️ [signup] 이미 가입된 이메일 - email: {}", request.email());
                        throw new ResponseStatusException(
                                        org.springframework.http.HttpStatus.CONFLICT,
                                        "이미 가입된 이메일입니다.");
                }

                // 인증 토큰 생성 (24시간 유효)
                String verificationToken = UUID.randomUUID().toString();
                LocalDateTime tokenExpiry = LocalDateTime.now().plusHours(24);
                log.info("🔑 [signup] 인증 토큰 생성 - token: {}, expiry: {}", verificationToken, tokenExpiry);

                // PENDING 상태로 사용자 생성
                User user = User.builder()
                                .email(request.email())
                                .password(passwordEncoder.encode(request.password()))
                                .name(request.name())
                                .status(UserStatus.PENDING)
                                .verificationToken(verificationToken)
                                .verificationTokenExpiry(tokenExpiry)
                                .emailVerified(false)
                                .build();

                userRepository.save(user);
                log.info("💾 [signup] 사용자 생성 완료 - userId: {}, email: {}, verificationToken: {}",
                        user.getId(), user.getEmail(), user.getVerificationToken());

                // 인증 이메일 발송
                try {
                        sendVerificationEmail(user, verificationToken);
                        log.info("📧 [signup] 인증 이메일 발송 성공 - email: {}", user.getEmail());
                } catch (Exception e) {
                        log.error("❌ [signup] 인증 이메일 발송 실패 - email: {}, error: {}",
                                user.getEmail(), e.getMessage(), e);
                        throw new ResponseStatusException(
                                        org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                                        "인증 이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
                }

                log.info("✅ [signup] 회원가입 완료 - userId: {}, email: {}", user.getId(), user.getEmail());

                // 인증 전이므로 토큰 발급하지 않음
                return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                                .body(null);
        }

        public ResponseEntity<AuthResponse> login(LoginRequest request) {
                User user = userRepository.findByEmail(request.email()).orElseThrow(
                                () -> new ResponseStatusException(UNAUTHORIZED, "잘못된 자격 증명입니다."));

                if (user.getStatus() != UserStatus.ACTIVE) {
                        throw new ResponseStatusException(FORBIDDEN, "활성화되지 않은 계정입니다.");
                }

                // 이메일 인증 여부 확인
                if (!user.getEmailVerified()) {
                        throw new ResponseStatusException(FORBIDDEN,
                                        "이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.");
                }

                if (!passwordEncoder.matches(request.password(), user.getPassword())) {
                        throw new ResponseStatusException(UNAUTHORIZED, "잘못된 자격 증명입니다.");
                }

                user.setLastLoginAt(LocalDateTime.now());

                // 사용자가 소속된 workspace가 없으면 default workspace 생성
                userWorkspaceService.ensureUserHasWorkspace(user);

                String accessToken = tokenProvider.generateAccessToken(user);
                AuthToken refreshToken = createRefreshToken(user);
                UserProfileResponse profile = buildProfile(user);

                ResponseCookie cookie = buildRefreshCookie(refreshToken.getToken(), false);

                AuthResponse responseBody = new AuthResponse(accessToken, "Bearer",
                                jwtProperties.accessTokenValiditySeconds(), profile);

                return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString())
                                .body(responseBody);
        }

        public ResponseEntity<TokenRefreshResponse> refresh(String refreshTokenValue) {
                AuthToken refreshToken = authTokenRepository
                                .findByTokenAndRevokedFalse(refreshTokenValue)
                                .filter(token -> token.getExpiresAt().isAfter(LocalDateTime.now()))
                                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED,
                                                "리프레시 토큰이 유효하지 않습니다."));

                String accessToken = tokenProvider.generateAccessToken(refreshToken.getUser());
                TokenRefreshResponse body = new TokenRefreshResponse(accessToken, "Bearer",
                                jwtProperties.accessTokenValiditySeconds());
                ResponseCookie cookie = buildRefreshCookie(refreshToken.getToken(), false);

                return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString())
                                .body(body);
        }

        public ResponseEntity<Void> logout(String refreshTokenValue) {
                if (StringUtils.hasText(refreshTokenValue)) {
                        authTokenRepository.findByTokenAndRevokedFalse(refreshTokenValue)
                                        .ifPresent(token -> token.setRevoked(true));
                }
                ResponseCookie expiredCookie = buildRefreshCookie("", true);
                return ResponseEntity.noContent()
                                .header(HttpHeaders.SET_COOKIE, expiredCookie.toString()).build();
        }

        public UserProfileResponse me(Long userId) {
                User user = userRepository.findById(userId).orElseThrow(
                                () -> new ResponseStatusException(UNAUTHORIZED, "사용자를 찾을 수 없습니다."));
                return buildProfile(user);
        }

        private AuthToken createRefreshToken(User user) {
                AuthToken token = AuthToken.builder().token(UUID.randomUUID().toString())
                                .type(TokenType.REFRESH)
                                .expiresAt(LocalDateTime.now().plusSeconds(
                                                jwtProperties.refreshTokenValiditySeconds()))
                                .revoked(false).user(user).build();
                return authTokenRepository.save(token);
        }

        private UserProfileResponse buildProfile(User user) {
                var memberships = workspaceMemberRepository.findByUserId(user.getId()).stream()
                                .map(member -> new WorkspaceMembershipResponse(
                                                member.getWorkspace().getId(),
                                                member.getWorkspace().getName(),
                                                member.getWorkspace().getSlug(), member.getRole()))
                                .toList();
                return new UserProfileResponse(user.getId(), user.getEmail(), user.getName(),
                                user.getAvatarUrl(), user.getStatus(), memberships);
        }

        private ResponseCookie buildRefreshCookie(String value, boolean expireNow) {
                long maxAge = expireNow ? 0 : jwtProperties.refreshTokenValiditySeconds();
                ResponseCookie.ResponseCookieBuilder builder = ResponseCookie
                                .from(jwtProperties.refreshTokenCookieName(), value)
                                .httpOnly(true)
                                .secure(cookieSecure) // 환경별 설정 (dev: false, prod: true)
                                .path("/")
                                .maxAge(maxAge)
                                .sameSite(cookieSameSite); // 환경별 설정 (dev: Lax, prod: Strict)

                // Domain 설정이 있을 경우에만 추가 (Cross-origin Cookie 지원)
                if (cookieDomain != null && !cookieDomain.isEmpty()) {
                        builder.domain(cookieDomain);
                }

                return builder.build();
        }

        /**
         * 이메일 인증 처리
         *
         * @param token 인증 토큰
         * @return 인증 성공 시 200 OK (자동 로그인 없음)
         */
        public ResponseEntity<Void> verifyEmail(String token) {
                log.info("📧 [verifyEmail] 시작 - token: {}", token);

                // 토큰으로 사용자 조회
                Optional<User> userOpt = userRepository.findByVerificationToken(token);

                if (userOpt.isEmpty()) {
                        log.warn("⚠️ [verifyEmail] 토큰으로 사용자를 찾을 수 없음 - token: {}", token);
                        throw new InvalidTokenException(
                                "유효하지 않은 인증 토큰입니다.");
                }

                User user = userOpt.get();

                log.info("✅ [verifyEmail] 사용자 찾음 - userId: {}, email: {}, emailVerified: {}",
                        user.getId(), user.getEmail(), user.getEmailVerified());

                // 토큰 만료 확인
                if (user.getVerificationTokenExpiry() == null
                                || user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
                        log.error("❌ [verifyEmail] 토큰 만료 - userId: {}, expiry: {}",
                                user.getId(), user.getVerificationTokenExpiry());
                        throw new TokenExpiredException(
                                        "인증 토큰이 만료되었습니다. 인증 메일을 다시 요청해주세요.");
                }

                // 이미 인증된 사용자 (중복 요청 허용 - hook이나 재시도로 인한 중복 호출 방지)
                if (user.getEmailVerified()) {
                        log.warn("⚠️ [verifyEmail] 이미 인증된 계정 - 중복 요청 무시 - userId: {}", user.getId());
                        return ResponseEntity.ok().build();
                }

                log.info("🔄 [verifyEmail] 이메일 인증 처리 시작 - userId: {}", user.getId());

                // 이메일 인증 완료 처리
                user.setEmailVerified(true);
                user.setEmailVerifiedAt(LocalDateTime.now());
                user.setStatus(UserStatus.ACTIVE);
                user.setVerificationToken(null); // 토큰 재사용 방지
                user.setVerificationTokenExpiry(null);

                userRepository.save(user);
                log.info("💾 [verifyEmail] 사용자 정보 저장 완료 - userId: {}", user.getId());

                // 사용자가 소속된 workspace가 없으면 default workspace 생성
                userWorkspaceService.ensureUserHasWorkspace(user);
                log.info("🏢 [verifyEmail] Workspace 확인 완료 - userId: {}", user.getId());

                log.info("🎉 [verifyEmail] 인증 완료 - userId: {}, email: {}",
                        user.getId(), user.getEmail());

                // 인증만 완료하고 로그인은 하지 않음 (프론트엔드에서 로그인 페이지로 리다이렉트)
                return ResponseEntity.ok().build();
        }

        /**
         * 인증 메일 재발송
         *
         * @param email 사용자 이메일
         */
        public void resendVerificationEmail(String email) {
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new ResponseStatusException(
                                                org.springframework.http.HttpStatus.NOT_FOUND,
                                                "해당 이메일로 가입된 계정을 찾을 수 없습니다."));

                // 이미 인증된 사용자
                if (user.getEmailVerified()) {
                        throw new ResponseStatusException(
                                        org.springframework.http.HttpStatus.BAD_REQUEST,
                                        "이미 인증된 계정입니다.");
                }

                // PENDING 상태가 아닌 경우
                if (user.getStatus() != UserStatus.PENDING) {
                        throw new ResponseStatusException(
                                        org.springframework.http.HttpStatus.BAD_REQUEST,
                                        "인증 대기 중인 계정이 아닙니다.");
                }

                // 새로운 인증 토큰 생성
                String newToken = UUID.randomUUID().toString();
                LocalDateTime newExpiry = LocalDateTime.now().plusHours(24);

                user.setVerificationToken(newToken);
                user.setVerificationTokenExpiry(newExpiry);
                userRepository.save(user);

                // 인증 이메일 재발송
                try {
                        sendVerificationEmail(user, newToken);
                } catch (Exception e) {
                        throw new ResponseStatusException(
                                        org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                                        "인증 이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
                }
        }

        /**
         * 인증 이메일 발송 (내부 메서드)
         *
         * @param user 사용자
         * @param token 인증 토큰
         */
        private void sendVerificationEmail(User user, String token) {
                try {
                        String verificationUrl = frontendUrl + "/verify-email?token=" + token;
                        String htmlContent = emailTemplateUtil.createVerificationEmail(
                                        user.getName(), verificationUrl);

                        emailUtil.sendEmail(
                                        user.getEmail(),
                                        user.getName(),
                                        "Kanban Board 이메일 인증",
                                        htmlContent);
                } catch (Exception e) {
                        throw new RuntimeException("이메일 발송 실패", e);
                }
        }

}
