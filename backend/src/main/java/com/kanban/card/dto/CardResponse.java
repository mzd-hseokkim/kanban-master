package com.kanban.card.dto;

import com.kanban.card.Card;
import com.kanban.label.dto.LabelResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

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
    private List<LabelResponse> labels;

    /**
     * Card 엔티티를 CardResponse로 변환
     */
    public static CardResponse from(Card card) {
        return from(card, Collections.emptyList());
    }

    public static CardResponse from(Card card, List<LabelResponse> labels) {
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
                .labels(labels)
                .build();
    }
}
