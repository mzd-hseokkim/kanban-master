package com.kanban.board.member;

/**
 * 초대 상태
 */
public enum InvitationStatus {
    PENDING("보류"),      // 초대 대기 중
    ACCEPTED("수락"),     // 초대 수락됨
    DECLINED("거절"),     // 초대 거절됨
    EXPIRED("만료");      // 초대 기간 만료

    private final String description;

    InvitationStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
