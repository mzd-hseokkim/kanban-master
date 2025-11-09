package com.kanban.auth.dto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserProfileResponse user
) {
}
