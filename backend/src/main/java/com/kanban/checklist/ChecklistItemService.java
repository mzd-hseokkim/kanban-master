package com.kanban.checklist;

import java.util.List;
import org.springframework.stereotype.Service;
import com.kanban.card.Card;
import com.kanban.card.CardRepository;
import com.kanban.checklist.dto.*;
import com.kanban.exception.ResourceNotFoundException;
import com.kanban.util.MessageSourceService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

/**
 * 체크리스트 항목 비즈니스 로직 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ChecklistItemService {

    private final ChecklistItemRepository checklistItemRepository;
    private final CardRepository cardRepository;
    private final MessageSourceService messageSourceService;

    /**
     * 카드의 체크리스트 항목 조회
     */
    public List<ChecklistItemResponse> getChecklistItems(Long cardId) {
        List<ChecklistItem> items = checklistItemRepository.findByCardIdOrderByPosition(cardId);
        return items.stream().map(ChecklistItemResponse::from).toList();
    }

    /**
     * 체크리스트 진행률 조회
     */
    public ChecklistProgressResponse getChecklistProgress(Long cardId) {
        long totalCount = checklistItemRepository.countByCardId(cardId);
        long checkedCount = checklistItemRepository.countByCardIdAndIsCheckedTrue(cardId);

        return ChecklistProgressResponse.calculate(cardId, totalCount, checkedCount);
    }

    /**
     * 체크리스트 항목 생성
     */
    public ChecklistItemResponse createChecklistItem(Long cardId,
            CreateChecklistItemRequest request) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSourceService.getMessage("error.card.not-found", cardId)));

        // 마지막 위치 계산
        long currentCount = checklistItemRepository.countByCardId(cardId);
        int newPosition = (int) currentCount;

        ChecklistItem item = ChecklistItem.builder().card(card).content(request.getContent())
                .position(newPosition).isChecked(false).build();

        ChecklistItem saved = checklistItemRepository.save(item);
        return ChecklistItemResponse.from(saved);
    }

    /**
     * 체크리스트 항목 수정 (내용 또는 체크 상태)
     */
    public ChecklistItemResponse updateChecklistItem(Long itemId,
            UpdateChecklistItemRequest request) {
        ChecklistItem item = checklistItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSourceService.getMessage("error.checklist.not-found")));

        if (request.getContent() != null) {
            item.setContent(request.getContent());
        }

        if (request.getIsChecked() != null) {
            item.setIsChecked(request.getIsChecked());
        }

        ChecklistItem updated = checklistItemRepository.save(item);
        return ChecklistItemResponse.from(updated);
    }

    /**
     * 체크리스트 항목 삭제
     */
    public void deleteChecklistItem(Long itemId) {
        ChecklistItem item = checklistItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSourceService.getMessage("error.checklist.not-found")));

        Long cardId = item.getCard().getId();
        int deletedPosition = item.getPosition();

        // 항목 삭제
        checklistItemRepository.delete(item);

        // 삭제된 위치 이후의 항목들 position 재조정 (-1)
        checklistItemRepository.updatePositionsFrom(cardId, deletedPosition + 1, -1);
    }

    /**
     * 체크리스트 항목 순서 변경
     */
    public ChecklistItemResponse reorderChecklistItem(Long itemId,
            ReorderChecklistItemRequest request) {
        ChecklistItem item = checklistItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSourceService.getMessage("error.checklist.not-found")));

        int oldPosition = item.getPosition();
        int newPosition = request.getNewPosition();

        if (oldPosition == newPosition) {
            return ChecklistItemResponse.from(item);
        }

        Long cardId = item.getCard().getId();

        if (oldPosition < newPosition) {
            // 아래로 이동: oldPosition+1 ~ newPosition 범위의 항목들을 위로 (-1)
            checklistItemRepository.updatePositionsFrom(cardId, oldPosition + 1, -1);
        } else {
            // 위로 이동: newPosition ~ oldPosition-1 범위의 항목들을 아래로 (+1)
            checklistItemRepository.updatePositionsFrom(cardId, newPosition, +1);
        }

        // 현재 항목의 position 업데이트
        item.setPosition(newPosition);
        ChecklistItem updated = checklistItemRepository.save(item);

        return ChecklistItemResponse.from(updated);
    }
}
