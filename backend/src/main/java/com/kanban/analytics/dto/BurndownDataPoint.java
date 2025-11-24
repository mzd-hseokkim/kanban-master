package com.kanban.analytics.dto;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BurndownDataPoint {
    private LocalDate date;
    private long remainingTasks;
    private Double idealTasks;
}
