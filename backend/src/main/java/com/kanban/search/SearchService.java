package com.kanban.search;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import com.kanban.card.Card;
import com.kanban.label.CardLabelRepository;
import com.kanban.label.dto.LabelResponse;
import com.kanban.search.dto.CardSearchRequest;
import com.kanban.search.dto.CardSearchResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 검색 서비스 카드 검색 및 필터링 기능 제공
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SearchService {

    private final EntityManager entityManager;
    private final CardLabelRepository cardLabelRepository;
    private final com.kanban.board.BoardRepository boardRepository;
    private final com.kanban.column.ColumnRepository columnRepository;

    /**
     * 보드 내 카드 검색
     *
     * @param boardId 보드 ID
     * @param request 검색 조건
     * @return 검색 결과 목록
     */
    public List<CardSearchResponse> searchCards(Long boardId, CardSearchRequest request) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Card> query = cb.createQuery(Card.class);
        Root<Card> card = query.from(Card.class);

        // Join with column and board
        Join<Object, Object> column = card.join("column");
        Join<Object, Object> board = column.join("board");

        List<Predicate> predicates = buildCommonPredicates(request, cb, card);
        predicates.add(cb.equal(board.get("id"), boardId));

        query.where(predicates.toArray(new Predicate[0]));
        query.orderBy(cb.desc(card.get("updatedAt")));

        List<Card> cards = entityManager.createQuery(query).getResultList();

        // 라벨 필터 적용 (라벨은 별도 테이블이므로 후처리)
        if (request.getLabelIds() != null && !request.getLabelIds().isEmpty()) {
            cards = cards.stream().filter(c -> hasAnyLabel(c.getId(), request.getLabelIds()))
                    .toList();
        }

        return cards.stream().map(this::toSearchResponse).toList();
    }

    /**
     * 워크스페이스 내 카드 검색
     *
     * @param workspaceId 워크스페이스 ID
     * @param request 검색 조건
     * @return 검색 결과 목록
     */
    public List<CardSearchResponse> searchCardsInWorkspace(Long workspaceId,
            CardSearchRequest request) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Card> query = cb.createQuery(Card.class);
        Root<Card> card = query.from(Card.class);

        Join<Object, Object> column = card.join("column");
        Join<Object, Object> board = column.join("board");
        Join<Object, Object> workspace = board.join("workspace");

        List<Predicate> predicates = buildCommonPredicates(request, cb, card);
        predicates.add(cb.equal(workspace.get("id"), workspaceId));

        query.where(predicates.toArray(new Predicate[0]));
        query.orderBy(cb.desc(card.get("updatedAt")));

        List<Card> cards = entityManager.createQuery(query).getResultList();

        // 라벨 필터
        if (request.getLabelIds() != null && !request.getLabelIds().isEmpty()) {
            cards = cards.stream().filter(c -> hasAnyLabel(c.getId(), request.getLabelIds()))
                    .toList();
        }

        return cards.stream().map(this::toSearchResponse).toList();
    }

    private List<Predicate> buildCommonPredicates(CardSearchRequest request, CriteriaBuilder cb,
            Root<Card> card) {
        List<Predicate> predicates = new ArrayList<>();

        if (StringUtils.hasText(request.getKeyword())) {
            String keyword = "%" + request.getKeyword().trim().toLowerCase() + "%";
            Predicate titleMatch = cb.like(cb.lower(card.get("title")), keyword);
            Predicate descMatch = cb.like(cb.lower(card.get("description")), keyword);
            predicates.add(cb.or(titleMatch, descMatch));
        }

        if (request.getPriorities() != null && !request.getPriorities().isEmpty()) {
            predicates.add(card.get("priority").in(request.getPriorities()));
        }

        if (request.getAssigneeIds() != null && !request.getAssigneeIds().isEmpty()) {
            predicates.add(card.get("assignee").get("id").in(request.getAssigneeIds()));
        }

        if (request.getIsCompleted() != null) {
            predicates.add(cb.equal(card.get("isCompleted"), request.getIsCompleted()));
        }

        if (request.getDueDateFrom() != null) {
            predicates.add(cb.greaterThanOrEqualTo(card.get("dueDate"), request.getDueDateFrom()));
        }
        if (request.getDueDateTo() != null) {
            predicates.add(cb.lessThanOrEqualTo(card.get("dueDate"), request.getDueDateTo()));
        }

        if (Boolean.TRUE.equals(request.getOverdue())) {
            predicates.add(cb.lessThan(card.get("dueDate"), LocalDate.now()));
            predicates.add(cb.equal(card.get("isCompleted"), false));
        }

        if (Boolean.TRUE.equals(request.getParentCardIdIsNull())) {
            predicates.add(cb.isNull(card.get("parentCard")));
        }

        if (request.getSprintId() != null) {
            predicates.add(cb.equal(card.get("sprint").get("id"), request.getSprintId()));
        }

        // 기본적으로 아카이브된 카드는 제외 (명시적 요청이 없는 한)
        // TODO: CardSearchRequest에 includeArchived 필드 추가 고려
        predicates.add(cb.equal(card.get("isArchived"), false));

        return predicates;
    }

    /**
     * 워크스페이스 내 보드 검색
     */
    public List<com.kanban.board.dto.BoardResponse> searchBoards(Long workspaceId, String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }
        return boardRepository
                .findByWorkspaceIdAndNameContainingIgnoreCaseAndStatus(workspaceId, keyword.trim(),
                        com.kanban.board.BoardStatus.ACTIVE)
                .stream().map(com.kanban.board.dto.BoardResponse::from).toList();
    }

    /**
     * 워크스페이스 내 칼럼 검색
     */
    public List<com.kanban.column.dto.ColumnResponse> searchColumns(Long workspaceId,
            String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }
        return columnRepository
                .findByBoardWorkspaceIdAndNameContainingIgnoreCase(workspaceId, keyword.trim())
                .stream().map(com.kanban.column.dto.ColumnResponse::from).toList();
    }

    /**
     * 카드가 특정 라벨 중 하나라도 가지고 있는지 확인
     */
    private boolean hasAnyLabel(Long cardId, List<Long> labelIds) {
        return cardLabelRepository.existsByCardIdAndLabelIds(cardId, labelIds);
    }

    /**
     * Card 엔티티를 CardSearchResponse로 변환
     */
    private CardSearchResponse toSearchResponse(Card card) {
        List<LabelResponse> labels = cardLabelRepository.findByCardId(card.getId()).stream()
                .map(cl -> LabelResponse.from(cl.getLabel())).toList();

        return CardSearchResponse.builder().id(card.getId())
                .workspaceId(card.getColumn().getBoard().getWorkspace().getId())
                .columnId(card.getColumn().getId()).columnName(card.getColumn().getName())
                .boardId(card.getColumn().getBoard().getId())
                .boardName(card.getColumn().getBoard().getName()).title(card.getTitle())
                .description(card.getDescription()).position(card.getPosition())
                .bgColor(card.getBgColor()).priority(card.getPriority())
                .assigneeId(card.getAssignee() != null ? card.getAssignee().getId() : null)
                .dueDate(card.getDueDate()).isCompleted(card.getIsCompleted())
                .startedAt(card.getStartedAt()).completedAt(card.getCompletedAt()).labels(labels)
                .createdAt(card.getCreatedAt()).updatedAt(card.getUpdatedAt())
                .storyPoints(card.getStoryPoints()).build();
    }
}
