package com.kanban.dashboard;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.kanban.board.BoardRepository;
import com.kanban.card.CardRepository;
import com.kanban.dashboard.dto.BoardInsightsResponse;
import com.kanban.dashboard.dto.DashboardSummaryResponse;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

        private final CardRepository cardRepository;
        private final BoardRepository boardRepository;

        @Cacheable(value = "dashboardSummary", key = "#workspaceId")
        public DashboardSummaryResponse getGlobalSummary(Long workspaceId) {
                java.time.LocalDate today = java.time.LocalDate.now();
                long totalBoards = boardRepository.countActiveByWorkspaceId(workspaceId);
                long totalCards = cardRepository.countByWorkspaceId(workspaceId);
                long completedCards =
                                cardRepository.countByWorkspaceIdAndIsCompletedTrue(workspaceId);
                long incompleteCards =
                                cardRepository.countByWorkspaceIdAndIsCompletedFalse(workspaceId);
                long overdueCards = cardRepository.countOverdueByWorkspaceId(workspaceId, today);

                // Due soon: next 2 days
                LocalDateTime now = LocalDateTime.now();
                // 2일 이내 마감
                long dueSoonCards = cardRepository.countDueSoonByWorkspaceId(workspaceId,
                                today.plusDays(2));

                long unassignedHighPriorityCards = cardRepository
                                .countUnassignedHighPriorityByWorkspaceId(workspaceId);

                // Boards by overdue (Top 5)
                List<Object[]> boardsByOverdueRaw = cardRepository
                                .findBoardsByOverdueCount(workspaceId, today, PageRequest.of(0, 5));
                List<DashboardSummaryResponse.BoardOverdueSummary> boardsByOverdue =
                                boardsByOverdueRaw.stream().map(
                                                obj -> DashboardSummaryResponse.BoardOverdueSummary
                                                                .builder().boardId((Long) obj[0])
                                                                .boardName((String) obj[1])
                                                                .overdue((Long) obj[2]).build())
                                                .collect(Collectors.toList());

                // Recent activity (last 7 days)
                LocalDateTime sevenDaysAgo = now.minusDays(7);
                long created7d = cardRepository.countByWorkspaceIdAndCreatedAtAfter(workspaceId,
                                sevenDaysAgo);
                long updated7d = cardRepository.countByWorkspaceIdAndUpdatedAtAfter(workspaceId,
                                sevenDaysAgo);

                return DashboardSummaryResponse.builder().totalBoards(totalBoards)
                                .totalCards(totalCards).completedCards(completedCards)
                                .incompleteCards(incompleteCards).overdueCards(overdueCards)
                                .dueSoonCards(dueSoonCards)
                                .unassignedHighPriorityCards(unassignedHighPriorityCards)
                                .boardsByOverdue(boardsByOverdue)
                                .recentActivity(DashboardSummaryResponse.RecentActivity.builder()
                                                .created7d(created7d).updated7d(updated7d).build())
                                .build();
        }

        @Cacheable(value = "boardInsights", key = "#boardId")
        public BoardInsightsResponse getBoardInsights(Long boardId) {
                java.time.LocalDate today = java.time.LocalDate.now();
                // 2일 이내 마감 기준
                java.time.LocalDate dueSoonLimit = today.plusDays(2);

                // Column Insights
                List<Object[]> columnStats = cardRepository.findColumnInsightsByBoardId(boardId,
                                today, dueSoonLimit);
                List<BoardInsightsResponse.ColumnInsight> byColumn = columnStats.stream()
                                .map(obj -> BoardInsightsResponse.ColumnInsight.builder()
                                                .columnId((Long) obj[0]).name((String) obj[1])
                                                .total((Long) obj[2]).overdue((Long) obj[3])
                                                .dueSoon((Long) obj[4]).build())
                                .collect(Collectors.toList());

                // Completion Stats
                List<Object[]> completionStatsRaw =
                                cardRepository.findCompletionStatsByBoardId(boardId);
                long completed = 0;
                long incomplete = 0;
                for (Object[] obj : completionStatsRaw) {
                        boolean isCompleted = (Boolean) obj[0];
                        long count = (Long) obj[1];
                        if (isCompleted) {
                                completed = count;
                        } else {
                                incomplete = count;
                        }
                }

                // Priority Stats
                List<Object[]> priorityStatsRaw =
                                cardRepository.findPriorityStatsByBoardId(boardId);
                long high = 0;
                long medium = 0;
                long low = 0;
                for (Object[] obj : priorityStatsRaw) {
                        // Assuming Priority is an Enum or String. If Enum, need to cast or
                        // toString().
                        // In JPA query, it returns the Enum value usually.
                        if (obj[0] == null) {
                                continue;
                        }
                        String priority = obj[0].toString();
                        long count = (Long) obj[1];
                        if ("HIGH".equalsIgnoreCase(priority))
                                high = count;
                        else if ("MEDIUM".equalsIgnoreCase(priority))
                                medium = count;
                        else if ("LOW".equalsIgnoreCase(priority))
                                low = count;
                }

                // Assignee Insights
                List<Object[]> assigneeInsightsRaw =
                                cardRepository.findAssigneeInsightsByBoardId(boardId, today);
                List<BoardInsightsResponse.AssigneeInsight> byAssignee = assigneeInsightsRaw
                                .stream()
                                .map(obj -> BoardInsightsResponse.AssigneeInsight.builder()
                                                .assigneeId((Long) obj[0]).name((String) obj[1])
                                                .total((Long) obj[2]).overdue((Long) obj[3])
                                                .build())
                                .collect(Collectors.toList());

                // No Due Date
                long noDueDate = cardRepository
                                .countByBoardIdAndDueDateIsNullAndIsCompletedFalse(boardId);

                return BoardInsightsResponse.builder().byColumn(byColumn)
                                .completion(BoardInsightsResponse.CompletionStats.builder()
                                                .completed(completed).incomplete(incomplete)
                                                .build())
                                .priority(BoardInsightsResponse.PriorityStats.builder().high(high)
                                                .medium(medium).low(low).build())
                                .byAssignee(byAssignee).noDueDate(noDueDate).build();
        }
}
