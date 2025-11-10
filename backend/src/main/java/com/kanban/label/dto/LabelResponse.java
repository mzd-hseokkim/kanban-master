package com.kanban.label.dto;

import com.kanban.label.Label;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 라벨 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabelResponse {

    /**
     * 라벨 ID
     */
    private Long id;

    /**
     * 보드 ID
     */
    private Long boardId;

    /**
     * 라벨 이름
     */
    private String name;

    /**
     * 색상 토큰
     */
    private String colorToken;

    /**
     * 라벨 설명
     */
    private String description;

    /**
     * 표시 순서
     */
    private Integer displayOrder;

    /**
     * 생성 일시
     */
    private LocalDateTime createdAt;

    /**
     * 수정 일시
     */
    private LocalDateTime updatedAt;

    /**
     * Label 엔티티를 LabelResponse로 변환
     */
    public static LabelResponse from(Label label) {
        return LabelResponse.builder()
                .id(label.getId())
                .boardId(label.getBoard().getId())
                .name(label.getName())
                .colorToken(label.getColorToken())
                .description(label.getDescription())
                .displayOrder(label.getDisplayOrder())
                .createdAt(label.getCreatedAt())
                .updatedAt(label.getUpdatedAt())
                .build();
    }
}
