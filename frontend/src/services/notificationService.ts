import type { InboxItem } from '@/types/notification';
import axiosInstance from '@/utils/axios';

export const notificationService = {
  getInbox: async (): Promise<InboxItem[]> => {
    const response = await axiosInstance.get<InboxItem[]>('/notifications/inbox');
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    // ID format: "notif-123" -> extract 123
    if (id.startsWith('notif-')) {
      const realId = id.split('-')[1];
      await axiosInstance.post(`/notifications/${realId}/read`);
    }
  },

  /**
   * 내 알림 설정 조회
   */
  getMyPreference: async (): Promise<NotificationPreference> => {
    const response = await axiosInstance.get<NotificationPreference>(
      '/notifications/preferences'
    );
    return response.data;
  },

  /**
   * 내 알림 설정 수정
   */
  updateMyPreference: async (preference: NotificationPreference): Promise<NotificationPreference> => {
    const response = await axiosInstance.put<NotificationPreference>(
      '/notifications/preferences',
      preference
    );
    return response.data;
  },
};

export interface NotificationPreference {
  notifyDueDate: boolean;
  dueDateBeforeMinutes: number;
}
