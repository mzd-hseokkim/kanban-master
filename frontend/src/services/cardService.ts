import axiosInstance from '@/utils/axios';
import type { Card, CreateCardRequest, UpdateCardRequest } from '@/types/card';

class CardService {
  /**
   * 칼럼의 모든 카드 조회
   */
  async listCards(workspaceId: number, boardId: number, columnId: number): Promise<Card[]> {
    const response = await axiosInstance.get<Card[]>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/cards`
    );
    return response.data;
  }

  /**
   * 특정 카드 조회
   */
  async getCard(workspaceId: number, boardId: number, columnId: number, cardId: number): Promise<Card> {
    const response = await axiosInstance.get<Card>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/cards/${cardId}`
    );
    return response.data;
  }

  /**
   * 카드 생성
   */
  async createCard(
    workspaceId: number,
    boardId: number,
    columnId: number,
    request: CreateCardRequest
  ): Promise<Card> {
    const response = await axiosInstance.post<Card>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/cards`,
      request
    );
    return response.data;
  }

  /**
   * 카드 수정
   */
  async updateCard(
    workspaceId: number,
    boardId: number,
    columnId: number,
    cardId: number,
    request: UpdateCardRequest
  ): Promise<Card> {
    const response = await axiosInstance.put<Card>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/cards/${cardId}`,
      request
    );
    return response.data;
  }

  /**
   * 카드 삭제
   */
  async deleteCard(workspaceId: number, boardId: number, columnId: number, cardId: number): Promise<void> {
    await axiosInstance.delete(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/cards/${cardId}`
    );
  }

  /**
   * 카드 위치 업데이트
   */
  async updateCardPosition(
    workspaceId: number,
    boardId: number,
    columnId: number,
    cardId: number,
    newPosition: number
  ): Promise<Card> {
    const response = await axiosInstance.put<Card>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/cards/${cardId}`,
      { position: newPosition }
    );
    return response.data;
  }
}

export default new CardService();
