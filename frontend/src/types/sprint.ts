export enum SprintStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export interface Sprint {
  id: number;
  name: string;
  startDate?: string;
  endDate?: string;
  status: SprintStatus;
  goalText?: string;
  capacity?: number;
  boardId: number;
  cardCount?: number;
  totalPoints?: number;
  completedPoints?: number;
}

export interface SprintCreateRequest {
  name: string;
  startDate?: string;
  endDate?: string;
  goalText?: string;
  capacity?: number;
  boardId: number;
}

export interface SprintSnapshot {
  id: number;
  sprintId: number;
  snapshotDate: string;
  totalPoints: number;
  completedPoints: number;
  remainingPoints: number;
  statusCounts: Record<string, number>;
}
