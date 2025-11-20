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
};
