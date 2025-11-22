package com.kanban.checklist.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 체크리스트 진행률 응답 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistProgressResponse {

    private Long cardId;
    private Integer totalCount;
    private Integer checkedCount;
    private Double progressPercentage; // 0.0 ~ 100.0

    /**
     * 진행률 계산
     */
    public static ChecklistProgressResponse calculate(Long cardId, long totalCount,
            long checkedCount) {
        double percentage = totalCount > 0 ? (checkedCount * 100.0 / totalCount) : 0.0;

        return ChecklistProgressResponse.builder().cardId(cardId).totalCount((int) totalCount)
                .checkedCount((int) checkedCount)
                .progressPercentage(Math.round(percentage * 10.0) / 10.0) // 소수점 1자리
                .build();
    }
}
