package com.kanban.card;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * 카드 커스텀 조회용 리포지토리
 */
public interface CardRepositoryCustom {
    Page<Card> findCardsByColumnWithSort(Long columnId, Pageable pageable, CardSortBy sortBy,
            Sort.Direction direction);
}
