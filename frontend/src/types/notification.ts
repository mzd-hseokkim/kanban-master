export interface InboxItem {
  id: string;
  type: 'INVITATION' | 'NOTIFICATION';
  title: string;
  message: string;
  actionUrl?: string;
  createdAt: string;
  isRead: boolean;
  payload?: {
    invitationToken?: string;
    boardName?: string;
    invitedByName?: string;
    type?: string;
    [key: string]: any;
  };
}
