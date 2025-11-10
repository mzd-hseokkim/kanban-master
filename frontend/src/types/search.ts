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
  assignees?: string[];
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
  labels?: Label[];
  createdAt: string;
  updatedAt: string;
}
