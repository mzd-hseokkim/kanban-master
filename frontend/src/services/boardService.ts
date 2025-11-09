import axiosInstance from '@/utils/axios';
import type { Board, CreateBoardRequest, UpdateBoardRequest } from '@/types/board';

export const boardService = {
  /**
   * 워크스페이스의 모든 활성 보드 목록 조회
   */
  async listBoards(workspaceId: number): Promise<Board[]> {
    const response = await axiosInstance.get<Board[]>(
      `/workspaces/${workspaceId}/boards`
    );
    return response.data;
  },

  /**
   * 워크스페이스의 최근 활성 보드 조회 (대시보드용)
   */
  async getRecentBoards(workspaceId: number, limit: number = 10): Promise<Board[]> {
    const response = await axiosInstance.get<Board[]>(
      `/workspaces/${workspaceId}/boards/recent`,
      { params: { limit } }
    );
    return response.data;
  },

  /**
   * 특정 보드 조회
   */
  async getBoard(workspaceId: number, boardId: number): Promise<Board> {
    const response = await axiosInstance.get<Board>(
      `/workspaces/${workspaceId}/boards/${boardId}`
    );
    return response.data;
  },

  /**
   * 새 보드 생성
   */
  async createBoard(workspaceId: number, data: CreateBoardRequest): Promise<Board> {
    const response = await axiosInstance.post<Board>(
      `/workspaces/${workspaceId}/boards`,
      data
    );
    return response.data;
  },

  /**
   * 보드 정보 수정
   */
  async updateBoard(
    workspaceId: number,
    boardId: number,
    data: UpdateBoardRequest
  ): Promise<Board> {
    const response = await axiosInstance.patch<Board>(
      `/workspaces/${workspaceId}/boards/${boardId}`,
      data
    );
    return response.data;
  },

  /**
   * 보드 아카이브
   */
  async archiveBoard(workspaceId: number, boardId: number): Promise<Board> {
    const response = await axiosInstance.post<Board>(
      `/workspaces/${workspaceId}/boards/${boardId}/archive`
    );
    return response.data;
  },

  /**
   * 보드 복구 (아카이브에서)
   */
  async unarchiveBoard(workspaceId: number, boardId: number): Promise<Board> {
    const response = await axiosInstance.post<Board>(
      `/workspaces/${workspaceId}/boards/${boardId}/unarchive`
    );
    return response.data;
  },

  /**
   * 보드 삭제 (소프트 삭제)
   */
  async deleteBoard(workspaceId: number, boardId: number): Promise<void> {
    await axiosInstance.delete(
      `/workspaces/${workspaceId}/boards/${boardId}`
    );
  },

  /**
   * 삭제된 보드 복구
   */
  async restoreBoard(workspaceId: number, boardId: number): Promise<Board> {
    const response = await axiosInstance.post<Board>(
      `/workspaces/${workspaceId}/boards/${boardId}/restore`
    );
    return response.data;
  },
};
