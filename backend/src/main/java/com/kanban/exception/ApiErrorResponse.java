package com.kanban.exception;

import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 표준 API 에러 응답
 */
public record ApiErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        List<String> details
)
{
    public static ApiErrorResponse of(HttpStatus status, String message, String path) {
        return new ApiErrorResponse(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                path,
                List.of()
        );
    }

    public static ApiErrorResponse of(HttpStatus status, String message, String path, List<String> details) {
        return new ApiErrorResponse(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                path,
                details == null ? List.of() : List.copyOf(details)
        );
    }
}
