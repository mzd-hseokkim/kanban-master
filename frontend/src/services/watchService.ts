import type { WatchStatus, WatchedCard } from '@/types/watch';
import axiosInstance from '@/utils/axios';

/**
 * Watch API 서비스
 */
class WatchService {
  /**
   * Watch 토글 (추가/해제)
   */
  async toggleWatch(cardId: number): Promise<WatchStatus> {
    const response = await axiosInstance.post<WatchStatus>(`/cards/${cardId}/watch`);
    return response.data;
  }

  /**
   * Watch 상태 조회
   */
  async getWatchStatus(cardId: number): Promise<WatchStatus> {
    const response = await axiosInstance.get<WatchStatus>(`/cards/${cardId}/watch`);
    return response.data;
  }

  /**
   * Watch 목록 조회
   */
  async getWatchList(): Promise<WatchedCard[]> {
    const response = await axiosInstance.get<WatchedCard[]>('/watch-list');
    return response.data;
  }

  /**
   * Watch 해제
   */
  async unwatchCard(cardId: number): Promise<void> {
    await axiosInstance.delete(`/cards/${cardId}/watch`);
  }
}

export const watchService = new WatchService();
