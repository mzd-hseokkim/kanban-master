import type { Sprint, SprintCreateRequest, SprintSnapshot } from '@/types/sprint';
import axiosInstance from '@/utils/axios';

class SprintService {
  /**
   * 보드의 모든 스프린트 조회
   */
  async getSprints(boardId: number): Promise<Sprint[]> {
    const response = await axiosInstance.get<Sprint[]>(`/boards/${boardId}/sprints`);
    return response.data;
  }

  /**
   * 스프린트 생성
   */
  async createSprint(boardId: number, request: Omit<SprintCreateRequest, 'boardId'>): Promise<Sprint> {
    const response = await axiosInstance.post<Sprint>(`/boards/${boardId}/sprints`, {
      ...request,
      boardId,
    });
    return response.data;
  }

  /**
   * 스프린트 시작
   */
  async startSprint(sprintId: number): Promise<Sprint> {
    const response = await axiosInstance.put<Sprint>(`/sprints/${sprintId}/start`);
    return response.data;
  }

  /**
   * 스프린트 완료 (롤오버 처리 포함)
   */
  async completeSprint(sprintId: number): Promise<Sprint> {
    const response = await axiosInstance.put<Sprint>(`/sprints/${sprintId}/complete`);
    return response.data;
  }

  /**
   * 스프린트에 카드 일괄 배정
   */
  async assignCards(sprintId: number, cardIds: number[]): Promise<void> {
    await axiosInstance.post(`/sprints/${sprintId}/cards`, cardIds);
  }

  /**
   * 스프린트에 단일 카드 배정
   */
  async assignCardToSprint(_boardId: number, cardId: number, sprintId: number): Promise<void> {
    await axiosInstance.post(`/sprints/${sprintId}/cards`, [cardId]);
  }

  /**
   * 스프린트에서 카드 제거 (백로그로 이동)
   */
  async removeCard(sprintId: number, cardId: number): Promise<void> {
    await axiosInstance.delete(`/sprints/${sprintId}/cards/${cardId}`);
  }

  /**
   * 백로그 카드 조회 (스프린트 미할당)
   */
  async getBacklog(boardId: number): Promise<any[]> {
    const response = await axiosInstance.get(`/boards/${boardId}/backlog`);
    return response.data;
  }

  /**
   * 번다운 차트 데이터 조회
   */
  async getBurndown(sprintId: number): Promise<SprintSnapshot[]> {
    const response = await axiosInstance.get<SprintSnapshot[]>(`/sprints/${sprintId}/burndown`);
    return response.data;
  }

  /**
   * 베로서티 차트 데이터 조회
   */
  async getVelocity(boardId: number): Promise<number[]> {
    const response = await axiosInstance.get<number[]>(`/boards/${boardId}/velocity`);
    return response.data;
  }
}

export default new SprintService();
