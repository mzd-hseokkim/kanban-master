package com.kanban.notification.event;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardEvent implements Serializable {
    private String type; // e.g., "BOARD_UPDATED", "CARD_MOVED"
    private Long boardId;
    private transient Object payload; // The actual data changed (optional or specific DTO)
    private Long triggeredByUserId;
    private long timestamp;

    public enum EventType {
        BOARD_CREATED, BOARD_UPDATED, BOARD_DELETED, COLUMN_CREATED, COLUMN_UPDATED, COLUMN_DELETED, COLUMN_REORDERED, CARD_CREATED, CARD_UPDATED, CARD_DELETED, CARD_MOVED
    }
}
