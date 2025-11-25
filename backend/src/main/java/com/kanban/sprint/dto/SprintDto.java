package com.kanban.sprint.dto;

import java.time.LocalDate;
import com.kanban.sprint.SprintStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SprintDto {
    private Long id;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private SprintStatus status;
    private String goalText;
    private Integer capacity;
    private Long boardId;
    private Integer cardCount;
    private Integer totalPoints;
    private Integer completedPoints;
}
