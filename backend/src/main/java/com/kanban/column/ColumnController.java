package com.kanban.column;

import com.kanban.column.dto.ColumnResponse;
import com.kanban.column.dto.CreateColumnRequest;
import com.kanban.column.dto.UpdateColumnRequest;
import com.kanban.common.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 칼럼(BoardColumn) REST API 컨트롤러
 * 보드 내 칼럼을 관리하는 엔드포인트 제공
 */
@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/boards/{boardId}/columns")
@RequiredArgsConstructor
public class ColumnController {

    private final ColumnService columnService;

    /**
     * 특정 보드의 모든 칼럼 조회
     * GET /api/v1/workspaces/{workspaceId}/boards/{boardId}/columns
     */
    @GetMapping
    public ResponseEntity<List<ColumnResponse>> getColumns(
        @PathVariable Long workspaceId,
        @PathVariable Long boardId
    ) {
        List<ColumnResponse> columns = columnService.getColumnsByBoard(boardId);
        return ResponseEntity.ok(columns);
    }

    /**
     * 특정 칼럼 조회
     * GET /api/v1/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}
     */
    @GetMapping("/{columnId}")
    public ResponseEntity<ColumnResponse> getColumn(
        @PathVariable Long workspaceId,
        @PathVariable Long boardId,
        @PathVariable Long columnId
    ) {
        ColumnResponse column = columnService.getColumn(columnId);
        return ResponseEntity.ok(column);
    }

    /**
     * 칼럼 생성
     * POST /api/v1/workspaces/{workspaceId}/boards/{boardId}/columns
     */
    @PostMapping
    public ResponseEntity<ColumnResponse> createColumn(
        @PathVariable Long workspaceId,
        @PathVariable Long boardId,
        @Valid @RequestBody CreateColumnRequest request
    ) {
        Long userId = SecurityUtil.getCurrentUserId();
        ColumnResponse column = columnService.createColumnWithValidation(
            boardId,
            request.getName(),
            request.getDescription(),
            request.getBgColor(),
            userId
        );
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(column);
    }

    /**
     * 칼럼 수정
     * PUT /api/v1/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}
     */
    @PutMapping("/{columnId}")
    public ResponseEntity<ColumnResponse> updateColumn(
        @PathVariable Long workspaceId,
        @PathVariable Long boardId,
        @PathVariable Long columnId,
        @Valid @RequestBody UpdateColumnRequest request
    ) {
        Long userId = SecurityUtil.getCurrentUserId();
        ColumnResponse column;

        // position이 포함된 경우 위치 업데이트
        if (request.getPosition() != null) {
            column = columnService.updateColumnPositionWithValidation(boardId, columnId, request.getPosition(), userId);
        } else {
            column = columnService.updateColumnWithValidation(
                boardId,
                columnId,
                request.getName(),
                request.getDescription(),
                request.getBgColor()
            );
        }

        return ResponseEntity.ok(column);
    }

    /**
     * 칼럼 삭제
     * DELETE /api/v1/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}
     */
    @DeleteMapping("/{columnId}")
    public ResponseEntity<Void> deleteColumn(
        @PathVariable Long workspaceId,
        @PathVariable Long boardId,
        @PathVariable Long columnId
    ) {
        Long userId = SecurityUtil.getCurrentUserId();
        columnService.deleteColumnWithValidation(boardId, columnId, userId);
        return ResponseEntity.noContent().build();
    }
}
