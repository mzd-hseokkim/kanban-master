export enum GoalStatus {
  ON_TRACK = 'ON_TRACK',
  AT_RISK = 'AT_RISK',
  OFF_TRACK = 'OFF_TRACK',
  COMPLETED = 'COMPLETED',
}

export enum GoalMetricType {
  MANUAL = 'MANUAL',
  CARD_COUNT = 'CARD_COUNT',
  STORY_POINTS = 'STORY_POINTS',
}

export interface Goal {
  id: number;
  boardId: number;
  title: string;
  description?: string;
  status: GoalStatus;
  progress: number;
  metricType: GoalMetricType;
}

export interface GoalCreateRequest {
  boardId: number;
  title: string;
  description?: string;
  metricType: GoalMetricType;
}
