package com.kanban.board.member;

import com.kanban.board.member.dto.BoardMemberResponse;
import com.kanban.board.member.dto.InviteMemberRequest;
import com.kanban.common.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 보드 멤버 관리 API 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/boards/{boardId}/members")
@RequiredArgsConstructor
@Tag(name = "Members", description = "보드 멤버 관리 API")
public class MemberController {

    private final MemberService memberService;

    /**
     * 보드의 모든 멤버 조회
     */
    @GetMapping
    @Operation(summary = "보드 멤버 목록 조회", description = "특정 보드의 모든 멤버를 조회합니다")
    public ResponseEntity<List<BoardMemberResponse>> getBoardMembers(
        @PathVariable Long boardId
    ) {
        List<BoardMemberResponse> members = memberService.getBoardMembers(boardId);
        return ResponseEntity.ok(members);
    }

    /**
     * 보드의 멤버 페이지네이션 조회
     */
    @GetMapping("/page")
    @Operation(summary = "보드 멤버 페이지네이션 조회", description = "특정 보드의 멤버를 페이지네이션으로 조회합니다")
    public ResponseEntity<Page<BoardMemberResponse>> getBoardMembersPage(
        @PathVariable Long boardId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<BoardMemberResponse> responses = memberService.getBoardMembersPageResponse(boardId, pageable);
        return ResponseEntity.ok(responses);
    }

    /**
     * 멤버 초대
     */
    @PostMapping
    @Operation(summary = "멤버 초대", description = "사용자를 보드에 초대합니다")
    public ResponseEntity<BoardMemberResponse> inviteMember(
        @PathVariable Long boardId,
        @Valid @RequestBody InviteMemberRequest request
    ) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        BoardMemberResponse member = memberService.inviteMember(boardId, request.getUserId(), currentUserId, request.getRole());
        return ResponseEntity.status(HttpStatus.CREATED).body(member);
    }

    /**
     * 멤버 권한 변경
     */
    @PatchMapping("/{memberId}")
    @Operation(summary = "멤버 권한 변경", description = "멤버의 권한을 변경합니다")
    public ResponseEntity<BoardMemberResponse> changeMemberRole(
        @PathVariable Long boardId,
        @PathVariable Long memberId,
        @RequestParam BoardMemberRole role
    ) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        BoardMemberResponse member = memberService.changeMemberRole(boardId, memberId, role, currentUserId);
        return ResponseEntity.ok(member);
    }

    /**
     * 멤버 제거
     */
    @DeleteMapping("/{memberId}")
    @Operation(summary = "멤버 제거", description = "멤버를 보드에서 제거합니다")
    public ResponseEntity<Void> removeMember(
        @PathVariable Long boardId,
        @PathVariable Long memberId
    ) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        memberService.removeMember(boardId, memberId, currentUserId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 멤버 정보 조회
     */
    @GetMapping("/{memberId}")
    @Operation(summary = "멤버 정보 조회", description = "특정 멤버의 정보를 조회합니다")
    public ResponseEntity<BoardMemberResponse> getMember(
        @PathVariable Long boardId,
        @PathVariable Long memberId
    ) {
        BoardMemberResponse member = memberService.getMember(boardId, memberId);
        return ResponseEntity.ok(member);
    }
}
