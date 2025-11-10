package com.kanban.template;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 보드 템플릿 Repository
 */
@Repository
public interface BoardTemplateRepository extends JpaRepository<BoardTemplate, Long> {

    /**
     * 공개 템플릿 목록 조회
     */
    @Query("SELECT t FROM BoardTemplate t WHERE t.isPublic = true ORDER BY t.createdAt DESC")
    List<BoardTemplate> findPublicTemplates();

    /**
     * 워크스페이스의 private 템플릿 목록 조회
     */
    @Query("SELECT t FROM BoardTemplate t WHERE t.workspace.id = :workspaceId AND t.isPublic = false ORDER BY t.createdAt DESC")
    List<BoardTemplate> findByWorkspaceId(@Param("workspaceId") Long workspaceId);

    /**
     * 카테고리별 공개 템플릿 조회
     */
    @Query("SELECT t FROM BoardTemplate t WHERE t.isPublic = true AND t.category = :category ORDER BY t.createdAt DESC")
    List<BoardTemplate> findPublicTemplatesByCategory(@Param("category") String category);

    /**
     * 템플릿 ID와 함께 칼럼 정보 fetch join으로 조회
     */
    @Query("SELECT t FROM BoardTemplate t LEFT JOIN FETCH t.columns WHERE t.id = :id")
    Optional<BoardTemplate> findByIdWithColumns(@Param("id") Long id);

    /**
     * 모든 템플릿 카테고리 목록 조회 (중복 제거)
     */
    @Query("SELECT DISTINCT t.category FROM BoardTemplate t WHERE t.category IS NOT NULL ORDER BY t.category")
    List<String> findAllCategories();
}
