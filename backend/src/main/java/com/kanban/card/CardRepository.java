package com.kanban.card;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 카드(Card) 데이터 접근 계층
 */
@Repository
public interface CardRepository extends JpaRepository<Card, Long>, CardRepositoryCustom {

        /**
         * 특정 칼럼의 모든 카드를 위치 순서대로 조회
         */
        @Query("SELECT c FROM Card c WHERE c.column.id = :columnId ORDER BY c.position ASC")
        List<Card> findByColumnIdOrderByPosition(@Param("columnId") Long columnId);

        /**
         * 특정 칼럼의 아카이브되지 않은 카드를 위치 순서대로 조회
         */
        @Query("SELECT c FROM Card c WHERE c.column.id = :columnId AND c.isArchived = false ORDER BY c.position ASC")
        List<Card> findByColumnIdAndIsArchivedFalseOrderByPosition(
                        @Param("columnId") Long columnId);

        /**
         * 특정 칼럼의 아카이브된 카드를 아카이브 시각 역순으로 조회
         */
        @Query("SELECT c FROM Card c WHERE c.column.id = :columnId AND c.isArchived = true ORDER BY c.archivedAt DESC")
        List<Card> findByColumnIdAndIsArchivedTrueOrderByArchivedAt(
                        @Param("columnId") Long columnId);

        /**
         * 특정 보드의 아카이브된 카드를 아카이브 시각 역순으로 조회
         */
        @Query("SELECT c FROM Card c WHERE c.column.board.id = :boardId AND c.isArchived = true ORDER BY c.archivedAt DESC")
        List<Card> findByBoardIdAndIsArchivedTrueOrderByArchivedAt(@Param("boardId") Long boardId);

        /**
         * 마감일이 특정 기간 내에 있는 카드 조회 (아카이브되지 않은 카드만)
         */
        @Query("SELECT c FROM Card c WHERE c.dueDate BETWEEN :start AND :end AND c.isArchived = false")
        List<Card> findCardsDueBetween(@Param("start") java.time.LocalDateTime start,
                        @Param("end") java.time.LocalDateTime end);



        /**
         * 특정 칼럼의 카드 개수 조회
         */
        @Query("SELECT COUNT(c) FROM Card c WHERE c.column.id = :columnId")
        int countByColumnId(@Param("columnId") Long columnId);

        /**
         * 칼럼과 ID로 카드 조회 권한 검증 시 사용
         */
        @Query("SELECT c FROM Card c WHERE c.id = :cardId AND c.column.id = :columnId")
        Optional<Card> findByIdAndColumnId(@Param("cardId") Long cardId,
                        @Param("columnId") Long columnId);

        /**
         * 특정 위치 이상의 카드들의 position을 업데이트 (드래그 앤 드롭으로 카드 순서 변경 시 사용)
         */
        @Modifying
        @Query("UPDATE Card c SET c.position = c.position + :offset WHERE c.column.id = :columnId AND c.position >= :fromPosition")
        void updatePositionsFrom(@Param("columnId") Long columnId,
                        @Param("fromPosition") Integer fromPosition,
                        @Param("offset") Integer offset);

        /**
         * 특정 칼럼의 모든 카드 삭제
         */
        @Modifying
        @Query("DELETE FROM Card c WHERE c.column.id = :columnId")
        void deleteByColumnId(@Param("columnId") Long columnId);

        // Spec § 6. 백엔드 규격 - Repository 확장
        // FR-06d, FR-06h: 자식 카드 조회 및 부모 카드 삭제 시 자식 처리

        /**
         * 특정 부모 카드의 자식 카드 목록 조회 생성일 오름차순 정렬 (결정 사항 1)
         */
        @Query("SELECT c FROM Card c WHERE c.parentCard.id = :parentCardId ORDER BY c.createdAt ASC")
        List<Card> findByParentCardIdOrderByCreatedAt(@Param("parentCardId") Long parentCardId);

