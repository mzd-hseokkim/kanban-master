package com.kanban.template;

import com.kanban.workspace.Workspace;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 보드 템플릿 엔터티
 * 보드 구조를 템플릿으로 저장하고 재사용
 */
@Entity
@Table(name = "board_templates")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class BoardTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 템플릿 이름
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * 템플릿 설명
     */
    @Column(length = 500)
    private String description;

    /**
     * 템플릿 카테고리 (예: Software Development, Marketing, Personal)
     */
    @Column(length = 50)
    private String category;

    /**
     * 공개 템플릿 여부 (전체 사용자가 사용 가능)
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isPublic = false;

    /**
     * 워크스페이스 (private 템플릿인 경우)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id")
    private Workspace workspace;

    /**
     * 템플릿 칼럼 목록
     */
    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TemplateColumn> columns = new ArrayList<>();

    /**
     * 생성 일시
     */
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 수정 일시
     */
    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /**
     * 칼럼 추가
     */
    public void addColumn(TemplateColumn column) {
        columns.add(column);
        column.setTemplate(this);
    }

    /**
     * 칼럼 제거
     */
    public void removeColumn(TemplateColumn column) {
        columns.remove(column);
        column.setTemplate(null);
    }

    /**
     * 템플릿 정보 업데이트
     */
    public void update(String name, String description, String category, Boolean isPublic) {
        if (name != null) {
            this.name = name;
        }
        if (description != null) {
            this.description = description;
        }
        if (category != null) {
            this.category = category;
        }
        if (isPublic != null) {
            this.isPublic = isPublic;
        }
    }
}
