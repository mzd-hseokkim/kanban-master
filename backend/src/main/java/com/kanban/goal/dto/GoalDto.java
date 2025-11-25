package com.kanban.goal.dto;

import com.kanban.goal.GoalMetricType;
import com.kanban.goal.GoalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoalDto {
    private Long id;
    private Long boardId;
    private String title;
    private String description;
    private GoalStatus status;
    private Integer progress;
    private GoalMetricType metricType;
}
