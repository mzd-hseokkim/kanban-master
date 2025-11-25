package com.kanban.sprint.dto;

import java.time.LocalDate;
import lombok.Data;

@Data
public class SprintCreateRequest {
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private String goalText;
    private Integer capacity;
    private Long boardId;
}
