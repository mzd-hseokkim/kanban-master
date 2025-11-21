export interface BoardOverdueSummary {
  boardId: number;
  boardName: string;
  overdue: number;
}

export interface RecentActivity {
  created7d: number;
  updated7d: number;
}

export interface DashboardSummaryResponse {
  totalBoards: number;
  totalCards: number;
  completedCards: number;
  incompleteCards: number;
  overdueCards: number;
  dueSoonCards: number;
  unassignedHighPriorityCards: number;
  boardsByOverdue: BoardOverdueSummary[];
  recentActivity: RecentActivity;
}

export interface ColumnInsight {
  columnId: number;
  name: string;
  total: number;
  overdue: number;
  dueSoon: number;
}

export interface CompletionStats {
  completed: number;
  incomplete: number;
}

export interface PriorityStats {
  high: number;
  medium: number;
  low: number;
}

export interface AssigneeInsight {
  assigneeId: number | null;
  name: string | null;
  total: number;
  overdue: number;
}

export interface BoardInsightsResponse {
  byColumn: ColumnInsight[];
  completion: CompletionStats;
  priority: PriorityStats;
  byAssignee: AssigneeInsight[];
  noDueDate: number;
}
