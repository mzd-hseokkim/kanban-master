package com.kanban.history;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CardChangedEvent {
    private Long cardId;
    private Long boardId;
    private Long userId;
    private List<CardChange> changes;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CardChange {
        private String field;
        private String from;
        private String to;
    }
}
