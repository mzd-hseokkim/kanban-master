package com.kanban.checklist;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.kanban.checklist.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * 체크리스트 항목 REST API 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards/{cardId}")
@RequiredArgsConstructor
public class ChecklistItemController {

    private final ChecklistItemService checklistItemService;

    /**
     * 카드의 체크리스트 항목 조회
     */
    @GetMapping("/checklist")
    public ResponseEntity<List<ChecklistItemResponse>> getChecklistItems(
            @PathVariable Long workspaceId, @PathVariable Long boardId, @PathVariable Long columnId,
            @PathVariable Long cardId) {
        List<ChecklistItemResponse> items = checklistItemService.getChecklistItems(cardId);
        return ResponseEntity.ok(items);
    }

    /**
     * 체크리스트 진행률 조회
     */
    @GetMapping("/checklist/progress")
    public ResponseEntity<ChecklistProgressResponse> getChecklistProgress(
            @PathVariable Long workspaceId, @PathVariable Long boardId, @PathVariable Long columnId,
            @PathVariable Long cardId) {
        ChecklistProgressResponse progress = checklistItemService.getChecklistProgress(cardId);
        return ResponseEntity.ok(progress);
    }

    /**
     * 체크리스트 항목 생성
     */
    @PostMapping("/checklist")
    public ResponseEntity<ChecklistItemResponse> createChecklistItem(@PathVariable Long workspaceId,
            @PathVariable Long boardId, @PathVariable Long columnId, @PathVariable Long cardId,
            @Valid @RequestBody CreateChecklistItemRequest request) {
        ChecklistItemResponse item = checklistItemService.createChecklistItem(cardId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(item);
    }

    /**
     * 체크리스트 항목 수정 (별도 경로)
     */
    @PutMapping("/checklist/{itemId}")
    public ResponseEntity<ChecklistItemResponse> updateChecklistItem(@PathVariable Long workspaceId,
            @PathVariable Long boardId, @PathVariable Long columnId, @PathVariable Long cardId,
            @PathVariable Long itemId, @Valid @RequestBody UpdateChecklistItemRequest request) {
        ChecklistItemResponse item = checklistItemService.updateChecklistItem(itemId, request);
        return ResponseEntity.ok(item);
    }

    /**
     * 체크리스트 항목 삭제
     */
    @DeleteMapping("/checklist/{itemId}")
    public ResponseEntity<Void> deleteChecklistItem(@PathVariable Long workspaceId,
            @PathVariable Long boardId, @PathVariable Long columnId, @PathVariable Long cardId,
            @PathVariable Long itemId) {
        checklistItemService.deleteChecklistItem(itemId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 체크리스트 항목 순서 변경
     */
    @PutMapping("/checklist/{itemId}/position")
    public ResponseEntity<ChecklistItemResponse> reorderChecklistItem(
            @PathVariable Long workspaceId, @PathVariable Long boardId, @PathVariable Long columnId,
            @PathVariable Long cardId, @PathVariable Long itemId,
            @Valid @RequestBody ReorderChecklistItemRequest request) {
        ChecklistItemResponse item = checklistItemService.reorderChecklistItem(itemId, request);
        return ResponseEntity.ok(item);
    }
}
