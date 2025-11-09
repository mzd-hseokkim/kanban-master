/**
 * 칼럼(보드 내 상태 관리)
 */
export interface Column {
  id: number;
  boardId: number;
  name: string;
  description?: string;
  position: number;
  bgColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateColumnRequest {
  name: string;
  description?: string;
  bgColor?: string;
}

export interface UpdateColumnRequest {
  name?: string;
  description?: string;
  bgColor?: string;
  position?: number;
}
