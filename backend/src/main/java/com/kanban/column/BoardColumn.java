package com.kanban.column;

import com.kanban.board.Board;
import com.kanban.card.Card;
import com.kanban.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 칼럼(BoardColumn) 엔티티
 * 보드 내의 작업 상태를 나타내는 칼럼을 관리
 * 예: To Do, In Progress, Done
 */
@Entity
@Table(
    name = "columns",
    indexes = {
        @Index(name = "idx_columns_board_id", columnList = "board_id"),
        @Index(name = "idx_columns_position", columnList = "board_id,position")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardColumn extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    /**
     * 칼럼 내 위치/순서 (0부터 시작)
     * 드래그 앤 드롭으로 순서 변경 시 업데이트
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer position = 0;

    /**
     * 칼럼 배경색 (Tailwind 클래스명 또는 Hex 코드)
     * 예: "pastel-blue-100", "#e8f1ff"
     */
    @Column(length = 50)
    private String bgColor;

    /**
     * 칼럼 생성 시간
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 칼럼 수정 시간
     */
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /**
     * 칼럼에 속한 카드 목록
     */
    @OneToMany(mappedBy = "column", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Card> cards = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
