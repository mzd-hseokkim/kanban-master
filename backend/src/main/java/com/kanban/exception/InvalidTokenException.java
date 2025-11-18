package com.kanban.exception;

/**
 * 유효하지 않은 토큰 예외
 * 이메일 인증 토큰이 존재하지 않거나 잘못된 경우 발생
 */
public class InvalidTokenException extends RuntimeException {

    public InvalidTokenException(String message) {
        super(message);
    }

    public InvalidTokenException(String message, Throwable cause) {
        super(message, cause);
    }
}
