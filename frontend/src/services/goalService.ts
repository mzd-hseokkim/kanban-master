import type { Goal, GoalCreateRequest } from '@/types/goal';
import axiosInstance from '@/utils/axios';

class GoalService {
  /**
   * 보드의 모든 목표 조회
   */
  async getGoals(boardId: number): Promise<Goal[]> {
    const response = await axiosInstance.get<Goal[]>(`/boards/${boardId}/goals`);
    return response.data;
  }

  /**
   * 목표 생성
   */
  async createGoal(boardId: number, request: Omit<GoalCreateRequest, 'boardId'>): Promise<Goal> {
    const response = await axiosInstance.post<Goal>(`/boards/${boardId}/goals`, {
      ...request,
      boardId,
    });
    return response.data;
  }

  /**
   * 목표 진행률 업데이트
   */
  async updateProgress(goalId: number, progress: number): Promise<Goal> {
    const response = await axiosInstance.put<Goal>(`/goals/${goalId}/progress`, progress);
    return response.data;
  }
}

export default new GoalService();
