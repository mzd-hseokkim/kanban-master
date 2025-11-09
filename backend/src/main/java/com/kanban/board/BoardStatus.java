package com.kanban.board;

/**
 * 보드 상태를 나타내는 열거형
 * ACTIVE: 활성 상태의 보드
 * ARCHIVED: 보관된 보드 (목록에서 숨김)
 * DELETED: 소프트 삭제된 보드 (30일 후 물리 삭제)
 */
public enum BoardStatus {
    ACTIVE,
    ARCHIVED,
    DELETED
}
