package com.kanban.label.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 라벨 순서 변경 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabelReorderRequest {

    /**
     * 순서 변경할 라벨 ID 목록 (순서대로)
     */
    @NotNull(message = "라벨 ID 목록은 필수입니다")
    private List<Long> labelIds;
}