        /**
         * 특정 부모 카드의 자식 카드 개수 조회 FR-06g: 자식 개수 표시
         */
        @Query("SELECT COUNT(c) FROM Card c WHERE c.parentCard.id = :parentCardId")
        int countByParentCardId(@Param("parentCardId") Long parentCardId);

        /**
         * ID로 카드 조회 (부모 카드 정보 포함) N+1 문제 방지를 위해 LEFT JOIN FETCH 사용
         */
        @Query("SELECT c FROM Card c LEFT JOIN FETCH c.parentCard WHERE c.id = :cardId")
        Optional<Card> findByIdWithParent(@Param("cardId") Long cardId);

        /**
         * 워크스페이스 내의 총 카드 개수
         */
        @Query("SELECT COUNT(c) FROM Card c WHERE c.column.board.workspace.id = :workspaceId")
        long countByWorkspaceId(@Param("workspaceId") Long workspaceId);

        /**
         * 워크스페이스 내의 완료된 카드 개수
         */
        @Query("SELECT COUNT(c) FROM Card c WHERE c.column.board.workspace.id = :workspaceId AND c.isCompleted = true")
        long countByWorkspaceIdAndIsCompletedTrue(@Param("workspaceId") Long workspaceId);

        /**
         * 워크스페이스 내의 미완료 카드 개수
         */
        @Query("SELECT COUNT(c) FROM Card c WHERE c.column.board.workspace.id = :workspaceId AND c.isCompleted = false")
        long countByWorkspaceIdAndIsCompletedFalse(@Param("workspaceId") Long workspaceId);

        /**
         * 워크스페이스 내의 지연된 카드 개수 (마감일이 지났고 미완료인 카드)
         */
        @Query("SELECT COUNT(c) FROM Card c WHERE c.column.board.workspace.id = :workspaceId AND c.isCompleted = false AND c.dueDate < :today")
        long countOverdueByWorkspaceId(@Param("workspaceId") Long workspaceId,
                        @Param("today") java.time.LocalDate today);

        /**
         * 워크스페이스 내의 마감 임박 카드 개수 (마감일이 2일 이내이고 미완료인 카드)
         */
        @Query("SELECT COUNT(c) FROM Card c WHERE c.column.board.workspace.id = :workspaceId AND c.isCompleted = false AND c.dueDate BETWEEN CURRENT_DATE AND :dueSoonLimit")
        long countDueSoonByWorkspaceId(@Param("workspaceId") Long workspaceId,
                        @Param("dueSoonLimit") java.time.LocalDate dueSoonLimit);

        /**
         * 워크스페이스 내의 담당자 없고 우선순위 높은 카드 개수
         */
        @Query("SELECT COUNT(c) FROM Card c WHERE c.column.board.workspace.id = :workspaceId AND c.assignee IS NULL AND c.priority = 'HIGH' AND c.isCompleted = false")
        long countUnassignedHighPriorityByWorkspaceId(@Param("workspaceId") Long workspaceId);

        /**
         * 워크스페이스 내의 최근 생성된 카드 개수
         */
        @Query("SELECT COUNT(c) FROM Card c WHERE c.column.board.workspace.id = :workspaceId AND c.createdAt >= :since")
        long countByWorkspaceIdAndCreatedAtAfter(@Param("workspaceId") Long workspaceId,
                        @Param("since") java.time.LocalDateTime since);

        /**
         * 워크스페이스 내의 최근 수정된 카드 개수
         */
        @Query("SELECT COUNT(c) FROM Card c WHERE c.column.board.workspace.id = :workspaceId AND c.updatedAt >= :since")
        long countByWorkspaceIdAndUpdatedAtAfter(@Param("workspaceId") Long workspaceId,
                        @Param("since") java.time.LocalDateTime since);

