package com.kanban.label;

import com.kanban.label.dto.LabelReorderRequest;
import com.kanban.label.dto.LabelRequest;
import com.kanban.label.dto.LabelResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 라벨 관리 컨트롤러
 * 보드의 라벨 CRUD 및 순서 변경 API 제공
 */
@RestController
@RequestMapping("/api/v1/boards/{boardId}/labels")
@RequiredArgsConstructor
@Slf4j
public class LabelController {

    private final LabelService labelService;

    /**
     * 보드의 모든 라벨 조회
     * GET /api/v1/boards/{boardId}/labels
     */
    @GetMapping
    public ResponseEntity<List<LabelResponse>> getLabels(@PathVariable Long boardId) {
        log.debug("GET /api/v1/boards/{}/labels", boardId);
        List<LabelResponse> labels = labelService.getLabelsByBoardId(boardId);
        return ResponseEntity.ok(labels);
    }

    /**
     * 특정 라벨 조회
     * GET /api/v1/boards/{boardId}/labels/{labelId}
     */
    @GetMapping("/{labelId}")
    public ResponseEntity<LabelResponse> getLabel(
            @PathVariable Long boardId,
            @PathVariable Long labelId) {
        log.debug("GET /api/v1/boards/{}/labels/{}", boardId, labelId);
        LabelResponse label = labelService.getLabel(boardId, labelId);
        return ResponseEntity.ok(label);
    }

    /**
     * 새 라벨 생성
     * POST /api/v1/boards/{boardId}/labels
     */
    @PostMapping
    public ResponseEntity<LabelResponse> createLabel(
            @PathVariable Long boardId,
            @Valid @RequestBody LabelRequest request) {
        log.debug("POST /api/v1/boards/{}/labels: {}", boardId, request);
        LabelResponse label = labelService.createLabel(boardId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(label);
    }

    /**
     * 라벨 수정
     * PATCH /api/v1/boards/{boardId}/labels/{labelId}
     */
    @PatchMapping("/{labelId}")
    public ResponseEntity<LabelResponse> updateLabel(
            @PathVariable Long boardId,
            @PathVariable Long labelId,
            @Valid @RequestBody LabelRequest request) {
        log.debug("PATCH /api/v1/boards/{}/labels/{}: {}", boardId, labelId, request);
        LabelResponse label = labelService.updateLabel(boardId, labelId, request);
        return ResponseEntity.ok(label);
    }

    /**
     * 라벨 삭제
     * DELETE /api/v1/boards/{boardId}/labels/{labelId}
     */
    @DeleteMapping("/{labelId}")
    public ResponseEntity<Void> deleteLabel(
            @PathVariable Long boardId,
            @PathVariable Long labelId) {
        log.debug("DELETE /api/v1/boards/{}/labels/{}", boardId, labelId);
        labelService.deleteLabel(boardId, labelId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 라벨 순서 변경
     * PUT /api/v1/boards/{boardId}/labels/reorder
     */
    @PutMapping("/reorder")
    public ResponseEntity<List<LabelResponse>> reorderLabels(
            @PathVariable Long boardId,
            @Valid @RequestBody LabelReorderRequest request) {
        log.debug("PUT /api/v1/boards/{}/labels/reorder: {}", boardId, request);
        List<LabelResponse> labels = labelService.reorderLabels(boardId, request);
        return ResponseEntity.ok(labels);
    }
}
