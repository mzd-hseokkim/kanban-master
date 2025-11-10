package com.kanban.card;

import com.kanban.entity.BaseEntity;
import com.kanban.column.BoardColumn;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * 카드(Card) 엔티티
 * 칼럼에 속하는 개별 카드 항목
 */
@Entity
@Table(name = "card")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Card extends BaseEntity {

    /**
     * 카드 ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 카드가 속한 칼럼
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "column_id", nullable = false)
    private BoardColumn column;

    /**
     * 카드 제목
     */
    @Column(nullable = false)
    private String title;

    /**
     * 카드 설명
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * 카드 순서 (칼럼 내에서의 위치)
     */
    @Column(nullable = false)
    private Integer position;

    /**
     * 카드 색상 (HEX 코드)
     */
    private String bgColor;

    /**
     * 카드 우선순위 (HIGH, MEDIUM, LOW)
     */
    @Column(name = "priority", length = 20)
    private String priority;

    /**
     * 담당자 (추후 User 관계 추가 가능)
     */
    private String assignee;

    /**
     * 마감 날짜
     */
    private LocalDate dueDate;

    /**
     * 완료 여부
     */
    @Column(name = "is_completed", nullable = false)
    @Builder.Default
    private Boolean isCompleted = false;
}
