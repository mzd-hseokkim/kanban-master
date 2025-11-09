package com.kanban.activity;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {

    /**
     * 특정 범위(보드 또는 카드)의 활동 로그를 페이지네이션으로 조회 (actor 즉시 로딩)
     */
    @Query("SELECT a FROM Activity a JOIN FETCH a.actor WHERE a.scopeType = :scopeType AND a.scopeId = :scopeId ORDER BY a.createdAt DESC")
    Page<Activity> findByScopeTypeAndScopeIdOrderByCreatedAtDesc(
        @Param("scopeType") ActivityScopeType scopeType,
        @Param("scopeId") Long scopeId,
        Pageable pageable
    );

    /**
     * 특정 범위의 활동 중 특정 사용자의 활동만 조회 (actor 즉시 로딩)
     */
    @Query("SELECT a FROM Activity a JOIN FETCH a.actor WHERE a.scopeType = :scopeType AND a.scopeId = :scopeId AND a.actor.id = :actorId ORDER BY a.createdAt DESC")
    Page<Activity> findByActorActivity(
        @Param("scopeType") ActivityScopeType scopeType,
        @Param("scopeId") Long scopeId,
        @Param("actorId") Long actorId,
        Pageable pageable
    );

    /**
     * 특정 사용자의 모든 활동 조회 (actor 즉시 로딩)
     */
    @Query("SELECT a FROM Activity a JOIN FETCH a.actor WHERE a.actor.id = :actorId ORDER BY a.createdAt DESC")
    Page<Activity> findByActorIdOrderByCreatedAtDesc(@Param("actorId") Long actorId, Pageable pageable);

    /**
     * 특정 이벤트 타입의 활동 조회 (actor 즉시 로딩)
     */
    @Query("SELECT a FROM Activity a JOIN FETCH a.actor WHERE a.scopeType = :scopeType AND a.scopeId = :scopeId AND a.eventType = :eventType ORDER BY a.createdAt DESC")
    Page<Activity> findByScopeTypeAndScopeIdAndEventTypeOrderByCreatedAtDesc(
        @Param("scopeType") ActivityScopeType scopeType,
        @Param("scopeId") Long scopeId,
        @Param("eventType") ActivityEventType eventType,
        Pageable pageable
    );

    /**
     * 특정 보드의 모든 활동 조회 (actor 즉시 로딩)
     */
    @Query("SELECT a FROM Activity a JOIN FETCH a.actor WHERE (a.scopeType = 'BOARD' AND a.scopeId = :boardId) OR (a.scopeId IN (SELECT c.id FROM com.kanban.card.Card c WHERE c.column.board.id = :boardId)) ORDER BY a.createdAt DESC")
    Page<Activity> findAllBoardActivities(@Param("boardId") Long boardId, Pageable pageable);
}
