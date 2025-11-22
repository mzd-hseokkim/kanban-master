import axiosInstance from '@/utils/axios';

export interface Attachment {
  id: number;
  cardId: number;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

const attachmentService = {
  /**
   * 첨부파일 업로드
   */
  async uploadAttachment(
    workspaceId: number,
    boardId: number,
    columnId: number,
    cardId: number,
    file: File
  ): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post<Attachment>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/cards/${cardId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * 첨부파일 목록 조회
   */
  async getAttachments(
    workspaceId: number,
    boardId: number,
    columnId: number,
    cardId: number
  ): Promise<Attachment[]> {
    const response = await axiosInstance.get<Attachment[]>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/cards/${cardId}/attachments`
    );
    return response.data;
  },

  /**
   * 첨부파일 다운로드 URL 생성
   */
  getDownloadUrl(attachmentId: number): string {
    // API 서버의 Base URL을 고려해야 함
    // axiosInstance의 baseURL을 가져오거나 환경변수 사용
    const baseURL = axiosInstance.defaults.baseURL || '/api/v1';
    return `${baseURL}/attachments/${attachmentId}/download`;
  },

  /**
   * 첨부파일 다운로드 (Blob)
   */
  async downloadAttachment(attachmentId: number): Promise<Blob> {
    const response = await axiosInstance.get(`/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * 첨부파일 삭제
   */
  async deleteAttachment(attachmentId: number): Promise<void> {
    await axiosInstance.delete(`/attachments/${attachmentId}`);
  },
};

export default attachmentService;
