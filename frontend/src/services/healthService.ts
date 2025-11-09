import axiosInstance from '@/utils/axios';
import type { HealthResponse } from '@/types/health';

class HealthService {
  private readonly endpoint = '/health';

  /**
   * Check backend health status
   */
  async check(): Promise<HealthResponse> {
    const response = await axiosInstance.get<HealthResponse>(this.endpoint);
    return response.data;
  }
}

export const healthService = new HealthService();
