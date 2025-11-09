package com.kanban.card.dto;

import com.kanban.card.Card;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 카드 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardResponse {
    private Long id;
    private Long columnId;
    private String title;
    private String description;
    private Integer position;
    private String bgColor;
    private String priority;
    private String assignee;
    private LocalDate dueDate;
    private Boolean isCompleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Card 엔티티를 CardResponse로 변환
     */
    public static CardResponse from(Card card) {
        return CardResponse.builder()
                .id(card.getId())
                .columnId(card.getColumn().getId())
                .title(card.getTitle())
                .description(card.getDescription())
                .position(card.getPosition())
                .bgColor(card.getBgColor())
                .priority(card.getPriority())
                .assignee(card.getAssignee())
                .dueDate(card.getDueDate())
                .isCompleted(card.getIsCompleted())
                .createdAt(card.getCreatedAt())
                .updatedAt(card.getUpdatedAt())
                .build();
    }
}
