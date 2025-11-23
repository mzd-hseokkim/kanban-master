package com.kanban.excel.dto;

import com.kanban.excel.ExcelImportMode;
import com.kanban.excel.ImportJobState;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ImportJobStartResponse {
    private String jobId;
    private ImportJobState state;
    private ExcelImportMode mode;
    private String filename;
}
