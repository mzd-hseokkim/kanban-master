package com.kanban.excel;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ImportJobStatus {
    @Builder.Default
    private String jobId = "";
    private Long workspaceId;
    private Long boardId;
    private ExcelImportMode mode;
    @Builder.Default
    private ImportJobState state = ImportJobState.PENDING;
    @Builder.Default
    private int totalRows = 0;
    @Builder.Default
    private int processedRows = 0;
    @Builder.Default
    private int successCount = 0;
    @Builder.Default
    private int failureCount = 0;
    @Builder.Default
    private List<ImportRowError> errors = new ArrayList<>();
    private String filename;
    @Builder.Default
    private LocalDateTime startedAt = LocalDateTime.now();
    private LocalDateTime finishedAt;
    private String message;

    public void addError(ImportRowError error) {
        this.errors.add(error);
    }

    public int progressPercent() {
        if (totalRows <= 0) {
            return state == ImportJobState.COMPLETED ? 100 : 0;
        }
        return Math.min(100, (int) (((double) processedRows / totalRows) * 100));
    }
}
