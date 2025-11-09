package com.kanban.board.member;

/**
 * 보드 멤버의 권한 역할
 */
public enum BoardMemberRole {
    VIEWER("보기 권한"),
    EDITOR("편집 권한"),
    MANAGER("관리자 권한");

    private final String description;

    BoardMemberRole(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
