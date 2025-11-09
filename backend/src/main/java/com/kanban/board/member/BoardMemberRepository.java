package com.kanban.board.member;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BoardMemberRepository extends JpaRepository<BoardMember, BoardMemberId> {

    /**
     * 특정 보드의 모든 멤버 조회 (User eager loading)
     */
    @Query("SELECT bm FROM BoardMember bm JOIN FETCH bm.user WHERE bm.board.id = :boardId ORDER BY bm.createdAt ASC")
    List<BoardMember> findByBoardIdOrderByCreatedAtAsc(@Param("boardId") Long boardId);

    /**
     * 특정 보드의 멤버 페이지네이션 조회 (User eager loading)
     */
    @Query("SELECT bm FROM BoardMember bm JOIN FETCH bm.user WHERE bm.board.id = :boardId ORDER BY bm.createdAt ASC")
    Page<BoardMember> findByBoardIdOrderByCreatedAtAsc(@Param("boardId") Long boardId, Pageable pageable);

    /**
     * 특정 보드의 특정 사용자 멤버 조회 (User eager loading)
     */
    @Query("SELECT bm FROM BoardMember bm JOIN FETCH bm.user WHERE bm.board.id = :boardId AND bm.user.id = :userId")
    Optional<BoardMember> findByBoardIdAndUserId(@Param("boardId") Long boardId, @Param("userId") Long userId);

    /**
     * 특정 사용자가 속한 보드 조회 (User eager loading)
     */
    @Query("SELECT bm FROM BoardMember bm JOIN FETCH bm.user WHERE bm.user.id = :userId AND bm.invitationStatus = :status ORDER BY bm.createdAt DESC")
    List<BoardMember> findByUserIdAndInvitationStatusOrderByCreatedAtDesc(@Param("userId") Long userId, @Param("status") InvitationStatus status);

    /**
     * 특정 보드의 수락된 멤버만 조회 (User eager loading)
     */
    @Query("SELECT bm FROM BoardMember bm JOIN FETCH bm.user WHERE bm.board.id = :boardId AND bm.invitationStatus = :status ORDER BY bm.createdAt ASC")
    List<BoardMember> findByBoardIdAndInvitationStatusOrderByCreatedAtAsc(@Param("boardId") Long boardId, @Param("status") InvitationStatus status);

    /**
     * 초대 토큰으로 멤버 조회 (User, Board eager loading)
     */
    @Query("SELECT bm FROM BoardMember bm JOIN FETCH bm.user JOIN FETCH bm.board WHERE bm.invitationToken = :token")
    Optional<BoardMember> findByInvitationToken(@Param("token") String token);

    /**
     * 특정 보드의 보류 중인 초대 조회 (24시간 이상 경과)
     */
    @Query("SELECT bm FROM BoardMember bm WHERE bm.board.id = :boardId AND bm.invitationStatus = 'PENDING' AND bm.invitedAt < :cutoffDate")
    List<BoardMember> findExpiredInvitations(@Param("boardId") Long boardId, @Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * 특정 보드의 MANAGER 권한 멤버 조회
     */
    List<BoardMember> findByBoardIdAndRole(Long boardId, BoardMemberRole role);

    /**
     * 특정 사용자의 모든 보드 멤버십 조회 (수락됨)
     */
    List<BoardMember> findByUserIdAndInvitationStatus(Long userId, InvitationStatus status);

    /**
     * 특정 보드의 멤버 수 조회
     */
    long countByBoardIdAndInvitationStatus(Long boardId, InvitationStatus status);

    /**
     * 특정 사용자의 대기 중인 초대 조회 (Board 정보 포함)
     */
    @Query("SELECT bm FROM BoardMember bm JOIN FETCH bm.board b JOIN FETCH b.owner JOIN FETCH bm.user WHERE bm.user.id = :userId AND bm.invitationStatus = :status ORDER BY bm.invitedAt DESC")
    List<BoardMember> findPendingInvitationsByUserId(@Param("userId") Long userId, @Param("status") InvitationStatus status);

    /**
     * 특정 사용자의 모든 초대 조회 (디버깅용)
     */
    @Query("SELECT bm FROM BoardMember bm WHERE bm.user.id = :userId ORDER BY bm.invitedAt DESC")
    List<BoardMember> findAllInvitationsByUserId(@Param("userId") Long userId);
}
