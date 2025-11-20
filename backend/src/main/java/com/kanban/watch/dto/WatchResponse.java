package com.kanban.watch.dto;

import java.time.LocalDateTime;
import com.kanban.watch.CardWatch;
import lombok.*;

/**
 * Watch 상태 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WatchResponse {

    private Long cardId;
    private Long userId;
    @com.fasterxml.jackson.annotation.JsonProperty("isWatching")
    private boolean isWatching;
    private LocalDateTime watchedAt;

    public static WatchResponse from(CardWatch cardWatch) {
        return WatchResponse.builder().cardId(cardWatch.getCardId()).userId(cardWatch.getUserId())
                .isWatching(true).watchedAt(cardWatch.getCreatedAt()).build();
    }

    public static WatchResponse notWatching(Long cardId, Long userId) {
        return WatchResponse.builder().cardId(cardId).userId(userId).isWatching(false)
                .watchedAt(null).build();
    }
}
