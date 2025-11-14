package com.kanban.auth;

import com.kanban.auth.config.JwtProperties;
import com.kanban.auth.dto.*;
import com.kanban.auth.token.JwtTokenProvider;
import com.kanban.user.User;
import com.kanban.user.UserRepository;
import com.kanban.user.UserStatus;
import com.kanban.workspace.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final AuthTokenRepository authTokenRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final WorkspaceRepository workspaceRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final JwtProperties jwtProperties;

    public ResponseEntity<AuthResponse> signup(SignupRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "이미 가입된 이메일입니다.");
        }

        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .name(request.name())
                .status(UserStatus.ACTIVE)
                .build();

        userRepository.save(user);

        // 사용자가 소속된 workspace가 없으면 default workspace 생성
        ensureUserHasWorkspace(user);

        String accessToken = tokenProvider.generateAccessToken(user);
        AuthToken refreshToken = createRefreshToken(user);
        UserProfileResponse profile = buildProfile(user);

        ResponseCookie cookie = buildRefreshCookie(refreshToken.getToken(), false);

        AuthResponse responseBody = new AuthResponse(
                accessToken,
                "Bearer",
                jwtProperties.accessTokenValiditySeconds(),
                profile
        );

        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(responseBody);
    }

    public ResponseEntity<AuthResponse> login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "잘못된 자격 증명입니다."));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new ResponseStatusException(FORBIDDEN, "활성화되지 않은 계정입니다.");
        }

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ResponseStatusException(UNAUTHORIZED, "잘못된 자격 증명입니다.");
        }

        user.setLastLoginAt(LocalDateTime.now());

        // 사용자가 소속된 workspace가 없으면 default workspace 생성
        ensureUserHasWorkspace(user);

        String accessToken = tokenProvider.generateAccessToken(user);
        AuthToken refreshToken = createRefreshToken(user);
        UserProfileResponse profile = buildProfile(user);

        ResponseCookie cookie = buildRefreshCookie(refreshToken.getToken(), false);

        AuthResponse responseBody = new AuthResponse(
                accessToken,
                "Bearer",
                jwtProperties.accessTokenValiditySeconds(),
                profile
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(responseBody);
    }

    public ResponseEntity<TokenRefreshResponse> refresh(String refreshTokenValue) {
        AuthToken refreshToken = authTokenRepository.findByTokenAndRevokedFalse(refreshTokenValue)
                .filter(token -> token.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "리프레시 토큰이 유효하지 않습니다."));

        String accessToken = tokenProvider.generateAccessToken(refreshToken.getUser());
        TokenRefreshResponse body = new TokenRefreshResponse(accessToken, "Bearer", jwtProperties.accessTokenValiditySeconds());
        ResponseCookie cookie = buildRefreshCookie(refreshToken.getToken(), false);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(body);
    }

    public ResponseEntity<Void> logout(String refreshTokenValue) {
        if (StringUtils.hasText(refreshTokenValue)) {
            authTokenRepository.findByTokenAndRevokedFalse(refreshTokenValue)
                    .ifPresent(token -> token.setRevoked(true));
        }
        ResponseCookie expiredCookie = buildRefreshCookie("", true);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, expiredCookie.toString())
                .build();
    }

    public UserProfileResponse me(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "사용자를 찾을 수 없습니다."));
        return buildProfile(user);
    }

    private AuthToken createRefreshToken(User user) {
        AuthToken token = AuthToken.builder()
                .token(UUID.randomUUID().toString())
                .type(TokenType.REFRESH)
                .expiresAt(LocalDateTime.now().plusSeconds(jwtProperties.refreshTokenValiditySeconds()))
                .revoked(false)
                .user(user)
                .build();
        return authTokenRepository.save(token);
    }

    private UserProfileResponse buildProfile(User user) {
        var memberships = workspaceMemberRepository.findByUserId(user.getId()).stream()
                .map(member -> new WorkspaceMembershipResponse(
                        member.getWorkspace().getId(),
                        member.getWorkspace().getName(),
                        member.getWorkspace().getSlug(),
                        member.getRole()
                ))
                .toList();
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getAvatarUrl(),
                user.getStatus(),
                memberships
        );
    }

    private ResponseCookie buildRefreshCookie(String value, boolean expireNow) {
        long maxAge = expireNow ? 0 : jwtProperties.refreshTokenValiditySeconds();
        return ResponseCookie.from(jwtProperties.refreshTokenCookieName(), value)
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(maxAge)
                .sameSite("Lax")
                .build();
    }

    /**
     * 사용자가 소속된 workspace가 없으면 default workspace를 생성하고 멤버 추가
     */
    private void ensureUserHasWorkspace(User user) {
        List<WorkspaceMember> memberships = workspaceMemberRepository.findByUserId(user.getId());

        if (memberships.isEmpty()) {
            // Default workspace 생성
            Workspace defaultWorkspace = Workspace.builder()
                    .name(user.getName() + "'s Workspace")
                    .slug(generateSlug(user))
                    .owner(user)
                    .build();
            Workspace savedWorkspace = workspaceRepository.save(defaultWorkspace);

            // 사용자를 멤버로 추가 (OWNER 역할)
            WorkspaceMember member = WorkspaceMember.builder()
                    .workspace(savedWorkspace)
                    .user(user)
                    .role(WorkspaceRole.OWNER)
                    .build();
            workspaceMemberRepository.save(member);
        }
    }

    /**
     * 워크스페이스 slug 생성 (user-email 기반)
     */
    private String generateSlug(User user) {
        String baseSlug = user.getEmail().split("@")[0].toLowerCase().replaceAll("[^a-z0-9]", "-");
        String slug = baseSlug;
        int counter = 1;

        while (workspaceRepository.findBySlug(slug).isPresent()) {
            slug = baseSlug + "-" + counter;
            counter++;
        }

        return slug;
    }
}
