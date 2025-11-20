package com.kanban.watch;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CardWatchRepository extends JpaRepository<CardWatch, Long> {

    /**
     * 특정 카드에 대한 특정 사용자의 watch 조회
     */
    Optional<CardWatch> findByCardIdAndUserId(Long cardId, Long userId);

    /**
     * 특정 사용자가 watch 중인 모든 카드 조회
     */
    List<CardWatch> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * 특정 카드를 watch 중인 모든 사용자 조회
     */
    List<CardWatch> findByCardId(Long cardId);

    /**
     * 특정 카드에 대한 특정 사용자의 watch 삭제
     */
    void deleteByCardIdAndUserId(Long cardId, Long userId);

    /**
     * 특정 카드를 특정 사용자가 watch 중인지 확인
     */
    boolean existsByCardIdAndUserId(Long cardId, Long userId);

    /**
     * 특정 카드의 모든 watch 삭제 (카드 삭제 시 사용)
     */
    void deleteByCardId(Long cardId);

    /**
     * 사용자가 watch 중인 카드 ID 목록 조회 (성능 최적화용)
     */
    @Query("SELECT cw.cardId FROM CardWatch cw WHERE cw.userId = :userId")
    List<Long> findCardIdsByUserId(@Param("userId") Long userId);
}
