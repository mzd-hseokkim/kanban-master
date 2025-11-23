package com.kanban.column;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 칼럼(BoardColumn) 데이터 접근 계층
 */
@Repository
public interface ColumnRepository extends JpaRepository<BoardColumn, Long> {

        /**
         * 특정 보드의 모든 칼럼을 위치 순서대로 조회
         */
        @Query("SELECT c FROM BoardColumn c WHERE c.board.id = :boardId ORDER BY c.position ASC")
        List<BoardColumn> findByBoardIdOrderByPosition(@Param("boardId") Long boardId);

        /**
         * 특정 보드의 칼럼 개수 조회
         */
        @Query("SELECT COUNT(c) FROM BoardColumn c WHERE c.board.id = :boardId")
        int countByBoardId(@Param("boardId") Long boardId);

        /**
         * 보드와 ID로 칼럼 조회 권한 검증 시 사용
         */
        @Query("SELECT c FROM BoardColumn c WHERE c.id = :columnId AND c.board.id = :boardId")
        Optional<BoardColumn> findByIdAndBoardId(@Param("columnId") Long columnId,
                        @Param("boardId") Long boardId);

        /**
         * 특정 위치 이상의 칼럼들의 position을 업데이트 (드래그 앤 드롭으로 칼럼 순서 변경 시 사용)
         */
        @Modifying
        @Query("UPDATE BoardColumn c SET c.position = c.position + :offset WHERE c.board.id = :boardId AND c.position >= :fromPosition")
        void updatePositionsFrom(@Param("boardId") Long boardId,
                        @Param("fromPosition") Integer fromPosition,
                        @Param("offset") Integer offset);

        /**
         * 워크스페이스 내에서 이름으로 칼럼 검색
         */
        List<BoardColumn> findByBoardWorkspaceIdAndNameContainingIgnoreCase(Long workspaceId,
                        String name);

        /**
         * 보드 내에서 이름으로 칼럼 조회 (대소문자 무시)
         */
        Optional<BoardColumn> findByBoardIdAndNameIgnoreCase(Long boardId, String name);
}
