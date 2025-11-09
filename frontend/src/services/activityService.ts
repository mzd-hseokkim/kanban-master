import axiosInstance from '@/utils/axios';
import type { Activity } from '@/types/activity';

export const activityService = {
  /**
   * 보드의 활동 로그 조회
   */
  async getBoardActivities(
    boardId: number,
    page: number = 0,
    size: number = 50
  ): Promise<{ content: Activity[]; totalElements: number; totalPages: number }> {
    const response = await axiosInstance.get(
      `/activities/boards/${boardId}`,
      { params: { page, size } }
    );
    return response.data;
  },

  /**
   * 카드의 활동 로그 조회
   */
  async getCardActivities(
    cardId: number,
    page: number = 0,
    size: number = 50,
    actorId?: number
  ): Promise<{ content: Activity[]; totalElements: number; totalPages: number }> {
    const response = await axiosInstance.get(
      `/activities/cards/${cardId}`,
      { params: { page, size, actorId } }
    );
    return response.data;
  },

  /**
   * 사용자의 활동 로그 조회
   */
  async getUserActivities(
    userId: number,
    page: number = 0,
    size: number = 50
  ): Promise<{ content: Activity[]; totalElements: number; totalPages: number }> {
    const response = await axiosInstance.get(
      `/activities/users/${userId}`,
      { params: { page, size } }
    );
    return response.data;
  },

  /**
   * 특정 활동 로그 조회
   */
  async getActivity(id: number): Promise<Activity> {
    const response = await axiosInstance.get(`/activities/${id}`);
    return response.data;
  },
};
