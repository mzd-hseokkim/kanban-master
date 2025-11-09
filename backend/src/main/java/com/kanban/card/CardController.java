package com.kanban.card;

import com.kanban.board.member.BoardMemberRole;
import com.kanban.board.member.BoardMemberRoleValidator;
import com.kanban.card.dto.CardResponse;
import com.kanban.card.dto.CreateCardRequest;
import com.kanban.card.dto.UpdateCardRequest;
import com.kanban.common.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 카드 REST API 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards")
@RequiredArgsConstructor
public class CardController {

    private final CardService cardService;
    private final BoardMemberRoleValidator roleValidator;

    /**
     * 칼럼의 모든 카드 조회
     */
    @GetMapping
    public ResponseEntity<List<CardResponse>> listCards(
            @PathVariable Long workspaceId,
            @PathVariable Long boardId,
            @PathVariable Long columnId) {
        List<CardResponse> cards = cardService.getCardsByColumn(columnId);
        return ResponseEntity.ok(cards);
    }

    /**
     * 특정 카드 조회
     */
    @GetMapping("/{cardId}")
    public ResponseEntity<CardResponse> getCard(
            @PathVariable Long workspaceId,
            @PathVariable Long boardId,
            @PathVariable Long columnId,
            @PathVariable Long cardId) {
        CardResponse card = cardService.getCard(columnId, cardId);
        return ResponseEntity.ok(card);
    }

    /**
     * 카드 생성
     */
    @PostMapping
    public ResponseEntity<CardResponse> createCard(
            @PathVariable Long workspaceId,
            @PathVariable Long boardId,
            @PathVariable Long columnId,
            @Valid @RequestBody CreateCardRequest request) {
        // EDITOR 이상 권한 필요
        roleValidator.validateRole(boardId, BoardMemberRole.EDITOR);

        Long userId = SecurityUtil.getCurrentUserId();
        CardResponse card = cardService.createCard(columnId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(card);
    }

    /**
     * 카드 수정
     */
    @PutMapping("/{cardId}")
    public ResponseEntity<CardResponse> updateCard(
            @PathVariable Long workspaceId,
            @PathVariable Long boardId,
            @PathVariable Long columnId,
            @PathVariable Long cardId,
            @Valid @RequestBody UpdateCardRequest request) {
        // EDITOR 이상 권한 필요
        roleValidator.validateRole(boardId, BoardMemberRole.EDITOR);

        Long userId = SecurityUtil.getCurrentUserId();
        CardResponse card = cardService.updateCard(columnId, cardId, request, userId);
        return ResponseEntity.ok(card);
    }

    /**
     * 카드 삭제
     */
    @DeleteMapping("/{cardId}")
    public ResponseEntity<Void> deleteCard(
            @PathVariable Long workspaceId,
            @PathVariable Long boardId,
            @PathVariable Long columnId,
            @PathVariable Long cardId) {
        // EDITOR 이상 권한 필요
        roleValidator.validateRole(boardId, BoardMemberRole.EDITOR);

        Long userId = SecurityUtil.getCurrentUserId();
        cardService.deleteCard(columnId, cardId, userId);
        return ResponseEntity.noContent().build();
    }
}
