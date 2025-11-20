/**
 * Watch 관련 타입 정의
 */

import type { Card } from './card';

/**
 * Watch 상태 응답
 */
export interface WatchStatus {
  cardId: number;
  userId: number;
  isWatching: boolean;
  watchedAt: string | null;
}

/**
 * Watch 중인 카드 정보
 */
export interface WatchedCard {
  watchId: number;
  card: Card;
  workspaceId: number;
  boardId: number;
  boardName: string;
  columnId: number;
  columnName: string;
  watchedAt: string;
}
