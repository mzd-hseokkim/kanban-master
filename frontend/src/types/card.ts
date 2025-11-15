/**
 * 카드 타입 정의
 */

import type { Label } from './label';

export interface Card {
  id: number;
  columnId: number;
  title: string;
  description?: string;
  position: number;
  bgColor?: string;
  priority?: string;
  assignee?: string;
  assigneeAvatarUrl?: string;
  dueDate?: string;
  isCompleted: boolean;
  labels?: Label[];
  commentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardRequest {
  title: string;
  description?: string;
  bgColor?: string;
  priority?: string;
  assignee?: string;
  dueDate?: string;
}

export interface UpdateCardRequest {
  title?: string;
  description?: string;
  bgColor?: string;
  priority?: string;
  assignee?: string;
  position?: number;
  dueDate?: string;
  isCompleted?: boolean;
  columnId?: number;
}
