import axiosInstance from '@/utils/axios';
import type { UserSearchResult } from '@/types/user';

export const userService = {
  /**
   * 사용자 검색 (이름 또는 이메일)
   */
  async searchUsers(keyword: string): Promise<UserSearchResult[]> {
    if (!keyword || keyword.trim().length === 0) {
      return [];
    }

    const response = await axiosInstance.get('/users/search', {
      params: { keyword: keyword.trim() },
    });
    return response.data;
  },
};
