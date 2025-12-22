package com.kanban.auth.apitoken.dto;

import com.kanban.auth.apitoken.ApiTokenScope;
import com.kanban.board.member.BoardMemberRole;
import java.time.LocalDateTime;
import java.util.Set;

public record ApiTokenSummaryResponse(
        Long id,
        String name,
        Long boardId,
        String tokenPrefix,
        BoardMemberRole role,
        Set<ApiTokenScope> scopes,
        LocalDateTime expiresAt,
        LocalDateTime lastUsedAt,
        LocalDateTime revokedAt,
        LocalDateTime createdAt
) {
}
