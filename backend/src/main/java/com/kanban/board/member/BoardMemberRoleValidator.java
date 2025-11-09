package com.kanban.board.member;

import com.kanban.board.BoardRepository;
import com.kanban.common.SecurityUtil;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * 보드 멤버의 역할 기반 권한을 검증하는 유틸리티
 */
@Component
public class BoardMemberRoleValidator {

    private final BoardMemberRepository boardMemberRepository;
    private final BoardRepository boardRepository;

    public BoardMemberRoleValidator(BoardMemberRepository boardMemberRepository, BoardRepository boardRepository) {
        this.boardMemberRepository = boardMemberRepository;
        this.boardRepository = boardRepository;
    }

    /**
     * 사용자가 보드에서 특정 역할 이상의 권한을 가지고 있는지 확인
     * @param boardId 보드 ID
     * @param requiredRole 필요한 역할 (VIEWER, EDITOR, MANAGER)
     * @throws ResponseStatusException 권한이 없으면 403 에러 발생
     */
    public void validateRole(Long boardId, BoardMemberRole requiredRole) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증 정보가 없습니다");
        }

        // 보드 조회
        var board = boardRepository.findById(boardId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "보드를 찾을 수 없습니다"));

        // Owner이면 무조건 권한 있음
        if (board.getOwner().getId().equals(currentUserId)) {
            return;
        }

        // Owner가 아니면 멤버 권한 확인
        var memberOptional = boardMemberRepository.findByBoardIdAndUserId(boardId, currentUserId);
        if (memberOptional.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "이 보드에 접근할 권한이 없습니다");
        }

        var member = memberOptional.get();

        // ACCEPTED 상태여야 함
        if (member.getInvitationStatus() != InvitationStatus.ACCEPTED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "이 보드에 접근할 권한이 없습니다");
        }

        // 역할 검증
        if (!hasRequiredRole(member.getRole(), requiredRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "이 작업을 수행할 권한이 없습니다");
        }
    }

    /**
     * 사용자가 보드의 멤버인지 확인 (ACCEPTED 상태)
     * @param boardId 보드 ID
     * @return 멤버인지 여부
     */
    public boolean isBoardMember(Long boardId) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (currentUserId == null) {
            return false;
        }

        var memberOptional = boardMemberRepository.findByBoardIdAndUserId(boardId, currentUserId);
        if (memberOptional.isEmpty()) {
            return false;
        }

        return memberOptional.get().getInvitationStatus() == InvitationStatus.ACCEPTED;
    }

    /**
     * 사용자의 역할이 필요한 역할 이상인지 확인
     * MANAGER > EDITOR > VIEWER 순서
     */
    private boolean hasRequiredRole(BoardMemberRole userRole, BoardMemberRole requiredRole) {
        if (userRole == BoardMemberRole.MANAGER) {
            return true;
        }
        if (userRole == BoardMemberRole.EDITOR) {
            return requiredRole == BoardMemberRole.EDITOR || requiredRole == BoardMemberRole.VIEWER;
        }
        // VIEWER
        return requiredRole == BoardMemberRole.VIEWER;
    }
}
