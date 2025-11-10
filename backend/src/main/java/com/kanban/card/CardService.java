package com.kanban.card;

import com.kanban.activity.ActivityEventType;
import com.kanban.activity.ActivityService;
import com.kanban.activity.ActivityScopeType;
import com.kanban.board.member.BoardMemberRole;
import com.kanban.board.member.BoardMemberRoleValidator;
import com.kanban.card.dto.CardResponse;
import com.kanban.card.dto.CreateCardRequest;
import com.kanban.card.dto.UpdateCardRequest;
import com.kanban.column.BoardColumn;
import com.kanban.column.ColumnRepository;
import com.kanban.exception.ResourceNotFoundException;
import com.kanban.label.CardLabel;
import com.kanban.label.CardLabelRepository;
import com.kanban.label.dto.LabelResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 카드 비즈니스 로직 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CardService {

    private final CardRepository cardRepository;
    private final ColumnRepository columnRepository;
    private final ActivityService activityService;
    private final BoardMemberRoleValidator roleValidator;
    private final CardLabelRepository cardLabelRepository;

    /**
     * 특정 칼럼의 모든 카드 조회
     */
    public List<CardResponse> getCardsByColumn(Long columnId) {
        List<Card> cards = cardRepository.findByColumnIdOrderByPosition(columnId);
        if (cards.isEmpty()) {
            return List.of();
        }

        Map<Long, List<LabelResponse>> labelsByCardId = getLabelsByCardIds(cards.stream()
                .map(Card::getId)
                .toList());

        return cards.stream()
                .map(card -> CardResponse.from(card, labelsByCardId.getOrDefault(card.getId(), List.of())))
                .toList();
    }

    /**
     * 특정 카드 조회
     */
    public CardResponse getCard(Long columnId, Long cardId) {
        Card card = cardRepository.findByIdAndColumnId(cardId, columnId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));
        List<LabelResponse> labels = cardLabelRepository.findByCardId(cardId)
                .stream()
                .map(cardLabel -> LabelResponse.from(cardLabel.getLabel()))
                .toList();

        return CardResponse.from(card, labels);
    }

    /**
     * 카드 생성 (권한 검증 포함)
     */
    public CardResponse createCardWithValidation(Long boardId, Long columnId, CreateCardRequest request, Long userId) {
        // EDITOR 이상 권한 필요
        roleValidator.validateRole(boardId, BoardMemberRole.EDITOR);

        return createCard(columnId, request, userId);
    }

    /**
     * 카드 생성 (권한 검증 없음 - 내부 사용)
     */
    public CardResponse createCard(Long columnId, CreateCardRequest request, Long userId) {
        BoardColumn column = columnRepository.findById(columnId)
                .orElseThrow(() -> new ResourceNotFoundException("Column not found"));

        // 현재 칼럼의 카드 개수를 조회하여 position 설정
        int nextPosition = cardRepository.countByColumnId(columnId);

        Card card = Card.builder()
                .column(column)
                .title(request.getTitle())
                .description(request.getDescription())
                .position(nextPosition)
                .bgColor(request.getBgColor())
                .priority(request.getPriority())
                .assignee(request.getAssignee())
                .dueDate(request.getDueDate())
                .build();

        Card savedCard = cardRepository.save(card);

        // 활동 기록
        activityService.recordActivity(
            ActivityScopeType.CARD,
            savedCard.getId(),
            ActivityEventType.CARD_CREATED,
            userId,
            "\"" + savedCard.getTitle() + "\" 카드가 생성되었습니다"
        );

        return CardResponse.from(savedCard);
    }

    /**
     * 카드 수정 (권한 검증 포함)
     */
    public CardResponse updateCardWithValidation(Long boardId, Long columnId, Long cardId, UpdateCardRequest request, Long userId) {
        // EDITOR 이상 권한 필요
        roleValidator.validateRole(boardId, BoardMemberRole.EDITOR);

        return updateCard(columnId, cardId, request, userId);
    }

    /**
     * 카드 수정 (활동 기록 포함, 권한 검증 없음 - 내부 사용)
     */
    public CardResponse updateCard(Long columnId, Long cardId, UpdateCardRequest request, Long userId) {
        Card card = cardRepository.findByIdAndColumnId(cardId, columnId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        String originalTitle = card.getTitle();
        boolean isMoved = false;

        if (request.getTitle() != null) {
            card.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            card.setDescription(request.getDescription());
        }
        if (request.getBgColor() != null) {
            card.setBgColor(request.getBgColor());
        }
        if (request.getPriority() != null) {
            card.setPriority(request.getPriority());
        }
        if (request.getAssignee() != null) {
            card.setAssignee(request.getAssignee());
        }
        if (request.getDueDate() != null) {
            card.setDueDate(request.getDueDate());
        }
        if (request.getIsCompleted() != null) {
            card.setIsCompleted(request.getIsCompleted());
        }

        // 다른 컬럼으로 이동하는 경우
        if (request.getColumnId() != null && !request.getColumnId().equals(columnId)) {
            BoardColumn newColumn = columnRepository.findById(request.getColumnId())
                    .orElseThrow(() -> new ResourceNotFoundException("Target column not found"));

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
            if (request.getPosition() != null && !request.getPosition().equals(card.getPosition())) {
                handleCardPositionChange(columnId, card, request.getPosition());
            }
        }

        Card updatedCard = cardRepository.save(card);

        // 활동 기록
        if (isMoved) {
            activityService.recordActivity(
                ActivityScopeType.CARD,
                cardId,
                ActivityEventType.CARD_MOVED,
                userId,
                "\"" + originalTitle + "\" 카드가 이동되었습니다"
            );
        } else {
            activityService.recordActivity(
                ActivityScopeType.CARD,
                cardId,
                ActivityEventType.CARD_UPDATED,
                userId,
                "\"" + updatedCard.getTitle() + "\" 카드가 업데이트되었습니다"
            );
        }

        return CardResponse.from(updatedCard);
    }

    /**
     * 카드 삭제 (권한 검증 포함)
     */
    public void deleteCardWithValidation(Long boardId, Long columnId, Long cardId, Long userId) {
        // EDITOR 이상 권한 필요
        roleValidator.validateRole(boardId, BoardMemberRole.EDITOR);

        deleteCard(columnId, cardId, userId);
    }

    /**
     * 카드 삭제 (권한 검증 없음 - 내부 사용)
     */
    public void deleteCard(Long columnId, Long cardId, Long userId) {
        Card card = cardRepository.findByIdAndColumnId(cardId, columnId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        String cardTitle = card.getTitle();
        int deletedPosition = card.getPosition();
        cardRepository.delete(card);

        // 삭제된 카드 이후의 카드들의 position을 업데이트
        cardRepository.updatePositionsFrom(columnId, deletedPosition + 1, -1);

        // 활동 기록
        activityService.recordActivity(
            ActivityScopeType.CARD,
            cardId,
            ActivityEventType.CARD_DELETED,
            userId,
            "\"" + cardTitle + "\" 카드가 삭제되었습니다"
        );
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
                .collect(Collectors.groupingBy(
                        cardLabel -> cardLabel.getCard().getId(),
                        Collectors.mapping(cardLabel -> LabelResponse.from(cardLabel.getLabel()), Collectors.toList())
                ));
    }
}
