/**
 * 검색 관련 타입 정의
 */

import type { Label } from './label';

/**
 * 카드 검색 요청
 */
export interface CardSearchRequest {
  keyword?: string;
  priorities?: string[];
  assigneeIds?: number[];
  labelIds?: number[];
  isCompleted?: boolean;
  dueDateFrom?: string;
  dueDateTo?: string;
  overdue?: boolean;
}

/**
 * 카드 검색 결과
 */
export interface CardSearchResult {
  id: number;
  workspaceId: number;
  columnId: number;
  columnName: string;
  boardId: number;
  boardName: string;
  title: string;
  description?: string;
  position: number;
  bgColor?: string;
  priority?: string;
  assignee?: string;
  dueDate?: string;
  isCompleted: boolean;
  startedAt?: string;
  completedAt?: string;
  labels?: Label[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 보드 검색 결과
 */
export interface BoardSearchResult {
  id: number;
  workspaceId: number;
  ownerId: number;
  ownerName: string;
  name: string;
  description: string;
  themeColor: string;
  icon: string;
  status: 'ACTIVE' | 'DELETED';
  createdAt: string;
  updatedAt: string;
}

/**
 * 칼럼 검색 결과
 */
export interface ColumnSearchResult {
  id: number;
  boardId: number;
  name: string;
  description: string;
  position: number;
  bgColor: string;
  createdAt: string;
  updatedAt: string;
}
