package com.kanban.auth.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanban.auth.apitoken.ApiTokenPrincipal;
import com.kanban.auth.apitoken.ApiTokenScope;
import com.kanban.auth.apitoken.ApiTokenService;
import com.kanban.auth.config.ApiTokenProperties;
import com.kanban.exception.ApiErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class ApiTokenAuthenticationFilter extends OncePerRequestFilter {

    private static final Pattern BOARD_ID_PATTERN = Pattern.compile("/boards/(\\d+)");

    private final ApiTokenService apiTokenService;
    private final ApiTokenProperties properties;
    private final ObjectMapper objectMapper;

    public ApiTokenAuthenticationFilter(ApiTokenService apiTokenService,
            ApiTokenProperties properties,
            ObjectMapper objectMapper) {
        this.apiTokenService = apiTokenService;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String tokenValue = resolveBearerToken(request);

        if (!StringUtils.hasText(tokenValue) || !isApiToken(tokenValue)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!isAllowedPath(request)) {
            writeError(response, request, HttpStatus.FORBIDDEN, "이 작업을 수행할 권한이 없습니다.");
            return;
        }

        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        ApiTokenPrincipal principal = apiTokenService.authenticate(tokenValue, LocalDateTime.now())
                .orElse(null);
        if (principal == null) {
            writeError(response, request, HttpStatus.UNAUTHORIZED, "인증이 필요합니다.");
            return;
        }

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(principal, null, buildAuthorities(principal));
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }

    private boolean isAllowedPath(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (!path.startsWith("/api/v1/workspaces/")) {
            return false;
        }
        Matcher matcher = BOARD_ID_PATTERN.matcher(path);
        return matcher.find();
    }

    private String resolveBearerToken(HttpServletRequest request) {
        String authorizationHeader = request.getHeader("Authorization");
        if (StringUtils.hasText(authorizationHeader) && authorizationHeader.startsWith("Bearer ")) {
            return authorizationHeader.substring(7);
        }
        return null;
    }

    private boolean isApiToken(String tokenValue) {
        String prefix = properties.prefix();
        return StringUtils.hasText(prefix) && tokenValue.startsWith(prefix);
    }

    private List<GrantedAuthority> buildAuthorities(ApiTokenPrincipal principal) {
        Set<ApiTokenScope> scopes = principal.scopes();
        if (scopes == null || scopes.isEmpty()) {
            return List.of();
        }
        return scopes.stream()
                .map(scope -> (GrantedAuthority) new SimpleGrantedAuthority("SCOPE_" + scope.name()))
                .toList();
    }

    private void writeError(HttpServletResponse response, HttpServletRequest request,
            HttpStatus status, String message) throws IOException {
        if (response.isCommitted()) {
            return;
        }
        ApiErrorResponse body = ApiErrorResponse.of(status, message, request.getRequestURI());
        response.setStatus(status.value());
        response.setCharacterEncoding("UTF-8");
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
