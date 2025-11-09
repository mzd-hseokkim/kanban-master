package com.kanban.workspace;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {

    /**
     * 사용자가 속한 워크스페이스 조회
     */
    @Query("SELECT DISTINCT w FROM Workspace w " +
           "LEFT JOIN WorkspaceMember wm ON w.id = wm.workspace.id " +
           "WHERE w.owner.id = :userId OR wm.user.id = :userId " +
           "ORDER BY w.updatedAt DESC")
    List<Workspace> findByUserId(@Param("userId") Long userId);

    /**
     * Slug로 워크스페이스 조회
     */
    Optional<Workspace> findBySlug(String slug);

    /**
     * 소유자가 속한 워크스페이스 조회
     */
    List<Workspace> findByOwnerId(Long ownerId);
}
