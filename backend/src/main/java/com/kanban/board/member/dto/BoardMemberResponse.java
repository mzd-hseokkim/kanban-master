package com.kanban.board.member.dto;

import com.kanban.board.member.BoardMember;
import com.kanban.board.member.BoardMemberRole;
import com.kanban.board.member.InvitationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 보드 멤버 응답 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardMemberResponse {

    private Long boardId;
    private Long userId;
    private String userEmail;
    private String userName;
    private BoardMemberRole role;
    private InvitationStatus invitationStatus;
    private String invitedAt;
    private String acceptedAt;
    private String createdAt;
    private String boardName;
    private String invitationToken;
    private String invitedByName;

    public static BoardMemberResponse from(BoardMember member) {
        return BoardMemberResponse.builder()
            .boardId(member.getBoard().getId())
            .userId(member.getUser().getId())
            .userEmail(member.getUser().getEmail())
            .userName(member.getUser().getName())
            .role(member.getRole())
            .invitationStatus(member.getInvitationStatus())
            .invitedAt(formatDateTime(member.getInvitedAt()))
            .acceptedAt(formatDateTime(member.getAcceptedAt()))
            .createdAt(formatDateTime(member.getCreatedAt()))
            .boardName(member.getBoard().getName())
            .invitationToken(member.getInvitationToken())
            .build();
    }

    /**
     * 초대 정보를 포함한 응답 생성 (초대자 정보 포함)
     */
    public static BoardMemberResponse fromWithInviter(BoardMember member, String inviterName) {
        BoardMemberResponse response = from(member);
        response.invitedByName = inviterName;
        return response;
    }

    private static String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }
}
