package com.kanban.label;

import com.kanban.board.Board;
import com.kanban.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * 라벨(Label) 엔티티
 * 보드에 속하는 라벨 정보
 */
@Entity
@Table(
    name = "labels",
    indexes = {
        @Index(name = "idx_labels_board_id", columnList = "board_id"),
        @Index(name = "idx_labels_order", columnList = "board_id, display_order")
    },
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_labels_board_name",
            columnNames = {"board_id", "name"}
        )
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Label extends BaseEntity {

    /**
     * 라벨 ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 라벨이 속한 보드
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    /**
     * 라벨 이름 (최대 30자)
     */
    @Column(nullable = false, length = 30)
    private String name;

    /**
     * 색상 토큰 (디자인 시스템 색상 값, 최대 20자)
     */
    @Column(name = "color_token", nullable = false, length = 20)
    private String colorToken;

    /**
     * 라벨 설명 (선택 사항, 최대 100자)
     */
    @Column(length = 100)
    private String description;

    /**
     * 라벨 표시 순서 (정렬용)
     */
    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    /**
     * 라벨 정보 업데이트
     */
    public void updateInfo(String name, String colorToken, String description) {
        if (name != null && !name.isBlank()) {
            this.name = name;
        }
        if (colorToken != null && !colorToken.isBlank()) {
            this.colorToken = colorToken;
        }
        this.description = description;
    }

    /**
     * 라벨 순서 변경
     */
    public void updateOrder(Integer newOrder) {
        if (newOrder != null && newOrder >= 0) {
            this.displayOrder = newOrder;
        }
    }
}
