package com.kanban.card;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 카드(Card) 데이터 접근 계층
 */
@Repository
public interface CardRepository extends JpaRepository<Card, Long> {

    /**
     * 특정 칼럼의 모든 카드를 위치 순서대로 조회
     */
    @Query("SELECT c FROM Card c WHERE c.column.id = :columnId ORDER BY c.position ASC")
    List<Card> findByColumnIdOrderByPosition(@Param("columnId") Long columnId);

    /**
     * 특정 칼럼의 카드 개수 조회
     */
    @Query("SELECT COUNT(c) FROM Card c WHERE c.column.id = :columnId")
    int countByColumnId(@Param("columnId") Long columnId);

    /**
     * 칼럼과 ID로 카드 조회
     * 권한 검증 시 사용
     */
    @Query("SELECT c FROM Card c WHERE c.id = :cardId AND c.column.id = :columnId")
    Optional<Card> findByIdAndColumnId(@Param("cardId") Long cardId, @Param("columnId") Long columnId);

    /**
     * 특정 위치 이상의 카드들의 position을 업데이트
     * (드래그 앤 드롭으로 카드 순서 변경 시 사용)
     */
    @Modifying
    @Query("UPDATE Card c SET c.position = c.position + :offset WHERE c.column.id = :columnId AND c.position >= :fromPosition")
    void updatePositionsFrom(@Param("columnId") Long columnId, @Param("fromPosition") Integer fromPosition, @Param("offset") Integer offset);

    /**
     * 특정 칼럼의 모든 카드 삭제
     */
    @Modifying
    @Query("DELETE FROM Card c WHERE c.column.id = :columnId")
    void deleteByColumnId(@Param("columnId") Long columnId);
}