        /**
         * 워크스페이스 내 보드별 지연 카드 개수 (Top N)
         */
        @Query("SELECT c.column.board.id as boardId, c.column.board.name as boardName, COUNT(c) as overdueCount "
                        + "FROM Card c "
                        + "WHERE c.column.board.workspace.id = :workspaceId AND c.isCompleted = false AND c.dueDate < :today "
                        + "GROUP BY c.column.board.id, c.column.board.name "
                        + "ORDER BY overdueCount DESC")
        List<Object[]> findBoardsByOverdueCount(@Param("workspaceId") Long workspaceId,
                        @Param("today") java.time.LocalDate today,
                        org.springframework.data.domain.Pageable pageable);

        /**
         * 보드 내 컬럼별 인사이트 조회
         */
        @Query("SELECT c.column.id as columnId, c.column.name as columnName, "
                        + "COUNT(c) as total, "
                        + "SUM(CASE WHEN c.isCompleted = false AND c.dueDate < :today THEN 1 ELSE 0 END) as overdue, "
                        + "SUM(CASE WHEN c.isCompleted = false AND c.dueDate BETWEEN :today AND :dueSoonLimit THEN 1 ELSE 0 END) as dueSoon "
                        + "FROM Card c " + "WHERE c.column.board.id = :boardId "
                        + "GROUP BY c.column.id, c.column.name")
        List<Object[]> findColumnInsightsByBoardId(@Param("boardId") Long boardId,
                        @Param("today") java.time.LocalDate today,
                        @Param("dueSoonLimit") java.time.LocalDate dueSoonLimit);

        /**
         * 보드 내 완료/미완료 카드 개수
         */
        @Query("SELECT c.isCompleted, COUNT(c) FROM Card c WHERE c.column.board.id = :boardId GROUP BY c.isCompleted")
        List<Object[]> findCompletionStatsByBoardId(@Param("boardId") Long boardId);

        /**
         * 보드 내 우선순위별 카드 개수
         */
        @Query("SELECT c.priority, COUNT(c) FROM Card c WHERE c.column.board.id = :boardId GROUP BY c.priority")
        List<Object[]> findPriorityStatsByBoardId(@Param("boardId") Long boardId);

        /**
         * 보드 내 담당자별 인사이트 조회
         */
        @Query("SELECT c.assignee.id as assigneeId, c.assignee.name as assigneeName, "
                        + "COUNT(c) as total, "
                        + "SUM(CASE WHEN c.isCompleted = false AND c.dueDate < :today THEN 1 ELSE 0 END) as overdue, "
                        + "SUM(CASE WHEN c.isCompleted = true THEN 1 ELSE 0 END) as completed "
                        + "FROM Card c " + "WHERE c.column.board.id = :boardId "
                        + "GROUP BY c.assignee.id, c.assignee.name " + "ORDER BY total DESC")
        List<Object[]> findAssigneeInsightsByBoardId(@Param("boardId") Long boardId,
                        @Param("today") java.time.LocalDate today);

        /**
         * 보드 내 마감일 없는 미완료 카드 개수
         */
        @Query("SELECT COUNT(c) FROM Card c WHERE c.column.board.id = :boardId AND c.isCompleted = false AND c.dueDate IS NULL")
        long countByBoardIdAndDueDateIsNullAndIsCompletedFalse(@Param("boardId") Long boardId);

        /**
         * 칼럼 내에서 제목으로 카드 조회 (대소문자 무시)
         */
        @Query("SELECT c FROM Card c WHERE c.column.id = :columnId AND LOWER(c.title) = LOWER(:title)")
        Optional<Card> findByColumnIdAndTitleIgnoreCase(@Param("columnId") Long columnId,
                        @Param("title") String title);

        /**
         * 보드 내에서 제목으로 카드 조회 (대소문자 무시)
         */
        @Query("SELECT c FROM Card c WHERE c.column.board.id = :boardId AND LOWER(c.title) = LOWER(:title)")
        List<Card> findByBoardIdAndTitleIgnoreCase(@Param("boardId") Long boardId,
                        @Param("title") String title);

