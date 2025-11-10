package com.kanban.label.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 라벨 생성/수정 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabelRequest {

    /**
     * 라벨 이름 (필수, 1-30자)
     */
    @NotBlank(message = "라벨 이름은 필수입니다")
    @Size(min = 1, max = 30, message = "라벨 이름은 1-30자 사이여야 합니다")
    private String name;

    /**
     * 색상 토큰 (필수, 1-20자)
     */
    @NotBlank(message = "색상 토큰은 필수입니다")
    @Size(min = 1, max = 20, message = "색상 토큰은 1-20자 사이여야 합니다")
    private String colorToken;

    /**
     * 라벨 설명 (선택, 최대 100자)
     */
    @Size(max = 100, message = "라벨 설명은 최대 100자까지 가능합니다")
    private String description;
}
