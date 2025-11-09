package com.kanban.card.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 카드 생성 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCardRequest {

    @NotBlank(message = "카드 제목은 필수입니다")
    private String title;

    private String description;

    private String bgColor;

    private String priority;

    private String assignee;

    private LocalDate dueDate;
}
