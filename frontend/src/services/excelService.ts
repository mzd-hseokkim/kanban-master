import axiosInstance from '@/utils/axios';
import type { ExcelImportMode, ImportJobStartResponse, ImportJobStatus } from '@/types/excel';

const excelService = {
  async downloadTemplate(workspaceId: number, boardId: number): Promise<Blob> {
    const response = await axiosInstance.get(
      `/workspaces/${workspaceId}/boards/${boardId}/excel/template`,
      { responseType: 'blob' }
    );
    return response.data;
  },

  async exportBoard(workspaceId: number, boardId: number): Promise<Blob> {
    const response = await axiosInstance.get(
      `/workspaces/${workspaceId}/boards/${boardId}/excel/export`,
      { responseType: 'blob' }
    );
    return response.data;
  },

  async startImport(
    workspaceId: number,
    boardId: number,
    file: File,
    mode: ExcelImportMode
  ): Promise<ImportJobStartResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode.toLowerCase());

    const response = await axiosInstance.post<ImportJobStartResponse>(
      `/workspaces/${workspaceId}/boards/${boardId}/excel/import`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },

  async getStatus(jobId: string): Promise<ImportJobStatus> {
    const response = await axiosInstance.get<ImportJobStatus>(`/import/${jobId}/status`);
    return response.data;
  },
};

export default excelService;
