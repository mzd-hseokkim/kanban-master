package com.kanban.checklist.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 체크리스트 항목 생성 요청 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateChecklistItemRequest {

    @NotBlank(message = "체크리스트 내용은 필수입니다")
    @Size(max = 500, message = "체크리스트 내용은 500자를 초과할 수 없습니다")
    private String content;
}
