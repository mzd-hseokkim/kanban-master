import excelService from '@/services/excelService';
import type { ImportJobStartResponse } from '@/types/excel';
import { useCallback, useRef, useState } from 'react';

export const useBoardExcel = (
  workspaceNumericId: number,
  boardNumericId: number,
  hasValidNumericIds: boolean,
  alert: (message: string) => Promise<void>
) => {
  const [activeImportJobId, setActiveImportJobId] = useState<string | null>(null);
  const [importFileName, setImportFileName] = useState<string>('엑셀 가져오기');
  const lastImportState = useRef<ImportJobStartResponse['state'] | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, []);

  const handleTemplateDownload = useCallback(async () => {
    if (!hasValidNumericIds) {
      await alert('보드 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setIsDownloadingTemplate(true);
    try {
      const blob = await excelService.downloadTemplate(workspaceNumericId, boardNumericId);
      downloadBlob(blob, `board-${boardNumericId}-template.xlsx`);
    } catch (err) {
      const message = err instanceof Error ? err.message : '템플릿 다운로드에 실패했습니다.';
      await alert(message);
    } finally {
      setIsDownloadingTemplate(false);
    }
  }, [alert, boardNumericId, downloadBlob, hasValidNumericIds, workspaceNumericId]);

  const handleExportBoard = useCallback(async () => {
    if (!hasValidNumericIds) {
      await alert('보드 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setIsExporting(true);
    try {
      const blob = await excelService.exportBoard(workspaceNumericId, boardNumericId);
      downloadBlob(blob, `board-${boardNumericId}-export.xlsx`);
    } catch (err) {
      const message = err instanceof Error ? err.message : '엑셀 내보내기에 실패했습니다.';
      await alert(message);
    } finally {
      setIsExporting(false);
    }
  }, [alert, boardNumericId, downloadBlob, hasValidNumericIds, workspaceNumericId]);

  const handleImportStarted = useCallback((job: ImportJobStartResponse, fileName: string) => {
    setActiveImportJobId(job.jobId);
    setImportFileName(fileName);
  }, []);

  return {
    activeImportJobId,
    setActiveImportJobId,
    importFileName,
    lastImportState,
    isExporting,
    isDownloadingTemplate,
    handleTemplateDownload,
    handleExportBoard,
    handleImportStarted,
  };
};
