package com.kanban.watch;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.kanban.common.SecurityUtil;
import com.kanban.watch.dto.WatchResponse;
import com.kanban.watch.dto.WatchedCardResponse;
import lombok.RequiredArgsConstructor;

/**
 * 카드 Watch API 컨트롤러
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CardWatchController {

    private final CardWatchService cardWatchService;

    /**
     * Watch 토글 (추가/해제)
     */
    @PostMapping("/cards/{cardId}/watch")
    public ResponseEntity<WatchResponse> toggleWatch(@PathVariable Long cardId) {
        Long userId = SecurityUtil.getCurrentUserId();
        WatchResponse response = cardWatchService.toggleWatch(cardId, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Watch 상태 조회
     */
    @GetMapping("/cards/{cardId}/watch")
    public ResponseEntity<WatchResponse> getWatchStatus(@PathVariable Long cardId) {
        Long userId = SecurityUtil.getCurrentUserId();
        WatchResponse response = cardWatchService.getWatchStatus(cardId, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Watch 목록 조회
     */
    @GetMapping("/watch-list")
    public ResponseEntity<List<WatchedCardResponse>> getWatchList() {
        Long userId = SecurityUtil.getCurrentUserId();
        List<WatchedCardResponse> watchList = cardWatchService.getWatchList(userId);
        return ResponseEntity.ok(watchList);
    }

    /**
     * Watch 해제
     */
    @DeleteMapping("/cards/{cardId}/watch")
    public ResponseEntity<Void> unwatchCard(@PathVariable Long cardId) {
        Long userId = SecurityUtil.getCurrentUserId();
        cardWatchService.toggleWatch(cardId, userId); // 토글 로직 재사용
        return ResponseEntity.noContent().build();
    }
}
