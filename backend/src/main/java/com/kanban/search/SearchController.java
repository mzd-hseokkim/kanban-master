package com.kanban.search;

import com.kanban.search.dto.CardSearchRequest;
import com.kanban.search.dto.CardSearchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 검색 API 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
@Slf4j
public class SearchController {

    private final SearchService searchService;

    /**
     * 보드 내 카드 검색
     * GET /api/v1/search/boards/{boardId}/cards
     *
     * @param boardId 보드 ID
     * @param request 검색 조건
     * @return 검색 결과 목록
     */
    @GetMapping("/boards/{boardId}/cards")
    public ResponseEntity<List<CardSearchResponse>> searchCardsInBoard(
            @PathVariable Long boardId,
            @ModelAttribute CardSearchRequest request) {
        log.debug("GET /api/v1/search/boards/{}/cards - request: {}", boardId, request);
        List<CardSearchResponse> results = searchService.searchCards(boardId, request);
        return ResponseEntity.ok(results);
    }

    /**
     * 워크스페이스 내 카드 검색
     * GET /api/v1/search/workspaces/{workspaceId}/cards
     *
     * @param workspaceId 워크스페이스 ID
     * @param request     검색 조건
     * @return 검색 결과 목록
     */
    @GetMapping("/workspaces/{workspaceId}/cards")
    public ResponseEntity<List<CardSearchResponse>> searchCardsInWorkspace(
            @PathVariable Long workspaceId,
            @ModelAttribute CardSearchRequest request) {
        log.debug("GET /api/v1/search/workspaces/{}/cards - request: {}", workspaceId, request);
        List<CardSearchResponse> results = searchService.searchCardsInWorkspace(workspaceId, request);
        return ResponseEntity.ok(results);
    }
}
