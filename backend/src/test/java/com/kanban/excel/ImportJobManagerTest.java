package com.kanban.excel;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.Test;

class ImportJobManagerTest {

    @Test
    void createAndTrackJobStatus() {
        ImportJobManager manager = new ImportJobManager();

        ImportJobStatus created = manager.createJob(1L, 2L, ExcelImportMode.MERGE, "sample.xlsx");
        assertNotNull(created.getJobId());
        assertEquals(ImportJobState.PENDING, created.getState());

        manager.markInProgress(created.getJobId(), 10);
        manager.updateProgress(created.getJobId(), 5, 4, 1);
        ImportJobStatus inProgress = manager.getJob(created.getJobId()).orElseThrow();
        assertEquals(ImportJobState.IN_PROGRESS, inProgress.getState());
        assertEquals(1, inProgress.getFailureCount());
        assertEquals(5, inProgress.getProcessedRows());

        manager.appendError(created.getJobId(), new ImportRowError(2, "label missing"));
        assertEquals(1, inProgress.getErrors().size());

        manager.markCompleted(created.getJobId(), "done");
        ImportJobStatus completed = manager.getJob(created.getJobId()).orElseThrow();
        assertEquals(ImportJobState.COMPLETED, completed.getState());
        assertNotNull(completed.getFinishedAt());
        assertEquals("done", completed.getMessage());
    }
}
