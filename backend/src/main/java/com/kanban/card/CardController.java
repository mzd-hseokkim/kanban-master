package com.kanban.card;

import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.kanban.card.dto.CardPageResponse;
import com.kanban.card.dto.CardResponse;
import com.kanban.card.dto.CreateCardRequest;
import com.kanban.card.dto.UpdateCardRequest;
import com.kanban.common.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * 카드 REST API 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards")
@RequiredArgsConstructor
public class CardController {

    private final CardService cardService;

    /**
     * 칼럼의 모든 카드 조회
     */
    @GetMapping
    public ResponseEntity<CardPageResponse> listCards(@PathVariable Long workspaceId,
            @PathVariable Long boardId, @PathVariable Long columnId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {
        Sort.Direction sortDirection = Sort.Direction.fromString(direction);
        CardPageResponse cards = cardService.getCardsByColumn(boardId, columnId, page, size,
                CardSortBy.from(sortBy), sortDirection);
        return ResponseEntity.ok(cards);
    }

    /**
     * 특정 카드 조회 Spec § 6. 백엔드 규격 - API 엔드포인트 FR-06b, FR-06d: includeRelations=true 파라미터로 부모/자식 정보 포함
     * 여부 제어
     */
    @GetMapping("/{cardId}")
    public ResponseEntity<CardResponse> getCard(@PathVariable Long workspaceId,
            @PathVariable Long boardId, @PathVariable Long columnId, @PathVariable Long cardId,
            @RequestParam(required = false, defaultValue = "false") boolean includeRelations) {
        CardResponse card;
        if (includeRelations) {
            card = cardService.getCardWithHierarchy(boardId, columnId, cardId);
        } else {
            card = cardService.getCard(boardId, columnId, cardId);
        }
        return ResponseEntity.ok(card);
    }

    /**
     * 카드 생성
     */
    @PostMapping
    public ResponseEntity<CardResponse> createCard(@PathVariable Long workspaceId,
            @PathVariable Long boardId, @PathVariable Long columnId,
            @Valid @RequestBody CreateCardRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        CardResponse card =
                cardService.createCardWithValidation(boardId, columnId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(card);
    }

    /**
     * 카드 수정
     */
    @PutMapping("/{cardId}")
    public ResponseEntity<CardResponse> updateCard(@PathVariable Long workspaceId,
            @PathVariable Long boardId, @PathVariable Long columnId, @PathVariable Long cardId,
            @Valid @RequestBody UpdateCardRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        CardResponse card =
                cardService.updateCardWithValidation(boardId, columnId, cardId, request, userId);
        return ResponseEntity.ok(card);
    }

    /**
     * 카드 삭제
     */
    @DeleteMapping("/{cardId}")
    public ResponseEntity<Void> deleteCard(@PathVariable Long workspaceId,
            @PathVariable Long boardId, @PathVariable Long columnId, @PathVariable Long cardId) {
        Long userId = SecurityUtil.getCurrentUserId();
        cardService.deleteCardWithValidation(boardId, columnId, cardId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 카드 시작 처리 (startedAt 설정)
     */
    @PostMapping("/{cardId}/start")
    public ResponseEntity<CardResponse> startCard(@PathVariable Long workspaceId,
            @PathVariable Long boardId, @PathVariable Long columnId, @PathVariable Long cardId) {
        Long userId = SecurityUtil.getCurrentUserId();
        CardResponse card = cardService.startCardWithValidation(boardId, columnId, cardId, userId);
        return ResponseEntity.ok(card);
    }

    /**
     * 카드 아카이브
     */
    @PostMapping("/{cardId}/archive")
    public ResponseEntity<CardResponse> archiveCard(@PathVariable Long workspaceId,
            @PathVariable Long boardId, @PathVariable Long columnId, @PathVariable Long cardId) {
        Long userId = SecurityUtil.getCurrentUserId();
        CardResponse card = cardService.archiveCard(boardId, columnId, cardId, userId);
        return ResponseEntity.ok(card);
    }

    /**
     * 칼럼의 모든 미아카이브 카드 일괄 아카이브
     */
    @PostMapping("/archive-all")
    public ResponseEntity<List<CardResponse>> archiveAllCardsInColumn(
            @PathVariable Long workspaceId, @PathVariable Long boardId,
            @PathVariable Long columnId) {
        Long userId = SecurityUtil.getCurrentUserId();
        List<CardResponse> archivedCards =
                cardService.archiveAllCardsInColumn(boardId, columnId, userId);
        return ResponseEntity.ok(archivedCards);
    }

    /**
     * 카드 아카이브 복구
     */
    @PostMapping("/{cardId}/unarchive")
    public ResponseEntity<CardResponse> unarchiveCard(@PathVariable Long workspaceId,
            @PathVariable Long boardId, @PathVariable Long columnId, @PathVariable Long cardId) {
        Long userId = SecurityUtil.getCurrentUserId();
        CardResponse card = cardService.unarchiveCard(boardId, cardId, userId);
        return ResponseEntity.ok(card);
    }

    /**
     * 카드 영구 삭제 (아카이브된 카드만 가능)
     */
    @DeleteMapping("/{cardId}/permanent")
    public ResponseEntity<Void> permanentlyDeleteCard(@PathVariable Long workspaceId,
            @PathVariable Long boardId, @PathVariable Long columnId, @PathVariable Long cardId) {
        Long userId = SecurityUtil.getCurrentUserId();
        cardService.permanentlyDeleteCard(boardId, cardId, userId);
        return ResponseEntity.noContent().build();
    }
}
