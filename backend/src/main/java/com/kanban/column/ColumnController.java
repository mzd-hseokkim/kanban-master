package com.kanban.column;

import com.kanban.board.member.BoardMemberRole;
import com.kanban.board.member.BoardMemberRoleValidator;
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
    private final BoardMemberRoleValidator roleValidator;

    /**
     * 특정 보드의 모든 칼럼 조회
     * GET /api/v1/workspaces/{workspaceId}/boards/{boardId}/columns
     */
    @GetMapping
    public ResponseEntity<List<ColumnResponse>> getColumns(
        @PathVariable Long workspaceId,
        @PathVariable Long boardId
    ) {
        List<BoardColumn> columns = columnService.getColumnsByBoard(boardId);
        List<ColumnResponse> responses = columns.stream()
            .map(ColumnResponse::from)
            .toList();
        return ResponseEntity.ok(responses);
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
        BoardColumn column = columnService.getColumn(columnId);
        return ResponseEntity.ok(ColumnResponse.from(column));
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
        // EDITOR 이상 권한 필요
        roleValidator.validateRole(boardId, BoardMemberRole.EDITOR);

        Long userId = SecurityUtil.getCurrentUserId();
        BoardColumn column = columnService.createColumn(
            boardId,
            request.getName(),
            request.getDescription(),
            userId
        );
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ColumnResponse.from(column));
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
        // EDITOR 이상 권한 필요
        roleValidator.validateRole(boardId, BoardMemberRole.EDITOR);

        Long userId = SecurityUtil.getCurrentUserId();
        BoardColumn column;

        // position이 포함된 경우 위치 업데이트
        if (request.getPosition() != null) {
            column = columnService.updateColumnPosition(boardId, columnId, request.getPosition(), userId);
        } else {
            column = columnService.updateColumn(
                columnId,
                request.getName(),
                request.getDescription(),
                request.getBgColor()
            );
        }

        return ResponseEntity.ok(ColumnResponse.from(column));
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
        // EDITOR 이상 권한 필요
        roleValidator.validateRole(boardId, BoardMemberRole.EDITOR);

        Long userId = SecurityUtil.getCurrentUserId();
        columnService.deleteColumn(boardId, columnId, userId);
        return ResponseEntity.noContent().build();
    }
}
