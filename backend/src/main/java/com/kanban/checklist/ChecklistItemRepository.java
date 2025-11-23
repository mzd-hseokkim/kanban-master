package com.kanban.checklist;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 체크리스트 항목 Repository
 */
@Repository
public interface ChecklistItemRepository extends JpaRepository<ChecklistItem, Long> {

    /**
     * 카드의 체크리스트 항목 조회 (순서대로)
     */
    List<ChecklistItem> findByCardIdOrderByPosition(Long cardId);

    /**
     * 카드의 전체 체크리스트 항목 개수
     */
    long countByCardId(Long cardId);

    /**
     * 카드의 완료된 체크리스트 항목 개수
     */
    long countByCardIdAndIsCheckedTrue(Long cardId);

    /**
     * 특정 위치 이후의 항목들의 position을 일괄 업데이트 (항목 삽입/삭제 시 사용)
     */
    @Modifying
    @Query("UPDATE ChecklistItem c SET c.position = c.position + :delta "
            + "WHERE c.card.id = :cardId AND c.position >= :fromPosition")
    void updatePositionsFrom(@Param("cardId") Long cardId,
            @Param("fromPosition") Integer fromPosition, @Param("delta") Integer delta);

    /**
     * 카드의 모든 체크리스트 항목 삭제
     */
    void deleteByCardId(Long cardId);

    /**
     * 여러 카드의 체크리스트 항목 조회 (순서 유지)
     */
    @Query("SELECT c FROM ChecklistItem c WHERE c.card.id IN :cardIds ORDER BY c.card.id, c.position")
    List<ChecklistItem> findByCardIdInOrderByPosition(@Param("cardIds") List<Long> cardIds);
}
