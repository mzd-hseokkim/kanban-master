package com.kanban.board;

import com.kanban.board.dto.BoardResponse;
import com.kanban.board.dto.CreateBoardRequest;
import com.kanban.board.dto.UpdateBoardRequest;
import com.kanban.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/boards")
@RequiredArgsConstructor
@Slf4j
public class BoardController {

    private final BoardService boardService;

    /**
     * 보드 목록 조회
     * GET /api/v1/workspaces/{workspaceId}/boards
     */
    @GetMapping
    public ResponseEntity<List<BoardResponse>> listBoards(
        @PathVariable Long workspaceId,
        @AuthenticationPrincipal User user) {
        log.debug("Listing boards for workspace {}", workspaceId);
        List<BoardResponse> boards = boardService.getBoardsInWorkspace(workspaceId);
        return ResponseEntity.ok(boards);
    }

    /**
     * 최근 보드 목록 조회 (대시보드용)
     * GET /api/v1/workspaces/{workspaceId}/boards/recent
     */
    @GetMapping("/recent")
    public ResponseEntity<List<BoardResponse>> getRecentBoards(
        @PathVariable Long workspaceId,
        @RequestParam(defaultValue = "10") int limit,
        @AuthenticationPrincipal User user) {
        log.debug("Fetching recent boards for workspace {}", workspaceId);
        List<BoardResponse> boards = boardService.getRecentBoardsInWorkspace(workspaceId, limit);
        return ResponseEntity.ok(boards);
    }

    /**
     * 특정 보드 조회
     * GET /api/v1/workspaces/{workspaceId}/boards/{boardId}
     */
    @GetMapping("/{boardId}")
    public ResponseEntity<BoardResponse> getBoard(
        @PathVariable Long workspaceId,
        @PathVariable Long boardId,
        @AuthenticationPrincipal User user) {
        log.debug("Fetching board {} from workspace {}", boardId, workspaceId);
        BoardResponse board = boardService.getBoard(workspaceId, boardId);
        return ResponseEntity.ok(board);
    }

    /**
     * 새 보드 생성
     * POST /api/v1/workspaces/{workspaceId}/boards
     */
    @PostMapping
    public ResponseEntity<BoardResponse> createBoard(
        @PathVariable Long workspaceId,
        @Valid @RequestBody CreateBoardRequest request,
        @AuthenticationPrincipal User user) {
        if (user == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "인증 정보가 없습니다. 다시 로그인해주세요.");
        }
        log.info("Creating new board in workspace {} by user {}", workspaceId, user.getId());
        BoardResponse board = boardService.createBoard(workspaceId, user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(board);
    }

    /**
     * 보드 정보 수정
     * PATCH /api/v1/workspaces/{workspaceId}/boards/{boardId}
     */
    @PatchMapping("/{boardId}")
    public ResponseEntity<BoardResponse> updateBoard(
        @PathVariable Long workspaceId,
        @PathVariable Long boardId,
        @Valid @RequestBody UpdateBoardRequest request,
        @AuthenticationPrincipal User user) {
        if (user == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "인증 정보가 없습니다. 다시 로그인해주세요.");
        }
        log.info("Updating board {} in workspace {} by user {}", boardId, workspaceId, user.getId());
        BoardResponse board = boardService.updateBoard(workspaceId, boardId, user.getId(), request);
        return ResponseEntity.ok(board);
    }

    /**
     * 보드 아카이브
     * POST /api/v1/workspaces/{workspaceId}/boards/{boardId}/archive
     */
    @PostMapping("/{boardId}/archive")
    public ResponseEntity<BoardResponse> archiveBoard(
        @PathVariable Long workspaceId,
        @PathVariable Long boardId,
        @AuthenticationPrincipal User user) {
        if (user == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "인증 정보가 없습니다. 다시 로그인해주세요.");
        }
        log.info("Archiving board {} in workspace {} by user {}", boardId, workspaceId, user.getId());
        BoardResponse board = boardService.archiveBoard(workspaceId, boardId, user.getId());
        return ResponseEntity.ok(board);
    }

    /**
     * 보드 복구 (아카이브에서)
     * POST /api/v1/workspaces/{workspaceId}/boards/{boardId}/unarchive
     */
    @PostMapping("/{boardId}/unarchive")
    public ResponseEntity<BoardResponse> unarchiveBoard(
        @PathVariable Long workspaceId,
        @PathVariable Long boardId,
        @AuthenticationPrincipal User user) {
        if (user == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "인증 정보가 없습니다. 다시 로그인해주세요.");
        }
        log.info("Unarchiving board {} in workspace {} by user {}", boardId, workspaceId, user.getId());
        BoardResponse board = boardService.unarchiveBoard(workspaceId, boardId, user.getId());
        return ResponseEntity.ok(board);
    }

    /**
     * 보드 삭제 (소프트 삭제)
     * DELETE /api/v1/workspaces/{workspaceId}/boards/{boardId}
     */
    @DeleteMapping("/{boardId}")
    public ResponseEntity<Void> deleteBoard(
        @PathVariable Long workspaceId,
        @PathVariable Long boardId,
        @AuthenticationPrincipal User user) {
        if (user == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "인증 정보가 없습니다. 다시 로그인해주세요.");
        }
        log.info("Deleting board {} in workspace {} by user {}", boardId, workspaceId, user.getId());
        boardService.deleteBoard(workspaceId, boardId, user.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * 삭제된 보드 복구
     * POST /api/v1/workspaces/{workspaceId}/boards/{boardId}/restore
     */
    @PostMapping("/{boardId}/restore")
    public ResponseEntity<BoardResponse> restoreBoard(
        @PathVariable Long workspaceId,
        @PathVariable Long boardId,
        @AuthenticationPrincipal User user) {
        if (user == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "인증 정보가 없습니다. 다시 로그인해주세요.");
        }
        log.info("Restoring board {} in workspace {} by user {}", boardId, workspaceId, user.getId());
        BoardResponse board = boardService.restoreBoard(workspaceId, boardId, user.getId());
        return ResponseEntity.ok(board);
    }
}
