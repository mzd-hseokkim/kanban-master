import axiosInstance from '@/utils/axios';
import type { UserSearchResult } from '@/types/user';

export interface AvatarUploadResponse {
  avatarUrl: string;
  uploadedAt: string;
}

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

  /**
   * 프로필 사진 업로드
   */
  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post<AvatarUploadResponse>(
      '/users/profile/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.avatarUrl;
  },

  /**
   * 프로필 사진 삭제
   */
  async deleteAvatar(): Promise<void> {
    await axiosInstance.delete('/users/profile/avatar');
  },
};
