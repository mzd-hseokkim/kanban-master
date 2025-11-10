package com.kanban.template;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 템플릿 칼럼 엔터티
 * 템플릿에 포함될 칼럼 정보
 */
@Entity
@Table(name = "template_columns")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class TemplateColumn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 칼럼 이름
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * 칼럼 설명
     */
    @Column(length = 500)
    private String description;

    /**
     * 칼럼 위치 (순서)
     */
    @Column(nullable = false)
    private Integer position;

    /**
     * 배경색
     */
    @Column(length = 50)
    private String bgColor;

    /**
     * 소속 템플릿
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    @Setter
    private BoardTemplate template;

    /**
     * 칼럼 정보 업데이트
     */
    public void update(String name, String description, Integer position, String bgColor) {
        if (name != null) {
            this.name = name;
        }
        if (description != null) {
            this.description = description;
        }
        if (position != null) {
            this.position = position;
        }
        if (bgColor != null) {
            this.bgColor = bgColor;
        }
    }
}
