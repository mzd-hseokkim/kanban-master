package com.kanban.watch.dto;

import java.time.LocalDateTime;
import com.kanban.card.dto.CardResponse;
import lombok.*;

/**
 * Watch 중인 카드 정보 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WatchedCardResponse {

    private Long watchId;
    private CardResponse card;
    private Long workspaceId;
    private Long boardId;
    private String boardName;
    private Long columnId;
    private String columnName;
    private LocalDateTime watchedAt;
}
