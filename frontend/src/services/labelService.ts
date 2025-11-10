import axiosInstance from '@/utils/axios';
import type {
  Label,
  CreateLabelRequest,
  UpdateLabelRequest,
  ReorderLabelsRequest,
} from '@/types/label';

/**
 * 라벨 서비스
 * 보드의 라벨 관리 및 카드-라벨 연결 API 호출
 */
export const labelService = {
  /**
   * 보드의 모든 라벨 조회
   */
  async getLabels(boardId: number): Promise<Label[]> {
    const response = await axiosInstance.get<Label[]>(
      `/boards/${boardId}/labels`
    );
    return response.data;
  },

  /**
   * 특정 라벨 조회
   */
  async getLabel(boardId: number, labelId: number): Promise<Label> {
    const response = await axiosInstance.get<Label>(
      `/boards/${boardId}/labels/${labelId}`
    );
    return response.data;
  },

  /**
   * 새 라벨 생성
   */
  async createLabel(boardId: number, data: CreateLabelRequest): Promise<Label> {
    const response = await axiosInstance.post<Label>(
      `/boards/${boardId}/labels`,
      data
    );
    return response.data;
  },

  /**
   * 라벨 수정
   */
  async updateLabel(
    boardId: number,
    labelId: number,
    data: UpdateLabelRequest
  ): Promise<Label> {
    const response = await axiosInstance.patch<Label>(
      `/boards/${boardId}/labels/${labelId}`,
      data
    );
    return response.data;
  },

  /**
   * 라벨 삭제
   */
  async deleteLabel(boardId: number, labelId: number): Promise<void> {
    await axiosInstance.delete(`/boards/${boardId}/labels/${labelId}`);
  },

  /**
   * 라벨 순서 변경
   */
  async reorderLabels(
    boardId: number,
    data: ReorderLabelsRequest
  ): Promise<Label[]> {
    const response = await axiosInstance.put<Label[]>(
      `/boards/${boardId}/labels/reorder`,
      data
    );
    return response.data;
  },

  // === 카드-라벨 연결 API ===

  /**
   * 카드의 라벨 목록 조회
   */
  async getCardLabels(cardId: number): Promise<Label[]> {
    const response = await axiosInstance.get<Label[]>(`/cards/${cardId}/labels`);
    return response.data;
  },

  /**
   * 카드에 라벨 할당 (기존 라벨 모두 제거 후 새로 할당)
   */
  async assignLabelsToCard(cardId: number, labelIds: number[]): Promise<Label[]> {
    const response = await axiosInstance.put<Label[]>(
      `/cards/${cardId}/labels`,
      { labelIds }
    );
    return response.data;
  },

  /**
   * 카드에 라벨 추가
   */
  async addLabelToCard(cardId: number, labelId: number): Promise<Label> {
    const response = await axiosInstance.post<Label>(
      `/cards/${cardId}/labels/${labelId}`
    );
    return response.data;
  },

  /**
   * 카드에서 라벨 제거
   */
  async removeLabelFromCard(cardId: number, labelId: number): Promise<void> {
    await axiosInstance.delete(`/cards/${cardId}/labels/${labelId}`);
  },
};
