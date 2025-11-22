package com.kanban.checklist.dto;

import java.time.LocalDateTime;
import com.kanban.checklist.ChecklistItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 체크리스트 항목 응답 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistItemResponse {

    private Long id;
    private Long cardId;
    private String content;
    private Integer position;
    private Boolean isChecked;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Entity -> DTO 변환
     */
    public static ChecklistItemResponse from(ChecklistItem item) {
        return ChecklistItemResponse.builder().id(item.getId()).cardId(item.getCard().getId())
                .content(item.getContent()).position(item.getPosition())
                .isChecked(item.getIsChecked()).createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt()).build();
    }
}
