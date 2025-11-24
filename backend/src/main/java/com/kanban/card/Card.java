package com.kanban.card;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.kanban.attachment.CardAttachment;
import com.kanban.checklist.ChecklistItem;
import com.kanban.column.BoardColumn;
import com.kanban.comment.Comment;
import com.kanban.entity.BaseEntity;
import com.kanban.label.CardLabel;
import com.kanban.notification.NotificationLog;
import jakarta.persistence.*;
import lombok.*;

/**
 * 카드(Card) 엔티티 칼럼에 속하는 개별 카드 항목
 */
@Entity
@Table(name = "card")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"column", "assignee", "childCards",
        "cardLabels", "checklistItems", "attachments", "comments", "notificationLogs"})
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
     * 담당자 (User 엔티티와의 관계)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private com.kanban.user.User assignee;

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

    /**
     * 작업 시작 시각 (명시적 시작 이벤트가 있을 때 설정)
     */
    private LocalDateTime startedAt;

    /**
     * 완료 시각 (isCompleted가 true가 될 때 기록)
     */
    private LocalDateTime completedAt;

    /**
     * 아카이브 여부
     */
    @Column(name = "is_archived")
    @Builder.Default
    private Boolean isArchived = false;

    /**
     * 아카이브 시각
     */
    private LocalDateTime archivedAt;

    // Spec § 6. 백엔드 규격 - 데이터베이스 스키마 확장
    // FR-06a: 부모-자식 관계 데이터 모델

    /**
     * 부모 카드 (Self-Referential ManyToOne) 1단계 계층 구조만 지원 (부모 → 자식, 손자 불가)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_card_id")
    private Card parentCard;

    /**
     * 자식 카드 목록 (OneToMany) mappedBy로 양방향 관계 설정 Cascade 없음: 부모 삭제 시 자식 삭제 안 함 (서비스 레벨에서 차단)
     */
    @OneToMany(mappedBy = "parentCard")
    @Builder.Default
    private List<Card> childCards = new ArrayList<>();

    /**
     * 카드 라벨 목록
     */
    @OneToMany(mappedBy = "card", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CardLabel> cardLabels = new ArrayList<>();

    /**
     * 체크리스트 항목 목록
     */
    @OneToMany(mappedBy = "card", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ChecklistItem> checklistItems = new ArrayList<>();

    /**
     * 첨부파일 목록
     */
    @OneToMany(mappedBy = "card", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CardAttachment> attachments = new ArrayList<>();

    /**
     * 댓글 목록
     */
    @OneToMany(mappedBy = "card", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    /**
     * 알림 로그 목록
     */
    @OneToMany(mappedBy = "card", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<NotificationLog> notificationLogs = new ArrayList<>();
}
