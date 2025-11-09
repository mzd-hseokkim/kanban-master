package com.kanban.column.dto;

import com.kanban.column.BoardColumn;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 칼럼 조회 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ColumnResponse {

    private Long id;

    private Long boardId;

    private String name;

    private String description;

    private Integer position;

    private String bgColor;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public static ColumnResponse from(BoardColumn column) {
        return ColumnResponse.builder()
            .id(column.getId())
            .boardId(column.getBoard().getId())
            .name(column.getName())
            .description(column.getDescription())
            .position(column.getPosition())
            .bgColor(column.getBgColor())
            .createdAt(column.getCreatedAt())
            .updatedAt(column.getUpdatedAt())
            .build();
    }
}
