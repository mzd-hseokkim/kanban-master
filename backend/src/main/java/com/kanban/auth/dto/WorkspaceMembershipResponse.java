package com.kanban.auth.dto;

import com.kanban.workspace.WorkspaceRole;

public record WorkspaceMembershipResponse(
        Long workspaceId,
        String workspaceName,
        String slug,
        WorkspaceRole role
) {
}
