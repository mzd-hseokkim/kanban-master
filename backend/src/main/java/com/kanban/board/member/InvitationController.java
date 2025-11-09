package com.kanban.board.member;

import com.kanban.board.member.dto.BoardMemberResponse;
import com.kanban.common.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 초대 관리 API 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/members/invitations")
@RequiredArgsConstructor
@Tag(name = "Invitations", description = "보드 초대 관리 API")
public class InvitationController {

    private final MemberService memberService;

    /**
     * 현재 사용자의 대기 중인 초대 조회
     */
    @GetMapping("/pending")
    @Operation(summary = "대기 중인 초대 조회", description = "현재 사용자의 대기 중인 초대를 모두 조회합니다")
    public ResponseEntity<List<BoardMemberResponse>> getPendingInvitations() {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        log.info("Getting pending invitations for user ID: {}", currentUserId);
        List<BoardMember> invitations = memberService.getPendingInvitations(currentUserId);
        log.info("Found {} pending invitations", invitations.size());
        List<BoardMemberResponse> responses = invitations.stream()
            .map(invitation -> BoardMemberResponse.fromWithInviter(invitation, invitation.getBoard().getOwner().getName()))
            .toList();
        return ResponseEntity.ok(responses);
    }

    /**
     * 초대 수락
     */
    @PostMapping("/accept")
    @Operation(summary = "초대 수락", description = "보드 초대를 수락합니다")
    public ResponseEntity<BoardMemberResponse> acceptInvitation(
        @RequestParam String token
    ) {
        BoardMember member = memberService.acceptInvitation(token);
        return ResponseEntity.ok(BoardMemberResponse.from(member));
    }

    /**
     * 초대 거절
     */
    @PostMapping("/decline")
    @Operation(summary = "초대 거절", description = "보드 초대를 거절합니다")
    public ResponseEntity<Void> declineInvitation(
        @RequestParam String token
    ) {
        memberService.declineInvitation(token);
        return ResponseEntity.noContent().build();
    }

    /**
     * 디버깅용: 현재 사용자의 모든 초대 조회
     */
    @GetMapping("/debug/all")
    @Operation(summary = "모든 초대 조회 (디버깅)", description = "현재 사용자의 모든 초대를 조회합니다 (모든 상태)")
    public ResponseEntity<List<BoardMemberResponse>> getAllInvitations() {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        log.info("Debugging: Fetching all invitations for user: {}", currentUserId);

        List<BoardMember> allInvitations = memberService.getAllInvitations(currentUserId);
        log.info("Found {} invitations", allInvitations.size());
        allInvitations.forEach(inv ->
            log.info("Invitation - UserId: {}, BoardId: {}, Status: {}",
                inv.getUser().getId(), inv.getBoard().getId(), inv.getInvitationStatus())
        );

        List<BoardMemberResponse> responses = allInvitations.stream()
            .map(invitation -> BoardMemberResponse.fromWithInviter(invitation, invitation.getBoard().getOwner().getName()))
            .toList();
        return ResponseEntity.ok(responses);
    }
}
