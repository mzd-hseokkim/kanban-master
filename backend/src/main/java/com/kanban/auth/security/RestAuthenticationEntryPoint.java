package com.kanban.auth.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanban.exception.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {
        if (response.isCommitted()) {
            return;
        }

        HttpStatus status = HttpStatus.UNAUTHORIZED;
        String message = "인증이 필요합니다.";

        if (authException instanceof AuthenticationServiceException) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = "인증 처리 중 서버 오류가 발생했습니다.";
            log.error("Authentication service error", authException);
        } else {
            log.debug("Authentication failed: {}", authException.getMessage());
        }

        ApiErrorResponse body = ApiErrorResponse.of(status, message, request.getRequestURI());

        response.setStatus(status.value());
        response.setCharacterEncoding("UTF-8");
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
