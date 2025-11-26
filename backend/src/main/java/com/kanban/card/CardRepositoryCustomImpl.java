package com.kanban.card;

import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

@Repository
public class CardRepositoryCustomImpl implements CardRepositoryCustom {

    private static final String FIELD_IS_ARCHIVED = "isArchived";
    private static final String FIELD_PRIORITY = "priority";

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Page<Card> findCardsByColumnWithSort(Long columnId, Pageable pageable,
            CardSortBy sortBy, Sort.Direction direction) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();

        // Content query
        CriteriaQuery<Card> query = cb.createQuery(Card.class);
        Root<Card> root = query.from(Card.class);
        Predicate notArchived =
                cb.or(cb.isFalse(root.get(FIELD_IS_ARCHIVED)), cb.isNull(root.get(FIELD_IS_ARCHIVED)));
        Predicate predicate = cb.and(cb.equal(root.get("column").get("id"), columnId),
                notArchived);
        query.where(predicate);
        query.orderBy(buildOrder(cb, root, sortBy, direction));

        TypedQuery<Card> typedQuery = entityManager.createQuery(query);
        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());
        List<Card> cards = typedQuery.getResultList();

        // Count query
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Card> countRoot = countQuery.from(Card.class);
        countQuery.select(cb.count(countRoot));
        countQuery.where(cb.and(cb.equal(countRoot.get("column").get("id"), columnId),
                cb.or(cb.isFalse(countRoot.get(FIELD_IS_ARCHIVED)),
                        cb.isNull(countRoot.get(FIELD_IS_ARCHIVED)))));
        Long total = entityManager.createQuery(countQuery).getSingleResult();

        return new PageImpl<>(cards, pageable, total);
    }

    private List<Order> buildOrder(CriteriaBuilder cb, Root<Card> root, CardSortBy sortBy,
            Sort.Direction direction) {
        List<Order> orders = new ArrayList<>();

        switch (sortBy) {
            case TITLE -> orders.add(direction == Sort.Direction.ASC ? cb.asc(root.get("title"))
                    : cb.desc(root.get("title")));
            case PRIORITY -> {
                int nullFallback =
                        direction == Sort.Direction.ASC ? Integer.MAX_VALUE : Integer.MIN_VALUE;
                Expression<Integer> priorityWeight = cb.<Integer>selectCase()
                        .when(cb.equal(root.get(FIELD_PRIORITY), "HIGH"), 3)
                        .when(cb.equal(root.get(FIELD_PRIORITY), "MEDIUM"), 2)
                        .when(cb.equal(root.get(FIELD_PRIORITY), "LOW"), 1)
                        .otherwise(nullFallback);
                orders.add(direction == Sort.Direction.ASC ? cb.asc(priorityWeight)
                        : cb.desc(priorityWeight));
            }
            case STARTED_AT -> orders.addAll(buildDateOrders(cb, root.get("startedAt"), direction));
            case DUE_DATE -> orders.addAll(buildDateOrders(cb, root.get("dueDate"), direction));
            case COMPLETED_AT -> orders.addAll(
                    buildDateOrders(cb, root.get("completedAt"), direction));
            case CREATED_AT -> orders.addAll(buildDateOrders(cb, root.get("createdAt"), direction));
            default -> orders.addAll(buildDateOrders(cb, root.get("createdAt"), direction));
        }

        // 안정적인 정렬을 위해 ID를 마지막으로 추가
        orders.add(cb.asc(root.get("id")));
        return orders;
    }

    private List<Order> buildDateOrders(CriteriaBuilder cb, Expression<?> dateExpression,
            Sort.Direction direction) {
        List<Order> orders = new ArrayList<>();
        // null은 항상 마지막
        Expression<Integer> nullsLast = cb.<Integer>selectCase()
                .when(cb.isNull(dateExpression), 1)
                .otherwise(0);
        orders.add(cb.asc(nullsLast));

        if (direction == Sort.Direction.ASC) {
            orders.add(cb.asc(dateExpression));
        } else {
            orders.add(cb.desc(dateExpression));
        }

        return orders;
    }
}
