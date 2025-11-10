package com.kanban.label;

import com.kanban.label.dto.CardLabelRequest;
import com.kanban.label.dto.LabelResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 카드-라벨 연결 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/cards/{cardId}/labels")
@RequiredArgsConstructor
@Slf4j
public class CardLabelController {

    private final CardLabelService cardLabelService;

    /**
     * 카드의 라벨 목록 조회
     * GET /api/v1/cards/{cardId}/labels
     */
    @GetMapping
    public ResponseEntity<List<LabelResponse>> getCardLabels(@PathVariable Long cardId) {
        log.debug("GET /api/v1/cards/{}/labels", cardId);
        List<LabelResponse> labels = cardLabelService.getCardLabels(cardId);
        return ResponseEntity.ok(labels);
    }

    /**
     * 카드에 라벨 할당 (기존 라벨 모두 제거 후 새로 할당)
     * PUT /api/v1/cards/{cardId}/labels
     */
    @PutMapping
    public ResponseEntity<List<LabelResponse>> assignLabelsToCard(
            @PathVariable Long cardId,
            @Valid @RequestBody CardLabelRequest request) {
        log.debug("PUT /api/v1/cards/{}/labels: {}", cardId, request);
        List<LabelResponse> labels = cardLabelService.assignLabelsToCard(cardId, request);
        return ResponseEntity.ok(labels);
    }

    /**
     * 카드에 라벨 추가
     * POST /api/v1/cards/{cardId}/labels/{labelId}
     */
    @PostMapping("/{labelId}")
    public ResponseEntity<LabelResponse> addLabelToCard(
            @PathVariable Long cardId,
            @PathVariable Long labelId) {
        log.debug("POST /api/v1/cards/{}/labels/{}", cardId, labelId);
        LabelResponse label = cardLabelService.addLabelToCard(cardId, labelId);
        return ResponseEntity.status(HttpStatus.CREATED).body(label);
    }

    /**
     * 카드에서 라벨 제거
     * DELETE /api/v1/cards/{cardId}/labels/{labelId}
     */
    @DeleteMapping("/{labelId}")
    public ResponseEntity<Void> removeLabelFromCard(
            @PathVariable Long cardId,
            @PathVariable Long labelId) {
        log.debug("DELETE /api/v1/cards/{}/labels/{}", cardId, labelId);
        cardLabelService.removeLabelFromCard(cardId, labelId);
        return ResponseEntity.noContent().build();
    }
}
