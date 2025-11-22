package com.kanban.checklist;

import com.kanban.card.Card;
import com.kanban.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * 체크리스트 항목 엔티티 카드 내에서 세부 작업(to-do items)을 관리
 */
@Entity
@Table(name = "checklist_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 체크리스트가 속한 카드
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    private Card card;

    /**
     * 체크리스트 항목 내용
     */
    @Column(nullable = false, length = 500)
    private String content;

    /**
     * 순서 (정렬용)
     */
    @Column(nullable = false)
    private Integer position;

    /**
     * 체크 여부
     */
    @Column(name = "is_checked", nullable = false)
    @Builder.Default
    private Boolean isChecked = false;
}
