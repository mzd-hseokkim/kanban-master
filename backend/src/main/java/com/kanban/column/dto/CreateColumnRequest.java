package com.kanban.column.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 칼럼 생성 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateColumnRequest {

    @NotBlank(message = "칼럼 이름은 필수입니다")
    private String name;

    private String description;

    private String bgColor;
}
