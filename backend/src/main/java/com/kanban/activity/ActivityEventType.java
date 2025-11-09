package com.kanban.activity;

/**
 * 활동 이벤트 유형
 */
public enum ActivityEventType {
    // 보드 이벤트
    BOARD_CREATED,
    BOARD_UPDATED,
    BOARD_DELETED,

    // 칼럼 이벤트
    COLUMN_CREATED,
    COLUMN_UPDATED,
    COLUMN_DELETED,
    COLUMN_REORDERED,

    // 카드 이벤트
    CARD_CREATED,
    CARD_UPDATED,
    CARD_DELETED,
    CARD_MOVED,

    // 멤버 이벤트
    MEMBER_INVITED,
    MEMBER_ROLE_CHANGED,
    MEMBER_REMOVED,

    // 댓글 이벤트
    COMMENT_ADDED,
    COMMENT_DELETED
}
