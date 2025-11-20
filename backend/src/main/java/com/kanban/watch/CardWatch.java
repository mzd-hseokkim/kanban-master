package com.kanban.watch;

import com.kanban.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * 카드 Watch 엔티티 사용자가 특정 카드를 관심 카드로 등록하여 변경사항 알림을 받을 수 있도록 함
 */
@Entity
@Table(name = "card_watch",
        uniqueConstraints = @UniqueConstraint(columnNames = {"card_id", "user_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CardWatch extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Watch 대상 카드 ID
     */
    @Column(name = "card_id", nullable = false)
    private Long cardId;

    /**
     * Watch 등록한 사용자 ID
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;
}
