package com.kanban.auth.apitoken;

import com.kanban.board.member.BoardMemberRole;
import java.util.Set;

public record ApiTokenPrincipal(
        Long userId,
        Long tokenId,
        Long boardId,
        BoardMemberRole role,
        Set<ApiTokenScope> scopes
) {
    public boolean hasScope(ApiTokenScope scope) {
        return scopes != null && scopes.contains(scope);
    }
}
