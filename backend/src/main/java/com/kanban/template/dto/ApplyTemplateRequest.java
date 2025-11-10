package com.kanban.template.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 템플릿 적용 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplyTemplateRequest {

    @NotNull(message = "템플릿 ID는 필수입니다")
    private Long templateId;

    @NotBlank(message = "보드 이름은 필수입니다")
    @Size(max = 100, message = "보드 이름은 100자를 초과할 수 없습니다")
    private String boardName;

    @Size(max = 500, message = "보드 설명은 500자를 초과할 수 없습니다")
    private String boardDescription;
}
