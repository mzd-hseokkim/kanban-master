package com.kanban.card;

import org.springframework.util.StringUtils;

/**
 * 카드 목록 정렬 기준
 */
public enum CardSortBy {
    TITLE,
    PRIORITY,
    STARTED_AT,
    DUE_DATE,
    COMPLETED_AT,
    CREATED_AT;

    public static CardSortBy from(String value) {
        if (!StringUtils.hasText(value)) {
            return CREATED_AT;
        }
        return switch (value.toLowerCase()) {
            case "title" -> TITLE;
            case "priority" -> PRIORITY;
            case "startedat", "started_at" -> STARTED_AT;
            case "duedate", "due_date" -> DUE_DATE;
            case "completedat", "completed_at" -> COMPLETED_AT;
            case "createdat", "created_at" -> CREATED_AT;
            default -> CREATED_AT;
        };
    }
}
