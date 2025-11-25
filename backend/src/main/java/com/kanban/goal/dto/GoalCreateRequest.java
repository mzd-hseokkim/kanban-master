package com.kanban.goal.dto;

import com.kanban.goal.GoalMetricType;
import lombok.Data;

@Data
public class GoalCreateRequest {
    private Long boardId;
    private String title;
    private String description;
    private GoalMetricType metricType;
}
