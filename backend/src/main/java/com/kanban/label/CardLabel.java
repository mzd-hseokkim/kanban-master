package com.kanban.label;

import com.kanban.card.Card;
import com.kanban.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * 카드-라벨 중간 테이블 (Many-to-Many 관계)
 * 카드와 라벨의 연결 정보
 */
@Entity
@Table(
    name = "card_labels",
    indexes = {
        @Index(name = "idx_card_labels_card_id", columnList = "card_id"),
        @Index(name = "idx_card_labels_label_id", columnList = "label_id")
    },
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_card_labels",
            columnNames = {"card_id", "label_id"}
        )
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CardLabel extends BaseEntity {

    /**
     * 카드-라벨 연결 ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 카드
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    private Card card;

    /**
     * 라벨
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "label_id", nullable = false)
    private Label label;

    /**
     * 편의 생성 메서드
     */
    public static CardLabel of(Card card, Label label) {
        return CardLabel.builder()
                .card(card)
                .label(label)
                .build();
    }
}
