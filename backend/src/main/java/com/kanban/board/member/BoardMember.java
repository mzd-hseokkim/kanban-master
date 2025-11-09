package com.kanban.board.member;

import com.kanban.board.Board;
import com.kanban.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 보드 멤버 (권한 및 초대 관리)
 * 보드에 속한 사용자의 역할과 초대 상태를 관리
 */
@Entity
@Table(
    name = "board_members",
    indexes = {
        @Index(name = "idx_board_members_board_id", columnList = "board_id"),
        @Index(name = "idx_board_members_user_id", columnList = "user_id"),
        @Index(name = "idx_board_members_invitation_token", columnList = "invitation_token")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_board_members_board_user", columnNames = {"board_id", "user_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardMember {

    @EmbeddedId
    private BoardMemberId id;

    /**
     * 보드
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("boardId")
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    /**
     * 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * 보드에서의 역할 (권한)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BoardMemberRole role = BoardMemberRole.EDITOR;

    /**
     * 초대 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private InvitationStatus invitationStatus = InvitationStatus.ACCEPTED;

    /**
     * 초대 토큰 (초대 링크 생성 시 사용)
     */
    @Column(length = 64, unique = true)
    private String invitationToken;

    /**
     * 초대 날짜
     */
    private LocalDateTime invitedAt;

    /**
     * 초대 수락 날짜
     */
    private LocalDateTime acceptedAt;

    /**
     * 멤버 추가 날짜
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 마지막 업데이트 날짜
     */
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * 초대 수락
     */
    public void acceptInvitation() {
        if (this.invitationStatus != InvitationStatus.PENDING) {
            throw new IllegalStateException("초대 상태가 올바르지 않습니다");
        }
        this.invitationStatus = InvitationStatus.ACCEPTED;
        this.acceptedAt = LocalDateTime.now();
    }

    /**
     * 초대 거절
     */
    public void declineInvitation() {
        if (this.invitationStatus != InvitationStatus.PENDING) {
            throw new IllegalStateException("초대 상태가 올바르지 않습니다");
        }
        this.invitationStatus = InvitationStatus.DECLINED;
    }

    /**
     * 초대 만료
     */
    public void expireInvitation() {
        if (this.invitationStatus != InvitationStatus.PENDING) {
            throw new IllegalStateException("초대 상태가 올바르지 않습니다");
        }
        this.invitationStatus = InvitationStatus.EXPIRED;
    }

    /**
     * 권한이 충분한지 확인 (편집 이상 권한)
     */
    public boolean canEdit() {
        return role == BoardMemberRole.EDITOR || role == BoardMemberRole.MANAGER;
    }

    /**
     * 관리자 권한 확인
     */
    public boolean isManager() {
        return role == BoardMemberRole.MANAGER;
    }
}
