package com.kanban.analytics.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CycleTimeData {
    private Long cardId;
    private String title;
    private double cycleTimeDays;
    private LocalDateTime completedAt;
}
