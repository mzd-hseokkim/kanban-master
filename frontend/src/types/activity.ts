export type ActivityEventType =
  | 'BOARD_CREATED' | 'BOARD_UPDATED' | 'BOARD_DELETED'
  | 'COLUMN_CREATED' | 'COLUMN_UPDATED' | 'COLUMN_DELETED' | 'COLUMN_REORDERED'
  | 'CARD_CREATED' | 'CARD_UPDATED' | 'CARD_DELETED' | 'CARD_MOVED'
  | 'MEMBER_INVITED' | 'MEMBER_ROLE_CHANGED' | 'MEMBER_REMOVED'
  | 'COMMENT_ADDED' | 'COMMENT_DELETED';

export type ActivityScopeType = 'BOARD' | 'CARD';

export interface Activity {
  id: number;
  scopeType: ActivityScopeType;
  scopeId: number;
  eventType: ActivityEventType;
  actorId: number;
  actorName: string;
  actorEmail: string;
  message: string;
  payload?: string;
  createdAt: string;
  relativeTime: string;
}

export interface ActivityListResponse {
  content: Activity[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
