package com.kanban.card;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.kanban.card.dto.CardResponse;
import com.kanban.common.SecurityUtil;
import lombok.RequiredArgsConstructor;

/**
 * 아카이브된 카드 조회를 위한 REST API 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/boards/{boardId}")
@RequiredArgsConstructor
public class ArchivedCardController {

    private final CardService cardService;

    /**
     * 보드의 아카이브된 카드 목록 조회
     */
    @GetMapping("/archived-cards")
    public ResponseEntity<List<CardResponse>> getArchivedCards(@PathVariable Long workspaceId,
            @PathVariable Long boardId) {
        Long userId = SecurityUtil.getCurrentUserId();
        List<CardResponse> cards = cardService.getArchivedCards(boardId, userId);
        return ResponseEntity.ok(cards);
    }
}
