package com.kanban.column.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 칼럼 수정 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateColumnRequest {

    private String name;

    private String description;

    private String bgColor;

    private Integer position;
}
