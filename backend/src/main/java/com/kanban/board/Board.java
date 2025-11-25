package com.kanban.board;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.kanban.entity.BaseEntity;
import com.kanban.user.User;
import com.kanban.workspace.Workspace;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "boards",
        indexes = {@Index(name = "idx_boards_workspace_id", columnList = "workspace_id"),
                @Index(name = "idx_boards_owner_id", columnList = "owner_id"),
                @Index(name = "idx_boards_status", columnList = "status"),
                @Index(name = "idx_boards_updated_at", columnList = "updated_at")})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Board extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(length = 20)
    private String themeColor;

    @Column(length = 30)
    private String icon;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BoardStatus status = BoardStatus.ACTIVE;

    @Column(length = 20)
    @Builder.Default
    private String mode = "KANBAN"; // KANBAN or SPRINT

    @Column
    private LocalDateTime deletedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true,
            fetch = FetchType.LAZY)
    @Builder.Default
    @JsonIgnore
    private List<com.kanban.column.BoardColumn> columns = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * 보드를 삭제 상태로 변경
     */
    public void markAsDeleted() {
        this.status = BoardStatus.DELETED;
        this.deletedAt = LocalDateTime.now();
    }

    /**
     * 삭제된 보드를 복구
     */
    public void restore() {
        if (this.status == BoardStatus.DELETED) {
            this.status = BoardStatus.ACTIVE;
            this.deletedAt = null;
        }
    }

    /**
     * 보드를 아카이브
     */
    public void archive() {
        this.status = BoardStatus.ARCHIVED;
    }

    /**
     * 아카이브된 보드를 활성화
     */
    public void unarchive() {
        if (this.status == BoardStatus.ARCHIVED) {
            this.status = BoardStatus.ACTIVE;
        }
    }

    /**
     * 보드가 활성 상태인지 확인
     */
    public boolean isActive() {
        return status == BoardStatus.ACTIVE;
    }

    /**
     * 보드가 삭제 가능한 상태인지 확인 (30일 이상 경과)
     */
    public boolean isDeletableForPermanent() {
        if (status != BoardStatus.DELETED || deletedAt == null) {
            return false;
        }
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        return deletedAt.isBefore(thirtyDaysAgo);
    }
}
