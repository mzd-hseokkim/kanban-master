package com.kanban.auth.apitoken.dto;

import com.kanban.auth.apitoken.ApiTokenScope;
import com.kanban.board.member.BoardMemberRole;
import java.time.LocalDateTime;
import java.util.Set;

public record CreateApiTokenResponse(
        Long id,
        String token,
        String tokenPrefix,
        BoardMemberRole role,
        Set<ApiTokenScope> scopes,
        LocalDateTime expiresAt
) {
}
