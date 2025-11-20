package com.kanban.card.dto;

import java.time.LocalDate;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 카드 수정 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCardRequest {

    private String title;

    @Size(max = 50000, message = "설명은 50,000자를 초과할 수 없습니다")
    private String description;

    private String bgColor;

    private String priority;

    private Long assigneeId;

    private Integer position;

    private LocalDate dueDate;

    private Long columnId;

    private Boolean isCompleted;
}
