package com.kanban.label.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 카드 라벨 할당 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardLabelRequest {

    /**
     * 카드에 할당할 라벨 ID 목록
     */
    @NotNull(message = "라벨 ID 목록은 필수입니다")
    private List<Long> labelIds;
}
