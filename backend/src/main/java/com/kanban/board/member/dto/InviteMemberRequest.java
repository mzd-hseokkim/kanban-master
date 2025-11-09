package com.kanban.board.member.dto;

import com.kanban.board.member.BoardMemberRole;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 멤버 초대 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InviteMemberRequest {

    @NotNull(message = "사용자 ID는 필수입니다")
    private Long userId;

    @NotNull(message = "권한은 필수입니다")
    private BoardMemberRole role;

    private String message;  // 초대 메시지 (선택사항)
}
