package com.kanban.checklist.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 체크리스트 항목 순서 변경 요청 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReorderChecklistItemRequest {

    @NotNull(message = "새로운 위치는 필수입니다")
    private Integer newPosition;
}
