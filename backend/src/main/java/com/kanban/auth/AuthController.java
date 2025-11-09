package com.kanban.auth;

import com.kanban.auth.config.JwtProperties;
import com.kanban.auth.dto.AuthResponse;
import com.kanban.auth.dto.LoginRequest;
import com.kanban.auth.dto.SignupRequest;
import com.kanban.auth.dto.TokenRefreshResponse;
import com.kanban.auth.dto.UserProfileResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtProperties jwtProperties;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenRefreshResponse> refresh(HttpServletRequest request) {
        String refreshToken = resolveRefreshToken(request);
        return authService.refresh(refreshToken);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        String refreshToken = resolveRefreshToken(request);
        return authService.logout(refreshToken);
    }

    @GetMapping("/me")
    public UserProfileResponse me(@AuthenticationPrincipal com.kanban.user.User user) {
        if (user == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "인증 정보가 없습니다. 다시 로그인해주세요.");
        }
        return authService.me(user.getId());
    }

    private String resolveRefreshToken(HttpServletRequest request) {
        if (request.getCookies() == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "리프레시 토큰이 필요합니다.");
        }
        for (Cookie cookie : request.getCookies()) {
            if (jwtProperties.refreshTokenCookieName().equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        throw new ResponseStatusException(UNAUTHORIZED, "리프레시 토큰이 필요합니다.");
    }
}
