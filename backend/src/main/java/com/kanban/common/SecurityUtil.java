package com.kanban.common;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Security Context에서 현재 사용자 정보를 추출하는 유틸리티
 */
public class SecurityUtil {

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

        try {
            // Principal이 User 엔티티인 경우
            if (authentication.getPrincipal() instanceof com.kanban.user.User) {
                return ((com.kanban.user.User) authentication.getPrincipal()).getId();
            }

            // Principal이 Long (userId)인 경우
            if (authentication.getPrincipal() instanceof Long) {
                return (Long) authentication.getPrincipal();
            }

            // Principal이 String (username)인 경우는 파싱 시도
            if (authentication.getPrincipal() instanceof String) {
                String principal = (String) authentication.getPrincipal();
                try {
                    return Long.parseLong(principal);
                } catch (NumberFormatException e) {
                    return 1L;  // 기본값
                }
            }

            // Principal이 UserDetails인 경우
            if (authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                String username = ((org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal()).getUsername();
                try {
                    return Long.parseLong(username);
                } catch (NumberFormatException e) {
                    return 1L;  // 기본값
                }
            }
        } catch (Exception e) {
            return 1L;  // 기본값
        }

        return 1L;  // 기본값
    }

    /**
     * 현재 인증 상태 확인
     */
    public static boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated();
    }
}
