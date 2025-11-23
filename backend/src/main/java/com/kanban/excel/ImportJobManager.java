package com.kanban.excel;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class ImportJobManager {

    private final Map<String, ImportJobStatus> jobs = new ConcurrentHashMap<>();

    public ImportJobStatus createJob(Long workspaceId, Long boardId, ExcelImportMode mode,
            String filename) {
        String jobId = UUID.randomUUID().toString();
        ImportJobStatus status = ImportJobStatus.builder().jobId(jobId).workspaceId(workspaceId)
                .boardId(boardId).mode(mode).filename(filename).state(ImportJobState.PENDING)
                .build();
        jobs.put(jobId, status);
        return status;
    }

    public Optional<ImportJobStatus> getJob(String jobId) {
        return Optional.ofNullable(jobs.get(jobId));
    }

    public ImportJobStatus markInProgress(String jobId, int totalRows) {
        ImportJobStatus status = jobs.get(jobId);
        if (status != null) {
            status.setState(ImportJobState.IN_PROGRESS);
            status.setTotalRows(totalRows);
            status.setStartedAt(LocalDateTime.now());
        }
        return status;
    }

    public void updateProgress(String jobId, int processed, int success, int failure) {
        ImportJobStatus status = jobs.get(jobId);
        if (status != null) {
            status.setProcessedRows(processed);
            status.setSuccessCount(success);
            status.setFailureCount(failure);
        }
    }

    public void appendError(String jobId, ImportRowError error) {
        ImportJobStatus status = jobs.get(jobId);
        if (status != null) {
            status.addError(error);
        }
    }

    public void markCompleted(String jobId, String message) {
        ImportJobStatus status = jobs.get(jobId);
        if (status != null) {
            status.setState(ImportJobState.COMPLETED);
            status.setMessage(message);
            status.setFinishedAt(LocalDateTime.now());
            status.setProcessedRows(Math.max(status.getProcessedRows(), status.getTotalRows()));
        }
    }

    public void markFailed(String jobId, String message) {
        ImportJobStatus status = jobs.get(jobId);
        if (status != null) {
            status.setState(ImportJobState.FAILED);
            status.setMessage(message);
            status.setFinishedAt(LocalDateTime.now());
        }
    }
}
