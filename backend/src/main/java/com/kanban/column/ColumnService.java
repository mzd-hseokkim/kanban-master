package com.kanban.column;

import java.util.List;
import java.util.NoSuchElementException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.kanban.activity.ActivityEventType;
import com.kanban.activity.ActivityScopeType;
import com.kanban.activity.ActivityService;
import com.kanban.board.Board;
import com.kanban.board.BoardRepository;
import com.kanban.board.member.BoardMemberRole;
import com.kanban.board.member.BoardMemberRoleValidator;
import com.kanban.column.dto.ColumnResponse;
import lombok.RequiredArgsConstructor;

/**
 * 칼럼(BoardColumn) 비즈니스 로직 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ColumnService {

        private static final String COLUMN_NOT_FOUND_MESSAGE = "칼럼을 찾을 수 없습니다: ";

        private final ColumnRepository columnRepository;
        private final BoardRepository boardRepository;
        private final ActivityService activityService;
        private final BoardMemberRoleValidator roleValidator;
        private final com.kanban.notification.service.RedisPublisher redisPublisher;

        /**
         * 특정 보드의 모든 칼럼 조회
         */
        @Transactional(readOnly = true)
        public List<ColumnResponse> getColumnsByBoard(Long boardId) {
                return columnRepository.findByBoardIdOrderByPosition(boardId).stream()
                                .map(ColumnResponse::from).toList();
        }

        /**
         * 칼럼 ID로 칼럼 조회
         */
        @Transactional(readOnly = true)
        public ColumnResponse getColumn(Long columnId) {
                BoardColumn column = columnRepository.findById(columnId)
                                .orElseThrow(() -> new NoSuchElementException(
                                                COLUMN_NOT_FOUND_MESSAGE + columnId));
                return ColumnResponse.from(column);
        }

        /**
         * 칼럼 생성 (권한 검증 포함)
         */
        public ColumnResponse createColumnWithValidation(Long boardId, String name,
                        String description, String bgColor, Long userId) {
                // EDITOR 이상 권한 필요
                roleValidator.validateRole(boardId, BoardMemberRole.EDITOR);

                return createColumn(boardId, name, description, bgColor, userId);
        }

        /**
         * 칼럼 생성 (권한 검증 없음 - 내부 사용)
         */
        @org.springframework.cache.annotation.CacheEvict(value = "dashboardSummary",
                        allEntries = true)
        public ColumnResponse createColumn(Long boardId, String name, String description,
                        String bgColor, Long userId) {
                Board board = boardRepository.findById(boardId).orElseThrow(
                                () -> new NoSuchElementException("보드를 찾을 수 없습니다: " + boardId));

                // 현재 칼럼 개수를 position으로 설정 (마지막에 추가)
                int position = columnRepository.countByBoardId(boardId);

                BoardColumn column = BoardColumn.builder().board(board).name(name)
                                .description(description).bgColor(bgColor).position(position)
                                .build();

                BoardColumn savedColumn = columnRepository.save(column);

                // 활동 기록
                activityService.recordActivity(ActivityScopeType.BOARD, boardId,
                                ActivityEventType.COLUMN_CREATED, userId,
                                "\"" + name + "\" 칼럼이 생성되었습니다");

                // Redis 이벤트 발행
                // Redis 이벤트 발행
                ColumnResponse response = ColumnResponse.from(savedColumn);
                redisPublisher.publish(new com.kanban.notification.event.BoardEvent(
                                com.kanban.notification.event.BoardEvent.EventType.COLUMN_CREATED
                                                .name(),
                                boardId, response, userId, System.currentTimeMillis()));
                return response;
        }

        /**
         * 칼럼 업데이트 (권한 검증 포함)
         */
        @com.kanban.audit.Auditable(action = com.kanban.audit.AuditAction.UPDATE,
                        targetType = com.kanban.audit.AuditTargetType.COLUMN,
                        targetId = "#columnId")
        public ColumnResponse updateColumnWithValidation(Long boardId, Long columnId, String name,
                        String description, String bgColor) {
                // EDITOR 이상 권한 필요
                roleValidator.validateRole(boardId, BoardMemberRole.EDITOR);

                return updateColumn(columnId, name, description, bgColor);
        }

        /**
         * 칼럼 업데이트 (권한 검증 없음 - 내부 사용)
         */
        @org.springframework.cache.annotation.CacheEvict(value = "dashboardSummary",
                        allEntries = true)
        public ColumnResponse updateColumn(Long columnId, String name, String description,
                        String bgColor) {
                BoardColumn column = columnRepository.findById(columnId)
                                .orElseThrow(() -> new NoSuchElementException(
                                                COLUMN_NOT_FOUND_MESSAGE + columnId));

                if (name != null && !name.isBlank()) {
                        column.setName(name);
                }
                if (description != null) {
                        column.setDescription(description);
                }
                if (bgColor != null) {
                        column.setBgColor(bgColor);
                }

                BoardColumn savedColumn = columnRepository.save(column);

                // Redis 이벤트 발행 (userId가 없으므로 0L 또는 시스템 ID 사용, 여기서는 null 처리 주의 필요하지만 편의상 0L)
                // updateColumn 메서드는 내부 호출용이라 userId가 파라미터에 없음.
                // 하지만 실시간 업데이트를 위해 이벤트는 필요함.
                // Redis 이벤트 발행 (userId가 없으므로 0L 또는 시스템 ID 사용, 여기서는 null 처리 주의 필요하지만 편의상 0L)
                // updateColumn 메서드는 내부 호출용이라 userId가 파라미터에 없음.
                // 하지만 실시간 업데이트를 위해 이벤트는 필요함.
                ColumnResponse response = ColumnResponse.from(savedColumn);
                redisPublisher.publish(new com.kanban.notification.event.BoardEvent(
                                com.kanban.notification.event.BoardEvent.EventType.COLUMN_UPDATED
                                                .name(),
                                column.getBoard().getId(), response, 0L,
                                System.currentTimeMillis()));
                return response;
        }

        /**
         * 칼럼 위치 업데이트 (권한 검증 포함)
         */
        @com.kanban.audit.Auditable(action = com.kanban.audit.AuditAction.UPDATE,
                        targetType = com.kanban.audit.AuditTargetType.COLUMN,
                        targetId = "#columnId")
        public ColumnResponse updateColumnPositionWithValidation(Long boardId, Long columnId,
                        Integer newPosition, Long userId) {
                // EDITOR 이상 권한 필요
                roleValidator.validateRole(boardId, BoardMemberRole.EDITOR);

                return updateColumnPosition(boardId, columnId, newPosition, userId);
        }

        /**
         * 칼럼 위치 업데이트 (드래그 앤 드롭, 권한 검증 없음 - 내부 사용)
         */
        @org.springframework.cache.annotation.CacheEvict(value = "dashboardSummary",
                        allEntries = true)
        public ColumnResponse updateColumnPosition(Long boardId, Long columnId, Integer newPosition,
                        Long userId) {
                BoardColumn column = columnRepository.findByIdAndBoardId(columnId, boardId)
                                .orElseThrow(() -> new NoSuchElementException(
                                                COLUMN_NOT_FOUND_MESSAGE + columnId));

                int currentPosition = column.getPosition();

                if (currentPosition < newPosition) {
                        // 뒤로 이동: 현재 위치보다 뒤의 칼럼들을 앞으로 한 칸씩
                        columnRepository.updatePositionsFrom(boardId, currentPosition + 1, -1);
                } else if (currentPosition > newPosition) {
                        // 앞으로 이동: 새 위치 이상의 칼럼들을 뒤로 한 칸씩
                        columnRepository.updatePositionsFrom(boardId, newPosition, 1);
                }

                column.setPosition(newPosition);
                BoardColumn updatedColumn = columnRepository.save(column);

                // 활동 기록
                // 활동 기록
                if (currentPosition != newPosition) {
                        activityService.recordActivity(ActivityScopeType.BOARD, boardId,
                                        ActivityEventType.COLUMN_REORDERED, userId,
                                        "\"" + column.getName() + "\" 칼럼이 이동되었습니다");
                }

                // Redis 이벤트 발행 - 전체 칼럼 목록을 전송
                // 순서 변경 시 여러 칼럼의 position이 변경되므로 전체 목록을 조회하여 전송
                List<ColumnResponse> allColumns = getColumnsByBoard(boardId);
                redisPublisher.publish(new com.kanban.notification.event.BoardEvent(
                                com.kanban.notification.event.BoardEvent.EventType.COLUMN_REORDERED
                                                .name(),
                                boardId, allColumns, userId, System.currentTimeMillis()));
                return ColumnResponse.from(updatedColumn);
        }

        /**
         * 칼럼 삭제 (권한 검증 포함)
         */
        @com.kanban.audit.Auditable(action = com.kanban.audit.AuditAction.DELETE,
                        targetType = com.kanban.audit.AuditTargetType.COLUMN,
                        targetId = "#columnId")
        public void deleteColumnWithValidation(Long boardId, Long columnId, Long userId) {
                // EDITOR 이상 권한 필요
                roleValidator.validateRole(boardId, BoardMemberRole.EDITOR);

                deleteColumn(boardId, columnId, userId);
        }

        /**
         * 칼럼 삭제 (권한 검증 없음 - 내부 사용)
         */
        @org.springframework.cache.annotation.CacheEvict(value = "dashboardSummary",
                        allEntries = true)
        public void deleteColumn(Long boardId, Long columnId, Long userId) {
                BoardColumn column = columnRepository.findByIdAndBoardId(columnId, boardId)
                                .orElseThrow(() -> new NoSuchElementException(
                                                COLUMN_NOT_FOUND_MESSAGE + columnId));

                String columnName = column.getName();
                int deletedPosition = column.getPosition();

                // 칼럼 삭제
                columnRepository.delete(column);

                // 삭제된 칼럼 뒤의 모든 칼럼의 position을 한 칸씩 앞으로 이동
                columnRepository.updatePositionsFrom(boardId, deletedPosition, -1);

                // 활동 기록
                activityService.recordActivity(ActivityScopeType.BOARD, boardId,
                                ActivityEventType.COLUMN_DELETED, userId,
                                "\"" + columnName + "\" 칼럼이 삭제되었습니다");

                // Redis 이벤트 발행
                redisPublisher.publish(new com.kanban.notification.event.BoardEvent(
                                com.kanban.notification.event.BoardEvent.EventType.COLUMN_DELETED
                                                .name(),
                                boardId,
                                java.util.Map.of("columnId", columnId, "action", "deleted"), userId,
                                System.currentTimeMillis()));
        }
}
