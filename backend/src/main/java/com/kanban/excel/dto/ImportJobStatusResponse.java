package com.kanban.excel.dto;

import java.time.LocalDateTime;
import java.util.List;
import com.kanban.excel.ExcelImportMode;
import com.kanban.excel.ImportJobState;
import com.kanban.excel.ImportRowError;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ImportJobStatusResponse {
    private String jobId;
    private Long workspaceId;
    private Long boardId;
    private ExcelImportMode mode;
    private ImportJobState state;
    private int totalRows;
    private int processedRows;
    private int successCount;
    private int failureCount;
    private int progressPercent;
    private List<ImportRowError> errors;
    private String message;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
}