        /**
         * 보드 내 라벨별 카드 개수 조회
         */
        @Query("SELECT l.id as labelId, l.name as labelName, l.colorToken as colorToken, COUNT(c) as count "
                        + "FROM Card c " + "JOIN c.cardLabels cl " + "JOIN cl.label l "
                        + "WHERE c.column.board.id = :boardId "
                        + "GROUP BY l.id, l.name, l.colorToken " + "ORDER BY count DESC")
        List<Object[]> findLabelInsightsByBoardId(@Param("boardId") Long boardId);

        @Query("SELECT c FROM Card c WHERE c.column.board.id = :boardId")
        List<Card> findByBoardId(@Param("boardId") Long boardId);

        @Query("SELECT c FROM Card c WHERE c.column.board.id = :boardId AND c.isCompleted = true")
        List<Card> findByBoardIdAndIsCompletedTrue(@Param("boardId") Long boardId);

        /**
         * 스프린트에 속한 카드 조회
         */
        List<Card> findBySprintId(Long sprintId);

        /**
         * 보드의 백로그 카드 조회 (스프린트 미할당)
         */
        @Query("SELECT c FROM Card c WHERE c.column.board.id = :boardId AND c.sprint IS NULL AND c.isArchived = false")
        List<Card> findBacklogCardsByBoardId(@Param("boardId") Long boardId);

        /**
         * 스프린트 내 미완료 카드 조회 (롤오버 대상)
         */
        List<Card> findBySprintIdAndIsCompletedFalse(Long sprintId);

        /**
         * 스프린트 내 완료된 카드 조회
         */
        List<Card> findBySprintIdAndIsCompletedTrue(Long sprintId);

        /**
         * 여러 스프린트의 카드 개수를 한 번에 조회 (N+1 문제 방지)
         */
        @Query("SELECT c.sprint.id, COUNT(c) FROM Card c WHERE c.sprint.id IN :sprintIds GROUP BY c.sprint.id")
        List<Object[]> countBySprintIds(@Param("sprintIds") List<Long> sprintIds);

        /**
         * 스프린트 ID로 카드 개수를 Map으로 반환하는 기본 메서드
         */
        default java.util.Map<Long, Long> countCardsBySprintIds(List<Long> sprintIds) {
                if (sprintIds == null || sprintIds.isEmpty()) {
                        return java.util.Collections.emptyMap();
                }
                return countBySprintIds(sprintIds).stream()
                                .collect(java.util.stream.Collectors.toMap(row -> (Long) row[0],
                                                row -> (Long) row[1]));
        }

        /**
         * 스프린트별 스토리 포인트 합계와 완료 포인트 합계를 한 번에 조회
         */
        @Query("SELECT c.sprint.id, "
                        + "SUM(COALESCE(c.storyPoints, 0)), "
                        + "SUM(CASE WHEN c.isCompleted = true THEN COALESCE(c.storyPoints, 0) ELSE 0 END) "
                        + "FROM Card c WHERE c.sprint.id IN :sprintIds GROUP BY c.sprint.id")
        List<Object[]> sumPointsBySprintIds(@Param("sprintIds") List<Long> sprintIds);

        /**
         * 스프린트별 포인트 요약 Map 반환
         */
        default java.util.Map<Long, PointSummary> sumPointsBySprintIdsMap(List<Long> sprintIds) {
                if (sprintIds == null || sprintIds.isEmpty()) {
                        return java.util.Collections.emptyMap();
                }
                return sumPointsBySprintIds(sprintIds).stream().collect(java.util.stream.Collectors
                                .toMap(row -> (Long) row[0], row -> new PointSummary(
                                                ((Long) row[1]).intValue(), ((Long) row[2]).intValue())));
        }

        /**
         * 스프린트 포인트 합계 DTO
         */
        record PointSummary(int totalPoints, int completedPoints) {
        }
}
