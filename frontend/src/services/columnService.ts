import axiosInstance from '@/utils/axios';
import { Column, CreateColumnRequest, UpdateColumnRequest } from '@/types/column';

class ColumnService {
  /**
   * 보드의 모든 칼럼 조회
   */
  async listColumns(workspaceId: number, boardId: number): Promise<Column[]> {
    const response = await axiosInstance.get<Column[]>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns`
    );
    return response.data;
  }

  /**
   * 특정 칼럼 조회
   */
  async getColumn(workspaceId: number, boardId: number, columnId: number): Promise<Column> {
    const response = await axiosInstance.get<Column>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}`
    );
    return response.data;
  }

  /**
   * 칼럼 생성
   */
  async createColumn(
    workspaceId: number,
    boardId: number,
    request: CreateColumnRequest
  ): Promise<Column> {
    const response = await axiosInstance.post<Column>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns`,
      request
    );
    return response.data;
  }

  /**
   * 칼럼 정보 수정
   */
  async updateColumn(
    workspaceId: number,
    boardId: number,
    columnId: number,
    request: UpdateColumnRequest
  ): Promise<Column> {
    const response = await axiosInstance.put<Column>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}`,
      request
    );
    return response.data;
  }

  /**
   * 칼럼 삭제
   */
  async deleteColumn(workspaceId: number, boardId: number, columnId: number): Promise<void> {
    await axiosInstance.delete(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}`
    );
  }

  /**
   * 칼럼 위치 업데이트 (드래그 앤 드롭)
   */
  async updateColumnPosition(
    workspaceId: number,
    boardId: number,
    columnId: number,
    newPosition: number
  ): Promise<Column> {
    const response = await axiosInstance.put<Column>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}`,
      { position: newPosition }
    );
    return response.data;
  }
}

export default new ColumnService();
