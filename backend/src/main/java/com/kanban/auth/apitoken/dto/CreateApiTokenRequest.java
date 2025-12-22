package com.kanban.auth.apitoken.dto;

import com.kanban.auth.apitoken.ApiTokenScope;
import com.kanban.board.member.BoardMemberRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

public record CreateApiTokenRequest(
        @NotBlank String name,
        @NotNull Long boardId,
        @NotNull BoardMemberRole role,
        @NotEmpty List<ApiTokenScope> scopes,
        LocalDateTime expiresAt
) {
}
