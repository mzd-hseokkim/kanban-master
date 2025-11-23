export type ImportJobState = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
export type ExcelImportMode = 'MERGE' | 'OVERWRITE';

export interface ImportJobStatus {
  jobId: string;
  workspaceId: number;
  boardId: number;
  mode: ExcelImportMode;
  state: ImportJobState;
  totalRows: number;
  processedRows: number;
  successCount: number;
  failureCount: number;
  progressPercent: number;
  errors: Array<{ rowNumber: number; message: string }>;
  message?: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface ImportJobStartResponse {
  jobId: string;
  state: ImportJobState;
  mode: ExcelImportMode;
  filename?: string;
}
