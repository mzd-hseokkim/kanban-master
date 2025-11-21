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
public class BoardInsightsResponse {
    private List<ColumnInsight> byColumn;
    private CompletionStats completion;
    private PriorityStats priority;
    private List<AssigneeInsight> byAssignee;
    private long noDueDate;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ColumnInsight {
        private Long columnId;
        private String name;
        private long total;
        private long overdue;
        private long dueSoon;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompletionStats {
        private long completed;
        private long incomplete;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriorityStats {
        private long high;
        private long medium;
        private long low;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssigneeInsight {
        private Long assigneeId;
        private String name;
        private long total;
        private long overdue;
    }
}
