package com.kanban.card.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 카드 수정 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCardRequest {

    private String title;

    private String description;

    private String bgColor;

    private String priority;

    private String assignee;

    private Integer position;

    private LocalDate dueDate;

    private Long columnId;

    private Boolean isCompleted;
}
