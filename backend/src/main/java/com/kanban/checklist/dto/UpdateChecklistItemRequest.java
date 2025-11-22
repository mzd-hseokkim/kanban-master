package com.kanban.checklist.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 체크리스트 항목 수정 요청 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateChecklistItemRequest {

    @Size(max = 500, message = "체크리스트 내용은 500자를 초과할 수 없습니다")
    private String content;

    private Boolean isChecked;
}
