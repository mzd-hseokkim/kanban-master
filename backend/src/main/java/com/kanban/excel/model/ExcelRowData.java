package com.kanban.excel.model;

import java.time.LocalDate;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ExcelRowData {
    private int rowIndex;
    private String columnName;
    private Integer columnPosition;
    private String cardTitle;
    private Integer cardPosition;
    private String description;
    private List<String> labels;
    private String assigneeEmail;
    private LocalDate dueDate;
    private List<String> checklistItems;
    private List<Boolean> checklistStates;
    private String priority;
    private String parentCardTitle;
}
