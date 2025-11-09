package com.kanban.activity;

import com.kanban.entity.BaseEntity;
import com.kanban.user.User;
import jakarta.persistence.*;
import lombok.*;

/**
 * 활동 로그 엔터티
 * 모든 주요 이벤트(보드/칼럼/카드 생성·수정·삭제, 권한 변경 등)를 기록
 */
@Entity
@Table(
    name = "activities",
    indexes = {
        @Index(name = "idx_activities_scope", columnList = "scope_type,scope_id"),
        @Index(name = "idx_activities_actor", columnList = "actor_id"),
        @Index(name = "idx_activities_created_at", columnList = "created_at"),
        @Index(name = "idx_activities_event_type", columnList = "event_type")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Activity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 활동의 범위 (BOARD 또는 CARD)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ActivityScopeType scopeType;

    /**
     * 범위 ID (보드 ID 또는 카드 ID)
     */
    @Column(nullable = false)
    private Long scopeId;

    /**
     * 이벤트 유형
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ActivityEventType eventType;

    /**
     * 수행 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    /**
     * 활동 메시지 (사용자에게 표시될 메시지)
     */
    @Column(nullable = false, length = 500)
    private String message;

    /**
     * 추가 데이터 (JSON 형식으로 이전/이후 값 등)
     */
    @Column(columnDefinition = "TEXT")
    private String payload;
}
