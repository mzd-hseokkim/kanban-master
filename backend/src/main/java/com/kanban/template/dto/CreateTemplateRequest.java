package com.kanban.template.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 템플릿 생성 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTemplateRequest {

    @NotBlank(message = "템플릿 이름은 필수입니다")
    @Size(max = 100, message = "템플릿 이름은 100자를 초과할 수 없습니다")
    private String name;

    @Size(max = 500, message = "템플릿 설명은 500자를 초과할 수 없습니다")
    private String description;

    @Size(max = 50, message = "카테고리는 50자를 초과할 수 없습니다")
    private String category;

    @NotNull(message = "공개 여부는 필수입니다")
    private Boolean isPublic;

    /**
     * 템플릿에 포함될 칼럼 목록
     */
    private List<TemplateColumnDto> columns;
}
