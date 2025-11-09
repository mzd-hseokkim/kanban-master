package com.kanban.auth.security;

import com.kanban.auth.token.JwtTokenProvider;
import com.kanban.user.User;
import com.kanban.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String token = resolveToken(request);

        if (StringUtils.hasText(token) && tokenProvider.validateToken(token)) {
            Long userId = tokenProvider.extractUserId(token);
            log.info("[JwtAuthenticationFilter] Token validated. Extracted userId: {}", userId);
            userRepository.findById(userId).ifPresent(user -> {
                log.info("[JwtAuthenticationFilter] User found: id={}, email={}", user.getId(), user.getEmail());
                setAuthentication(user, request);
            });
            if (!userRepository.findById(userId).isPresent()) {
                log.warn("[JwtAuthenticationFilter] User not found for userId: {}", userId);
            }
        } else {
            log.debug("[JwtAuthenticationFilter] No valid token in request");
        }

        filterChain.doFilter(request, response);
    }

    private void setAuthentication(User user, HttpServletRequest request) {
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            log.debug("[JwtAuthenticationFilter] Authentication already set");
            return;
        }
        List<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                user,
                null,
                authorities
        );
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        log.info("[JwtAuthenticationFilter] Authentication set successfully for user: {}", user.getId());
    }

    private String resolveToken(HttpServletRequest request) {
        String authorizationHeader = request.getHeader("Authorization");
        if (StringUtils.hasText(authorizationHeader) && authorizationHeader.startsWith("Bearer ")) {
            return authorizationHeader.substring(7);
        }
        return null;
    }
}
