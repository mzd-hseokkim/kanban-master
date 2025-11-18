package com.kanban.exception;

/**
 * 토큰 만료 예외
 * 이메일 인증 토큰이 만료된 경우 발생
 */
public class TokenExpiredException extends RuntimeException {

    public TokenExpiredException(String message) {
        super(message);
    }

    public TokenExpiredException(String message, Throwable cause) {
        super(message, cause);
    }
}
