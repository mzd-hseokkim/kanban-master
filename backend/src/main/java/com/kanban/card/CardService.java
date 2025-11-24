package com.kanban.card;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.owasp.html.PolicyFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import com.kanban.activity.ActivityEventType;
import com.kanban.activity.ActivityScopeType;
import com.kanban.activity.ActivityService;
import com.kanban.board.member.BoardMemberRole;
import com.kanban.board.member.BoardMemberRoleValidator;
import com.kanban.card.dto.*;
import com.kanban.column.BoardColumn;
import com.kanban.column.ColumnRepository;
import com.kanban.exception.CardHasChildrenException;
import com.kanban.exception.ResourceNotFoundException;
import com.kanban.history.CardChangedEvent;
import com.kanban.history.CardChangedEvent.CardChange;
import com.kanban.label.CardLabel;
import com.kanban.label.CardLabelRepository;
import com.kanban.label.dto.LabelResponse;
import com.kanban.notification.domain.NotificationType;
import com.kanban.user.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;


/**
 * 카드 비즈니스 로직 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional
@lombok.extern.slf4j.Slf4j
public class CardService {

    private final CardRepository cardRepository;
    private final ColumnRepository columnRepository;
    private final ActivityService activityService;
    private final BoardMemberRoleValidator roleValidator;
    private final CardLabelRepository cardLabelRepository;
    private final UserRepository userRepository;
    private final PolicyFactory htmlSanitizerPolicy;
    private final com.kanban.notification.service.RedisPublisher redisPublisher;
    private final com.kanban.notification.service.NotificationService notificationService;
    private final com.kanban.watch.CardWatchService cardWatchService;
    private final com.kanban.notification.NotificationLogRepository notificationLogRepository;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * 특정 칼럼의 모든 카드 조회 Spec § 5. 기능 요구사항 - FR-06g: 자식 개수 표시
     */
    public CardPageResponse getCardsByColumn(Long columnId, int page, int size,
            CardSortBy sortBy, Sort.Direction direction) {
        int cappedSize = Math.min(size, 500);
        Pageable pageable = PageRequest.of(Math.max(page, 0), cappedSize);
        Page<Card> cardPage =
                cardRepository.findCardsByColumnWithSort(columnId, pageable, sortBy, direction);

        if (cardPage.isEmpty()) {
            return CardPageResponse.builder().content(List.of()).page(pageable.getPageNumber())
                    .size(pageable.getPageSize()).totalElements(0).totalPages(0).last(true).build();
        }

        List<Card> cards = cardPage.getContent();
        Map<Long, List<LabelResponse>> labelsByCardId =
                getLabelsByCardIds(cards.stream().map(Card::getId).toList());

        // 자식 카드 개수 조회 (FR-06g)
        Map<Long, Integer> childCountByCardId =
                getChildCountByCardIds(cards.stream().map(Card::getId).toList());

        List<CardResponse> responses = cards.stream().map(card -> {
            CardResponse response =
                    CardResponse.from(card, labelsByCardId.getOrDefault(card.getId(), List.of()));
            // 자식 카드가 있으면 빈 리스트 설정 (개수만 필요)
            int childCount = childCountByCardId.getOrDefault(card.getId(), 0);
            if (childCount > 0) {
                response.setChildCards(List.of()); // 프론트엔드에서 childCards != null로 자식 존재 여부 판단
            }
            return enrichWithAssigneeInfo(response);
        }).toList();

        Page<CardResponse> responsePage =
                new PageImpl<>(responses, pageable, cardPage.getTotalElements());
        return CardPageResponse.from(responsePage);
    }

    /**
     * 특정 카드 조회
     */
    public CardResponse getCard(Long columnId, Long cardId) {
        Card card = cardRepository.findByIdAndColumnId(cardId, columnId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));
        List<LabelResponse> labels = cardLabelRepository.findByCardId(cardId).stream()
                .map(cardLabel -> LabelResponse.from(cardLabel.getLabel())).toList();

        return enrichWithAssigneeInfo(CardResponse.from(card, labels));
    }

    /**
     * 특정 카드 조회 (계층 정보 포함) Spec § 6. 백엔드 규격 - FR-06b, FR-06d: 부모/자식 카드 정보 조회 결정 사항 1: 자식 카드는 생성일
     * 오름차순 정렬 결정 사항 4: 초기 20개 자식 카드만 로드, 더보기 버튼으로 추가 로드
     */
    public CardResponse getCardWithHierarchy(Long columnId, Long cardId) {
        // 카드 조회 (부모 정보 포함)
        Card card = cardRepository.findByIdWithParent(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        // 칼럼 검증
        if (!card.getColumn().getId().equals(columnId)) {
            throw new ResourceNotFoundException("Card not found");
        }

        // 라벨 조회
        List<LabelResponse> labels = cardLabelRepository.findByCardId(cardId).stream()
                .map(cardLabel -> LabelResponse.from(cardLabel.getLabel())).toList();

        // 부모 카드 정보 (있는 경우)
        ParentCardSummaryDTO parentCard = null;
        if (card.getParentCard() != null) {
            parentCard = ParentCardSummaryDTO.from(card.getParentCard());
        }

        // 자식 카드 목록 (최대 20개, 생성일 오름차순)
        List<Card> childCardEntities = cardRepository.findByParentCardIdOrderByCreatedAt(cardId);
        List<ChildCardSummaryDTO> childCards = childCardEntities.stream().limit(20) // 초기 20개만 로드
                .map(ChildCardSummaryDTO::from).toList();

        return enrichWithAssigneeInfo(CardResponse.from(card, labels, parentCard, childCards));
    }

    /**
     * 카드 생성 (권한 검증 포함)
     */
    @com.kanban.audit.Auditable(action = com.kanban.audit.AuditAction.CREATE,
            targetType = com.kanban.audit.AuditTargetType.CARD)
    public CardResponse createCardWithValidation(Long boardId, Long columnId,
            CreateCardRequest request, Long userId) {
        // EDITOR 이상 권한 필요
        roleValidator.validateRole(boardId, BoardMemberRole.EDITOR);

        return createCard(columnId, request, userId);
    }

    /**
     * 카드 생성 (권한 검증 없음 - 내부 사용) Spec § 5. 기능 요구사항 - FR-06j: 계층 제한 검증
     */
    @org.springframework.cache.annotation.CacheEvict(value = "dashboardSummary", allEntries = true)
    public CardResponse createCard(Long columnId, CreateCardRequest request, Long userId) {
        BoardColumn column = columnRepository.findById(columnId)
                .orElseThrow(() -> new ResourceNotFoundException("Column not found"));

        // 부모 카드 검증 (FR-06j: 1단계 계층 구조만 지원)
        Card parentCard = null;
        if (request.getParentCardId() != null) {
            parentCard = cardRepository.findById(request.getParentCardId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent card not found"));

            // 부모 카드가 이미 자식 카드인 경우 (손자 카드 생성 방지)
            if (parentCard.getParentCard() != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "1단계 계층 구조만 지원합니다. 손자 카드는 생성할 수 없습니다.");
            }

            // 부모 카드와 자식 카드가 같은 보드에 속하는지 검증
            if (!parentCard.getColumn().getBoard().getId().equals(column.getBoard().getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "부모 카드와 자식 카드는 같은 보드에 속해야 합니다.");
            }
        }

        // 현재 칼럼의 카드 개수를 조회하여 position 설정
        int nextPosition = cardRepository.countByColumnId(columnId);

        Card card = Card.builder().column(column).title(request.getTitle())
                .description(sanitizeHtml(request.getDescription())).position(nextPosition)
                .bgColor(request.getBgColor()).priority(request.getPriority())
                .dueDate(request.getDueDate()).parentCard(parentCard).build();

        if (request.getAssigneeId() != null) {
            com.kanban.user.User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
            card.setAssignee(assignee);
        }

        Card savedCard = cardRepository.save(card);

        // 활동 기록
        String activityMessage = "\"" + savedCard.getTitle() + "\" 카드가 생성되었습니다";
        if (parentCard != null) {
            activityMessage += " (부모: \"" + parentCard.getTitle() + "\")";
        }
        activityService.recordActivity(ActivityScopeType.CARD, savedCard.getId(),
                ActivityEventType.CARD_CREATED, userId, activityMessage);

        // Redis 이벤트 발행 (라벨 포함)
        List<LabelResponse> labels = cardLabelRepository.findByCardId(savedCard.getId()).stream()
                .map(cardLabel -> LabelResponse.from(cardLabel.getLabel())).toList();
        CardResponse response = enrichWithAssigneeInfo(CardResponse.from(savedCard, labels));
        redisPublisher.publish(new com.kanban.notification.event.BoardEvent(
                com.kanban.notification.event.BoardEvent.EventType.CARD_CREATED.name(),
                column.getBoard().getId(), response, userId, System.currentTimeMillis()));

        // 알림 생성 (담당자가 지정된 경우)
        if (savedCard.getAssignee() != null) {
            // 본인이 본인을 할당한 경우는 알림 제외
            if (!savedCard.getAssignee().getId().equals(userId)) {
                System.out.println("Creating notification for user (createCard): "
                        + savedCard.getAssignee().getId());
                Long workspaceId = column.getBoard().getWorkspace().getId();
                notificationService.createNotification(savedCard.getAssignee().getId(),
                        com.kanban.notification.domain.NotificationType.CARD_ASSIGNMENT,
                        "새 카드 \"" + savedCard.getTitle() + "\"에 할당되었습니다.",
                        "/boards/" + workspaceId + "/" + column.getBoard().getId() + "?cardId="
                                + savedCard.getId() + "&columnId=" + column.getId());
            } else {
                System.out.println(
                        "Skipping notification (createCard): Self-assignment by user " + userId);
            }
        }

        // History
        List<CardChange> changes = new java.util.ArrayList<>();
        changes.add(new CardChange("LIFECYCLE", null, "CREATED"));
        changes.add(new CardChange("COLUMN", null, String.valueOf(column.getId())));
        publishHistory(savedCard.getId(), column.getBoard().getId(), userId, changes);

        return response;
    }

    /**
     * 카드 수정 (권한 검증 포함)
     */
    @com.kanban.audit.Auditable(action = com.kanban.audit.AuditAction.UPDATE,
            targetType = com.kanban.audit.AuditTargetType.CARD, targetId = "#cardId")
    public CardResponse updateCardWithValidation(Long boardId, Long columnId, Long cardId,
            UpdateCardRequest request, Long userId) {
        log.info("########## updateCardWithValidation CALLED - cardId={}, request={}", cardId,
                request);
        // EDITOR 이상 권한 필요
        roleValidator.validateRole(boardId, BoardMemberRole.EDITOR);

        return updateCard(columnId, cardId, request, userId);
    }

    /**
     * 카드 수정 (활동 기록 포함, 권한 검증 없음 - 내부 사용) Spec § 5. 기능 요구사항 - FR-06i: 컬럼 이동 시 부모 관계 해제
     */
    @org.springframework.cache.annotation.CacheEvict(value = "dashboardSummary", allEntries = true)
    public CardResponse updateCard(Long columnId, Long cardId, UpdateCardRequest request,
            Long userId) {
        Card card = cardRepository.findByIdAndColumnId(cardId, columnId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        String originalTitle = card.getTitle();
        boolean isMoved = false;
        boolean parentRelationRemoved = false;
        boolean completionStatusChanged = false;
        boolean markedCompleted = false;

        // 담당자 변경 감지 및 알림을 위한 기존 담당자 ID 저장
        Long oldAssigneeId = card.getAssignee() != null ? card.getAssignee().getId() : null;
        boolean wasCompleted = card.getIsCompleted();

        // History tracking - capture old values
        String originalDescription = card.getDescription();
        String originalPriority = card.getPriority();
        java.time.LocalDate originalDueDate = card.getDueDate();
        Long originalColumnId = card.getColumn().getId();
        boolean originalCompleted = Boolean.TRUE.equals(card.getIsCompleted());

        if (request.getTitle() != null) {
            card.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            String sanitizedDescription = sanitizeHtml(request.getDescription());
            card.setDescription(sanitizedDescription);
            // 멘션 처리
            processMentions(sanitizedDescription, card, userId);
        }
        if (request.getBgColor() != null) {
            card.setBgColor(request.getBgColor());
        }
        if (request.getPriority() != null) {
            card.setPriority(request.getPriority());
        }
        if (request.getAssigneeId() != null) {
            // -1 means unassign
            if (request.getAssigneeId() == -1) {
                card.setAssignee(null);
            } else {
                com.kanban.user.User assignee = userRepository.findById(request.getAssigneeId())
                        .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
                card.setAssignee(assignee);
            }
        }
        if (request.getDueDate() != null) {
            // 마감일이 변경된 경우, 기존 알림 발송 기록 삭제 (재발송을 위해)
            if (!request.getDueDate().equals(card.getDueDate())) {
                notificationLogRepository.deleteByCardAndNotificationType(card,
                        com.kanban.notification.domain.NotificationType.DUE_DATE_IMMINENT);
            }
            card.setDueDate(request.getDueDate());
        }
        if (request.getIsCompleted() != null) {
            card.setIsCompleted(request.getIsCompleted());
            completionStatusChanged = !request.getIsCompleted().equals(wasCompleted);
            markedCompleted = Boolean.TRUE.equals(request.getIsCompleted());
            if (markedCompleted && card.getCompletedAt() == null) {
                card.setCompletedAt(LocalDateTime.now());
            }
            if (!markedCompleted) {
                card.setCompletedAt(null);
            }
        }

        Long newAssigneeId = request.getAssigneeId();
        // Check if assignee changed (considering nulls and -1 for unassign)
        boolean assigneeChanged = false;
        if (newAssigneeId != null) {
            if (newAssigneeId == -1) {
                assigneeChanged = oldAssigneeId != null;
            } else {
                assigneeChanged = !newAssigneeId.equals(oldAssigneeId);
            }
        }


        // 다른 컬럼으로 이동하는 경우
        if (request.getColumnId() != null && !request.getColumnId().equals(columnId)) {
            BoardColumn newColumn = columnRepository.findById(request.getColumnId())
                    .orElseThrow(() -> new ResourceNotFoundException("Target column not found"));

            // FR-06i: 자식 카드가 다른 컬럼으로 이동 시 부모 관계 해제
            if (card.getParentCard() != null) {
                card.setParentCard(null);
                parentRelationRemoved = true;
            }

            // 기존 컬럼에서 position 업데이트
            cardRepository.updatePositionsFrom(columnId, card.getPosition() + 1, -1);

            // 새 컬럼으로 이동
            card.setColumn(newColumn);
            isMoved = true;

            // 새 컬럼에서의 position 설정
            if (request.getPosition() != null) {
                // 새 컬럼에서 해당 position 이상의 카드들 뒤로 밀기
                cardRepository.updatePositionsFrom(request.getColumnId(), request.getPosition(), 1);
                card.setPosition(request.getPosition());
            } else {
                // position 지정 없으면 끝에 추가
                int nextPosition = cardRepository.countByColumnId(request.getColumnId());
                card.setPosition(nextPosition);
            }
        } else {
            // 같은 컬럼 내 위치 변경 처리
            if (request.getPosition() != null
                    && !request.getPosition().equals(card.getPosition())) {
                handleCardPositionChange(columnId, card, request.getPosition());
            }
        }

        Card updatedCard = cardRepository.save(card);

        // 활동 기록
        if (completionStatusChanged) {
            if (markedCompleted) {
                activityService.recordActivity(ActivityScopeType.CARD, cardId,
                        ActivityEventType.CARD_COMPLETED, userId,
                        "\"" + updatedCard.getTitle() + "\" 카드가 완료되었습니다");
            } else {
                activityService.recordActivity(ActivityScopeType.CARD, cardId,
                        ActivityEventType.CARD_REOPENED, userId,
                        "\"" + updatedCard.getTitle() + "\" 카드가 다시 진행 중으로 전환되었습니다");
            }
        } else if (isMoved) {
            String moveMessage = "\"" + originalTitle + "\" 카드가 이동되었습니다";
            if (parentRelationRemoved) {
                moveMessage += " (부모 관계 해제됨)";
            }
            activityService.recordActivity(ActivityScopeType.CARD, cardId,
                    ActivityEventType.CARD_MOVED, userId, moveMessage);
        } else {
            activityService.recordActivity(ActivityScopeType.CARD, cardId,
                    ActivityEventType.CARD_UPDATED, userId,
                    "\"" + updatedCard.getTitle() + "\" 카드가 업데이트되었습니다");
        }

        // Redis 이벤트 발행 (라벨 포함)
        String eventType =
                isMoved ? com.kanban.notification.event.BoardEvent.EventType.CARD_MOVED.name()
                        : com.kanban.notification.event.BoardEvent.EventType.CARD_UPDATED.name();

        List<LabelResponse> labels = cardLabelRepository.findByCardId(updatedCard.getId()).stream()
                .map(cardLabel -> LabelResponse.from(cardLabel.getLabel())).toList();
        CardResponse response = enrichWithAssigneeInfo(CardResponse.from(updatedCard, labels));
        redisPublisher.publish(new com.kanban.notification.event.BoardEvent(eventType,
                card.getColumn().getBoard().getId(), response, userId, System.currentTimeMillis()));

        // 담당자 변경 알림
        if (assigneeChanged && newAssigneeId != null && newAssigneeId != -1) {
            // 본인이 본인을 할당한 경우는 알림 제외
            if (!newAssigneeId.equals(userId)) {
                System.out.println("Creating notification for user: " + newAssigneeId);
                Long workspaceId = card.getColumn().getBoard().getWorkspace().getId();
                notificationService.createNotification(newAssigneeId,
                        com.kanban.notification.domain.NotificationType.CARD_ASSIGNMENT,
                        "카드 \"" + updatedCard.getTitle() + "\"에 할당되었습니다.",
                        "/boards/" + workspaceId + "/" + card.getColumn().getBoard().getId()
                                + "?cardId=" + updatedCard.getId() + "&columnId="
                                + card.getColumn().getId());
            } else {
                System.out.println("Skipping notification: Self-assignment by user " + userId);
            }
        } else {
            System.out.println("Notification condition failed: changed=" + assigneeChanged
                    + ", newId=" + newAssigneeId + ", oldId=" + oldAssigneeId);
        }

        // Watch 중인 사용자들에게 알림
        String changeMessage = buildChangeMessage(request, originalTitle, isMoved);
        cardWatchService.notifyWatchers(cardId, changeMessage, userId);

        // History
        List<CardChange> historyChanges = new java.util.ArrayList<>();
        if (request.getTitle() != null && !request.getTitle().equals(originalTitle)) {
            historyChanges.add(new CardChange("TITLE", originalTitle, request.getTitle()));
        }
        if (request.getDescription() != null
                && !request.getDescription().equals(originalDescription)) {
            historyChanges.add(new CardChange("DESCRIPTION", "CHANGED", "CHANGED"));
        }
        if (request.getPriority() != null && !request.getPriority().equals(originalPriority)) {
            historyChanges.add(new CardChange("PRIORITY", originalPriority, request.getPriority()));
        }
        if (assigneeChanged) {
            historyChanges.add(new CardChange("ASSIGNEE",
                    oldAssigneeId != null ? String.valueOf(oldAssigneeId) : null,
                    newAssigneeId != null && newAssigneeId != -1 ? String.valueOf(newAssigneeId)
                            : null));
        }
        if (request.getDueDate() != null && !request.getDueDate().equals(originalDueDate)) {
            historyChanges.add(new CardChange("DUE_DATE",
                    originalDueDate != null ? originalDueDate.toString() : null,
                    request.getDueDate().toString()));
        }
        if (completionStatusChanged) {
            historyChanges.add(
                    new CardChange("COMPLETION", originalCompleted ? "COMPLETED" : "INCOMPLETE",
                            markedCompleted ? "COMPLETED" : "INCOMPLETE"));
        }
        if (isMoved) {
            historyChanges.add(new CardChange("COLUMN", String.valueOf(originalColumnId),
                    String.valueOf(request.getColumnId())));
        }
        publishHistory(updatedCard.getId(), card.getColumn().getBoard().getId(), userId,
                historyChanges);

        return response;
    }

    /**
     * 카드 삭제 (권한 검증 포함)
     */
    @com.kanban.audit.Auditable(action = com.kanban.audit.AuditAction.DELETE,
            targetType = com.kanban.audit.AuditTargetType.CARD, targetId = "#cardId")
    public void deleteCardWithValidation(Long boardId, Long columnId, Long cardId, Long userId) {
        // EDITOR 이상 권한 필요
        roleValidator.validateRole(boardId, BoardMemberRole.EDITOR);

        deleteCard(columnId, cardId, userId);
    }

    /**
     * 카드 삭제 (권한 검증 없음 - 내부 사용) Spec § 7. 보안 처리 - 데이터 무결성 FR-06h 변경: 부모 카드 삭제 차단 결정 사항 2: 자식이 있으면 부모
     * 삭제 차단
     */
    @org.springframework.cache.annotation.CacheEvict(value = "dashboardSummary", allEntries = true)
    public void deleteCard(Long columnId, Long cardId, Long userId) {
        Card card = cardRepository.findByIdAndColumnId(cardId, columnId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        // 자식 카드 존재 여부 확인 (FR-06h: 부모 카드 삭제 차단)
        int childCount = cardRepository.countByParentCardId(cardId);
        if (childCount > 0) {
            throw new CardHasChildrenException(childCount);
        }

        String cardTitle = card.getTitle();
        int deletedPosition = card.getPosition();

        // 카드 삭제 전에 관련된 모든 카드-라벨 연결을 먼저 삭제
        cardLabelRepository.deleteByCardId(cardId);

        // 카드 삭제
        cardRepository.delete(card);

        // 삭제된 카드 이후의 카드들의 position을 업데이트
        cardRepository.updatePositionsFrom(columnId, deletedPosition + 1, -1);

        // 활동 기록
        activityService.recordActivity(ActivityScopeType.CARD, cardId,
                ActivityEventType.CARD_DELETED, userId, "\"" + cardTitle + "\" 카드가 삭제되었습니다");

        // Redis 이벤트 발행
        redisPublisher.publish(new com.kanban.notification.event.BoardEvent(
                com.kanban.notification.event.BoardEvent.EventType.CARD_DELETED.name(),
                card.getColumn().getBoard().getId(), Map.of("cardId", cardId, "action", "deleted"),
                userId, System.currentTimeMillis()));

        // History
        List<CardChange> changes = List.of(new CardChange("LIFECYCLE", "CREATED", "DELETED"));
        publishHistory(cardId, card.getColumn().getBoard().getId(), userId, changes);
    }

    /**
     * 카드 시작 처리 (startedAt 설정, 진행 상태로 전환)
     */
    @com.kanban.audit.Auditable(action = com.kanban.audit.AuditAction.UPDATE,
            targetType = com.kanban.audit.AuditTargetType.CARD, targetId = "#cardId")
    public CardResponse startCardWithValidation(Long boardId, Long columnId, Long cardId,
            Long userId) {
        roleValidator.validateRole(boardId, BoardMemberRole.EDITOR);
        return startCard(columnId, cardId, userId);
    }

    /**
     * 카드 시작 처리 (권한 검증 없음 - 내부 사용)
     */
    @org.springframework.cache.annotation.CacheEvict(value = "dashboardSummary", allEntries = true)
    public CardResponse startCard(Long columnId, Long cardId, Long userId) {
        Card card = cardRepository.findByIdAndColumnId(cardId, columnId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        boolean wasCompleted = Boolean.TRUE.equals(card.getIsCompleted());
        boolean hadStart = card.getStartedAt() != null;

        // startedAt은 최초 한 번만 설정
        if (!hadStart) {
            card.setStartedAt(LocalDateTime.now());
        }

        if (wasCompleted) {
            card.setIsCompleted(false);
            card.setCompletedAt(null);
        }

        Card updated = cardRepository.save(card);

        // 활동 기록: 상태가 변했을 때만 기록
        if (!hadStart || wasCompleted) {
            activityService.recordActivity(ActivityScopeType.CARD, cardId,
                    ActivityEventType.CARD_STARTED, userId,
                    "\"" + updated.getTitle() + "\" 카드가 시작되었습니다");
        }

        // Redis 이벤트 발행 (카드 갱신 알림)
        List<LabelResponse> labels = cardLabelRepository.findByCardId(updated.getId()).stream()
                .map(cardLabel -> LabelResponse.from(cardLabel.getLabel())).toList();
        CardResponse response = enrichWithAssigneeInfo(CardResponse.from(updated, labels));
        redisPublisher.publish(new com.kanban.notification.event.BoardEvent(
                com.kanban.notification.event.BoardEvent.EventType.CARD_UPDATED.name(),
                card.getColumn().getBoard().getId(), response, userId, System.currentTimeMillis()));

        return response;
    }

    /**
     * 카드 위치 변경 처리
     */
    private void handleCardPositionChange(Long columnId, Card card, Integer newPosition) {
        int oldPosition = card.getPosition();

        if (newPosition < oldPosition) {
            // 위로 이동: newPosition 이상 oldPosition 미만의 카드들을 아래로 한 칸 이동
            cardRepository.updatePositionsFrom(columnId, newPosition, 1);
            cardRepository.updatePositionsFrom(columnId, oldPosition + 1, -1);
        } else if (newPosition > oldPosition) {
            // 아래로 이동: oldPosition 초과 newPosition 이하의 카드들을 위로 한 칸 이동
            cardRepository.updatePositionsFrom(columnId, oldPosition + 1, -1);
            cardRepository.updatePositionsFrom(columnId, newPosition, 1);
        }

        card.setPosition(newPosition);
    }

    private Map<Long, List<LabelResponse>> getLabelsByCardIds(List<Long> cardIds) {
        if (cardIds.isEmpty()) {
            return Map.of();
        }

        List<CardLabel> cardLabels = cardLabelRepository.findByCardIdIn(cardIds);

        return cardLabels.stream()
                .collect(Collectors.groupingBy(cardLabel -> cardLabel.getCard().getId(),
                        Collectors.mapping(cardLabel -> LabelResponse.from(cardLabel.getLabel()),
                                Collectors.toList())));
    }

    /**
     * 여러 카드의 자식 개수 조회 FR-06g: 자식 개수 표시를 위한 헬퍼 메서드
     */
    private Map<Long, Integer> getChildCountByCardIds(List<Long> cardIds) {
        if (cardIds.isEmpty()) {
            return Map.of();
        }

        return cardIds.stream().collect(Collectors.toMap(cardId -> cardId,
                cardId -> cardRepository.countByParentCardId(cardId)));
    }

    /**
     * CardResponse에 담당자 정보(이름, 아바타) 추가
     */
    private CardResponse enrichWithAssigneeInfo(CardResponse cardResponse) {
        if (cardResponse.getAssigneeId() != null) {
            userRepository.findById(cardResponse.getAssigneeId()).ifPresent(user -> {
                cardResponse.setAssignee(user.getName());
                cardResponse.setAssigneeAvatarUrl(user.getAvatarUrl());
            });
        }
        return cardResponse;
    }

    /**
     * HTML Sanitization XSS 공격 방지를 위해 위험한 HTML 태그와 속성을 제거
     */
    private String sanitizeHtml(String html) {
        if (html == null || html.isBlank()) {
            return null;
        }
        return htmlSanitizerPolicy.sanitize(html);
    }

    /**
     * 카드 변경 내용을 메시지로 생성
     */
    private String buildChangeMessage(UpdateCardRequest request, String originalTitle,
            boolean isMoved) {
        if (isMoved) {
            return "카드가 다른 컬럼으로 이동됨";
        }

        java.util.List<String> changes = new java.util.ArrayList<>();

        if (request.getTitle() != null && !request.getTitle().equals(originalTitle)) {
            changes.add("제목 변경");
        }
        if (request.getDescription() != null) {
            changes.add("설명 변경");
        }
        if (request.getPriority() != null) {
            changes.add("우선순위 변경");
        }
        if (request.getAssigneeId() != null) {
            changes.add("담당자 변경");
        }
        if (request.getDueDate() != null) {
            changes.add("마감일 변경");
        }
        if (request.getIsCompleted() != null) {
            changes.add("완료 상태 변경");
        }

        return changes.isEmpty() ? "카드 업데이트" : String.join(", ", changes);
    }

    /**
     * 카드 아카이브 (권한 검증 포함)
     */
    @com.kanban.audit.Auditable(action = com.kanban.audit.AuditAction.UPDATE,
            targetType = com.kanban.audit.AuditTargetType.CARD, targetId = "#cardId")
    public CardResponse archiveCard(Long boardId, Long columnId, Long cardId, Long userId) {
        roleValidator.validateRole(boardId, BoardMemberRole.EDITOR);
        return archiveCardInternal(columnId, cardId, userId);
    }

    /**
     * 카드 아카이브 (내부 사용)
     */
    @org.springframework.cache.annotation.CacheEvict(value = "dashboardSummary", allEntries = true)
    private CardResponse archiveCardInternal(Long columnId, Long cardId, Long userId) {
        Card card = cardRepository.findByIdAndColumnId(cardId, columnId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        if (Boolean.TRUE.equals(card.getIsArchived())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Card is already archived");
        }

        card.setIsArchived(true);
        card.setArchivedAt(LocalDateTime.now());
        Card archived = cardRepository.save(card);

        // 활동 기록
        activityService.recordActivity(ActivityScopeType.CARD, cardId,
                ActivityEventType.CARD_UPDATED, userId,
                "\"" + archived.getTitle() + "\" 카드가 아카이브되었습니다");

        // Redis 이벤트 발행
        List<LabelResponse> labels = cardLabelRepository.findByCardId(archived.getId()).stream()
                .map(cardLabel -> LabelResponse.from(cardLabel.getLabel())).toList();
        CardResponse response = enrichWithAssigneeInfo(CardResponse.from(archived, labels));
        redisPublisher.publish(new com.kanban.notification.event.BoardEvent(
                com.kanban.notification.event.BoardEvent.EventType.CARD_UPDATED.name(),
                card.getColumn().getBoard().getId(), response, userId, System.currentTimeMillis()));

        // History
        List<CardChange> changes = List.of(new CardChange("STATUS", "ACTIVE", "ARCHIVED"));
        publishHistory(archived.getId(), card.getColumn().getBoard().getId(), userId, changes);

        return response;
    }

    /**
     * 카드 아카이브 복구 (권한 검증 포함)
     */
    @com.kanban.audit.Auditable(action = com.kanban.audit.AuditAction.UPDATE,
            targetType = com.kanban.audit.AuditTargetType.CARD, targetId = "#cardId")
    public CardResponse unarchiveCard(Long boardId, Long cardId, Long userId) {
        roleValidator.validateRole(boardId, BoardMemberRole.EDITOR);
        return unarchiveCardInternal(cardId, userId);
    }

    /**
     * 카드 아카이브 복구 (내부 사용)
     */
    @org.springframework.cache.annotation.CacheEvict(value = "dashboardSummary", allEntries = true)
    private CardResponse unarchiveCardInternal(Long cardId, Long userId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        if (Boolean.FALSE.equals(card.getIsArchived())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Card is not archived");
        }

        card.setIsArchived(false);
        card.setArchivedAt(null);
        Card unarchived = cardRepository.save(card);

        // 활동 기록
        activityService.recordActivity(ActivityScopeType.CARD, cardId,
                ActivityEventType.CARD_UPDATED, userId,
                "\"" + unarchived.getTitle() + "\" 카드가 복구되었습니다");

        // Redis 이벤트 발행
        List<LabelResponse> labels = cardLabelRepository.findByCardId(unarchived.getId()).stream()
                .map(cardLabel -> LabelResponse.from(cardLabel.getLabel())).toList();
        CardResponse response = enrichWithAssigneeInfo(CardResponse.from(unarchived, labels));
        redisPublisher.publish(new com.kanban.notification.event.BoardEvent(
                com.kanban.notification.event.BoardEvent.EventType.CARD_UPDATED.name(),
                card.getColumn().getBoard().getId(), response, userId, System.currentTimeMillis()));

        // History
        List<CardChange> changes = List.of(new CardChange("STATUS", "ARCHIVED", "ACTIVE"));
        publishHistory(unarchived.getId(), card.getColumn().getBoard().getId(), userId, changes);

        return response;
    }

    /**
     * 아카이브된 카드 조회 (보드 단위)
     */
    public List<CardResponse> getArchivedCards(Long boardId, Long userId) {
        // VIEWER 이상 권한 필요
        roleValidator.validateRole(boardId, BoardMemberRole.VIEWER);

        List<Card> archivedCards =
                cardRepository.findByBoardIdAndIsArchivedTrueOrderByArchivedAt(boardId);
        if (archivedCards.isEmpty()) {
            return List.of();
        }

        Map<Long, List<LabelResponse>> labelsByCardId =
                getLabelsByCardIds(archivedCards.stream().map(Card::getId).toList());

        return archivedCards.stream().map(card -> {
            CardResponse response =
                    CardResponse.from(card, labelsByCardId.getOrDefault(card.getId(), List.of()));
            return enrichWithAssigneeInfo(response);
        }).toList();
    }

    /**
     * 카드 영구 삭제 (아카이브된 카드만 가능)
     */
    public void permanentlyDeleteCard(Long boardId, Long cardId, Long userId) {
        roleValidator.validateRole(boardId, BoardMemberRole.MANAGER);

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        // 아카이브된 카드만 영구 삭제 가능
        if (Boolean.FALSE.equals(card.getIsArchived())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only archived cards can be permanently deleted. Please archive the card first.");
        }

        // 자식 카드 존재 여부 확인
        int childCount = cardRepository.countByParentCardId(cardId);
        if (childCount > 0) {
            throw new CardHasChildrenException(childCount);
        }

        String cardTitle = card.getTitle();

        // 카드-라벨 연결 삭제
        cardLabelRepository.deleteByCardId(cardId);

        // 카드 영구 삭제
        cardRepository.delete(card);

        // 활동 기록
        activityService.recordActivity(ActivityScopeType.CARD, cardId,
                ActivityEventType.CARD_DELETED, userId, "\"" + cardTitle + "\" 카드가 영구 삭제되었습니다");

        // Redis 이벤트 발행
        redisPublisher.publish(new com.kanban.notification.event.BoardEvent(
                com.kanban.notification.event.BoardEvent.EventType.CARD_DELETED.name(),
                card.getColumn().getBoard().getId(),
                Map.of("cardId", cardId, "action", "permanently_deleted"), userId,
                System.currentTimeMillis()));

        // History
        List<CardChange> changes =
                List.of(new CardChange("LIFECYCLE", "ARCHIVED", "DELETED_PERMANENTLY"));
        publishHistory(cardId, card.getColumn().getBoard().getId(), userId, changes);
    }

    private void processMentions(String content, Card card, Long authorId) {
        if (content == null)
            return;

        log.info("[MENTION] Processing mentions for card description: {}", content);

        // Pattern: <span class="mention" data-user-id="userId">... (@ or &#64; or &commat;)
        // HTML sanitizer may encode @ as &#64; or &commat;
        Pattern pattern = Pattern.compile("<span[^>]+data-user-id=\"(\\d+)\"[^>]*>");
        Matcher matcher = pattern.matcher(content);
        Set<Long> mentionedUserIds = new HashSet<>();

        while (matcher.find()) {
            try {
                Long userId = Long.parseLong(matcher.group(1));
                mentionedUserIds.add(userId);
            } catch (NumberFormatException e) {
                // Invalid userId format, skip
                continue;
            }
        }

        if (mentionedUserIds.isEmpty()) {
            log.info("[MENTION] No mentions found in card description");
            return;
        }

        log.info("[MENTION] Found {} mention(s) in card description: {}", mentionedUserIds.size(),
                mentionedUserIds);

        com.kanban.user.User author = userRepository.findById(authorId).orElseThrow();

        for (Long userId : mentionedUserIds) {
            if (!userId.equals(authorId)) {
                log.info("[MENTION] Looking up user with ID: {}", userId);
                userRepository.findById(userId).ifPresentOrElse(user -> {
                    String message = String.format("%s님이 카드 설명에서 회원님을 언급했습니다.", author.getName());
                    // Fixed URL format:
                    // /boards/{workspaceId}/{boardId}?cardId={cardId}&columnId={columnId}
                    String url = String.format("/boards/%d/%d?cardId=%d&columnId=%d",
                            card.getColumn().getBoard().getWorkspace().getId(),
                            card.getColumn().getBoard().getId(), card.getId(),
                            card.getColumn().getId());
                    log.info("[MENTION] Sending notification to user: {} (ID: {})", user.getName(),
                            user.getId());
                    try {
                        notificationService.createNotification(user.getId(),
                                NotificationType.CARD_MENTION, message, url);
                        log.info("[MENTION] Notification sent successfully");
                    } catch (Exception e) {
                        log.error("[MENTION] Failed to send notification", e);
                    }
                }, () -> log.warn("[MENTION] User not found with ID: {}", userId));
            } else {
                log.info("[MENTION] Skipping self-mention for user ID: {}", userId);
            }
        }
    }

    private void publishHistory(Long cardId, Long boardId, Long userId, List<CardChange> changes) {
        if (changes.isEmpty())
            return;
        eventPublisher.publishEvent(new CardChangedEvent(cardId, boardId, userId, changes));
    }
}
