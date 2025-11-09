package com.kanban.board.dto;

import com.kanban.board.Board;
import com.kanban.board.BoardStatus;
import com.kanban.board.member.InvitationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardResponse {

    private Long id;

    private Long workspaceId;

    private Long ownerId;

    private String ownerName;

    private String name;

    private String description;

    private String themeColor;

    private String icon;

    private BoardStatus status;

    private LocalDateTime deletedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    /**
     * 현재 사용자의 초대 상태 (null이면 owner)
     */
    private InvitationStatus invitationStatus;

    /**
     * 현재 사용자의 초대 토큰 (초대 대기 중일 때만)
     */
    private String invitationToken;

    /**
     * Entity를 Response DTO로 변환
     */
    public static BoardResponse from(Board board) {
        return BoardResponse.builder()
            .id(board.getId())
            .workspaceId(board.getWorkspace().getId())
            .ownerId(board.getOwner().getId())
            .ownerName(board.getOwner().getName())
            .name(board.getName())
            .description(board.getDescription())
            .themeColor(board.getThemeColor())
            .icon(board.getIcon())
            .status(board.getStatus())
            .deletedAt(board.getDeletedAt())
            .createdAt(board.getCreatedAt())
            .updatedAt(board.getUpdatedAt())
            .invitationStatus(null)
            .invitationToken(null)
            .build();
    }

    /**
     * Entity를 Response DTO로 변환 (초대 상태 포함)
     */
    public static BoardResponse fromWithInvitation(Board board, InvitationStatus status, String token) {
        return BoardResponse.builder()
            .id(board.getId())
            .workspaceId(board.getWorkspace().getId())
            .ownerId(board.getOwner().getId())
            .ownerName(board.getOwner().getName())
            .name(board.getName())
            .description(board.getDescription())
            .themeColor(board.getThemeColor())
            .icon(board.getIcon())
            .status(board.getStatus())
            .deletedAt(board.getDeletedAt())
            .createdAt(board.getCreatedAt())
            .updatedAt(board.getUpdatedAt())
            .invitationStatus(status)
            .invitationToken(token)
            .build();
    }
}
