package com.kanban.card.dto;

import java.util.List;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 카드 ID 목록을 전달받는 일괄 처리 요청 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkCardIdsRequest {

    @NotEmpty(message = "카드 ID 목록은 비어 있을 수 없습니다")
    private List<Long> cardIds;
}
