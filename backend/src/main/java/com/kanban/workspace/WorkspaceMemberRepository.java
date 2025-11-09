package com.kanban.workspace;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, Long> {

    /**
     * 사용자가 속한 워크스페이스 멤버십 조회
     */
    List<WorkspaceMember> findByUserId(Long userId);

    /**
     * 특정 워크스페이스의 멤버 조회
     */
    List<WorkspaceMember> findByWorkspaceId(Long workspaceId);

    /**
     * 사용자가 특정 워크스페이스에 속해있는지 확인
     */
    Optional<WorkspaceMember> findByWorkspaceIdAndUserId(Long workspaceId, Long userId);

    /**
     * 사용자가 워크스페이스에 속해있는지 확인 (boolean)
     */
    @Query("SELECT CASE WHEN COUNT(wm) > 0 THEN true ELSE false END " +
           "FROM WorkspaceMember wm " +
           "WHERE wm.workspace.id = :workspaceId AND wm.user.id = :userId")
    boolean existsByWorkspaceIdAndUserId(@Param("workspaceId") Long workspaceId, @Param("userId") Long userId);
}
