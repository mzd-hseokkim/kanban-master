package com.kanban.common;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Security Context에서 현재 사용자 정보를 추출하는 유틸리티
 */
public class SecurityUtil {

    private SecurityUtil() {
    }

    /**
     * 현재 인증된 사용자의 ID를 반환
     * 테스트 환경에서는 "1"을 기본값으로 반환
     */
    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            // 테스트 환경이나 인증되지 않은 경우 기본값 반환
            return 1L;
        }

        Object principal = authentication.getPrincipal();
        Long resolvedId = extractUserId(principal);
        return resolvedId != null ? resolvedId : 1L;
    }

    /**
     * 현재 인증 상태 확인
     */
    public static boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated();
    }

    private static Long extractUserId(Object principal) {
        if (principal instanceof com.kanban.user.User user) {
            return user.getId();
        }
        if (principal instanceof Long id) {
            return id;
        }
        if (principal instanceof String principalString) {
            return parseLongSafely(principalString);
        }
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
            return parseLongSafely(userDetails.getUsername());
        }
        return null;
    }

    private static Long parseLongSafely(String value) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
