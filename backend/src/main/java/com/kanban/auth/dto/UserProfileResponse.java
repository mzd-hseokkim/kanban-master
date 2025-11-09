package com.kanban.auth.dto;

import com.kanban.user.UserStatus;

import java.util.List;

public record UserProfileResponse(
        Long id,
        String email,
        String name,
        String avatarUrl,
        UserStatus status,
        List<WorkspaceMembershipResponse> workspaces
) {
}
