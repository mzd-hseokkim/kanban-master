package com.kanban.label;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 라벨 Repository
 */
@Repository
public interface LabelRepository extends JpaRepository<Label, Long> {

    /**
     * 보드 ID로 모든 라벨 조회 (표시 순서대로 정렬)
     */
    @Query("SELECT l FROM Label l WHERE l.board.id = :boardId ORDER BY l.displayOrder ASC")
    List<Label> findByBoardIdOrderByDisplayOrder(@Param("boardId") Long boardId);

    /**
     * 보드 ID와 라벨 ID로 라벨 조회
     */
    @Query("SELECT l FROM Label l WHERE l.id = :labelId AND l.board.id = :boardId")
    Optional<Label> findByIdAndBoardId(@Param("labelId") Long labelId, @Param("boardId") Long boardId);

    /**
     * 보드에서 특정 이름의 라벨이 존재하는지 확인
     */
    boolean existsByBoardIdAndName(Long boardId, String name);

    /**
     * 보드에서 특정 이름의 라벨이 존재하는지 확인 (자기 자신 제외)
     */
    @Query("SELECT CASE WHEN COUNT(l) > 0 THEN true ELSE false END " +
           "FROM Label l WHERE l.board.id = :boardId AND l.name = :name AND l.id <> :excludeLabelId")
    boolean existsByBoardIdAndNameExcludingId(@Param("boardId") Long boardId,
                                               @Param("name") String name,
                                               @Param("excludeLabelId") Long excludeLabelId);

    /**
     * 보드의 라벨 개수 조회
     */
    long countByBoardId(Long boardId);

    /**
     * 보드의 마지막 표시 순서 조회
     */
    @Query("SELECT COALESCE(MAX(l.displayOrder), -1) FROM Label l WHERE l.board.id = :boardId")
    Integer findMaxDisplayOrderByBoardId(@Param("boardId") Long boardId);
}
