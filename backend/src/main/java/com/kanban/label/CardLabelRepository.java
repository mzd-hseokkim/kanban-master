package com.kanban.label;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 카드-라벨 Repository
 */
@Repository
public interface CardLabelRepository extends JpaRepository<CardLabel, Long> {

    /**
     * 카드 ID로 모든 카드-라벨 조회
     */
    @Query("SELECT cl FROM CardLabel cl JOIN FETCH cl.card JOIN FETCH cl.label WHERE cl.card.id = :cardId")
    List<CardLabel> findByCardId(@Param("cardId") Long cardId);

    /**
     * 라벨 ID로 모든 카드-라벨 조회
     */
    @Query("SELECT cl FROM CardLabel cl WHERE cl.label.id = :labelId")
    List<CardLabel> findByLabelId(@Param("labelId") Long labelId);

    /**
     * 여러 카드 ID에 대한 라벨 연결 조회
     */
    @Query("SELECT cl FROM CardLabel cl JOIN FETCH cl.card JOIN FETCH cl.label WHERE cl.card.id IN :cardIds")
    List<CardLabel> findByCardIdIn(@Param("cardIds") List<Long> cardIds);

    /**
     * 카드 ID와 라벨 ID로 카드-라벨 조회
     */
    @Query("SELECT cl FROM CardLabel cl WHERE cl.card.id = :cardId AND cl.label.id = :labelId")
    Optional<CardLabel> findByCardIdAndLabelId(@Param("cardId") Long cardId, @Param("labelId") Long labelId);

    /**
     * 카드에 라벨이 이미 할당되어 있는지 확인
     */
    boolean existsByCardIdAndLabelId(Long cardId, Long labelId);

    /**
     * 카드의 모든 라벨 삭제
     */
    @Modifying
    @Query("DELETE FROM CardLabel cl WHERE cl.card.id = :cardId")
    void deleteByCardId(@Param("cardId") Long cardId);

    /**
     * 라벨과 연결된 모든 카드-라벨 삭제
     */
    @Modifying
    @Query("DELETE FROM CardLabel cl WHERE cl.label.id = :labelId")
    void deleteByLabelId(@Param("labelId") Long labelId);

    /**
     * 특정 카드의 라벨 개수 조회
     */
    long countByCardId(Long cardId);

    /**
     * 카드가 지정된 라벨 중 하나라도 가지고 있는지 확인
     */
    @Query("SELECT CASE WHEN COUNT(cl) > 0 THEN true ELSE false END FROM CardLabel cl WHERE cl.card.id = :cardId AND cl.label.id IN :labelIds")
    boolean existsByCardIdAndLabelIds(@Param("cardId") Long cardId, @Param("labelIds") List<Long> labelIds);
}
