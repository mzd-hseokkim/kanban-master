import type { BoardInsightsResponse, DashboardSummaryResponse } from '@/types/dashboard';
import axiosInstance from '@/utils/axios';

export const dashboardService = {
  /**
   * 전역 대시보드 요약 조회
   */
  async getGlobalSummary(workspaceId: number): Promise<DashboardSummaryResponse> {
    const response = await axiosInstance.get<DashboardSummaryResponse>(
      `/workspaces/${workspaceId}/dashboard/summary`
    );
    return response.data;
  },

  /**
   * 보드 인사이트 조회
   */
  async getBoardInsights(workspaceId: number, boardId: number): Promise<BoardInsightsResponse> {
    const response = await axiosInstance.get<BoardInsightsResponse>(
      `/workspaces/${workspaceId}/dashboard/boards/${boardId}/insights`
    );
    return response.data;
  },
};
