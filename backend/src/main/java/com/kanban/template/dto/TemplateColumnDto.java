package com.kanban.template.dto;

import com.kanban.template.TemplateColumn;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 템플릿 칼럼 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TemplateColumnDto {

    private Long id;
    private String name;
    private String description;
    private Integer position;
    private String bgColor;

    /**
     * 엔터티를 DTO로 변환
     */
    public static TemplateColumnDto from(TemplateColumn column) {
        return TemplateColumnDto.builder()
                .id(column.getId())
                .name(column.getName())
                .description(column.getDescription())
                .position(column.getPosition())
                .bgColor(column.getBgColor())
                .build();
    }

    /**
     * DTO를 엔터티로 변환
     */
    public TemplateColumn toEntity() {
        return TemplateColumn.builder()
                .name(name)
                .description(description)
                .position(position)
                .bgColor(bgColor)
                .build();
    }
}
