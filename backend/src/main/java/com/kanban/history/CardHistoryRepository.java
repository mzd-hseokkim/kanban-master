package com.kanban.history;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CardHistoryRepository extends JpaRepository<CardHistory, Long> {
    List<CardHistory> findByCardIdOrderByChangedAtAsc(Long cardId);

    List<CardHistory> findByBoardIdAndChangedAtAfter(Long boardId, LocalDateTime changedAt);

    List<CardHistory> findByBoardIdAndField(Long boardId, String field);
}
