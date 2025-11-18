package com.kanban.exception;

/**
 * 이메일 발송 실패 시 발생하는 예외
 */
public class EmailSendException extends RuntimeException {

    public EmailSendException(String message) {
        super(message);
    }

    public EmailSendException(String message, Throwable cause) {
        super(message, cause);
    }
}
