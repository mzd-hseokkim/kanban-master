package com.kanban.dashboard.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {
    private long totalBoards;
    private long totalCards;
    private long completedCards;
    private long incompleteCards;
    private long overdueCards;
    private long dueSoonCards;
    private long unassignedHighPriorityCards;
    private List<BoardOverdueSummary> boardsByOverdue;
    private RecentActivity recentActivity;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BoardOverdueSummary {
        private Long boardId;
        private String boardName;
        private long overdue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivity {
        private long created7d;
        private long updated7d;
    }
}
