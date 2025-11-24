import { getLabelColor } from '@/constants/labelColors';
import { dashboardService } from '@/services/dashboardService';
import { BoardInsightsResponse } from '@/types/dashboard';
import React, { useEffect, useState } from 'react';
import { HiChartPie, HiExclamation } from 'react-icons/hi';

interface BoardInsightsPanelProps {
  workspaceId: number;
  boardId: number;
  isVisible: boolean;
}

export const BoardInsightsPanel: React.FC<BoardInsightsPanelProps> = ({ workspaceId, boardId, isVisible }) => {
  const [insights, setInsights] = useState<BoardInsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isVisible) return; // Only fetch when panel is visible

    const fetchInsights = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getBoardInsights(workspaceId, boardId);
        setInsights(data);
      } catch (error) {
        console.error('Failed to fetch board insights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [workspaceId, boardId, isVisible]); // Fetch when panel becomes visible

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading insights...</div>;
  }

  if (!insights) {
    return null;
  }

  const totalCompletion = insights.completion.completed + insights.completion.incomplete;
  const completionRate = totalCompletion > 0 ? Math.round((insights.completion.completed / totalCompletion) * 100) : 0;

  const totalPriority = insights.priority.high + insights.priority.medium + insights.priority.low;
  const highPct = totalPriority > 0 ? (insights.priority.high / totalPriority) * 100 : 0;
  const mediumPct = totalPriority > 0 ? (insights.priority.medium / totalPriority) * 100 : 0;
  const lowPct = totalPriority > 0 ? (insights.priority.low / totalPriority) * 100 : 0;

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <HiChartPie className="text-blue-600 text-xl" />
          <h2 className="text-lg font-bold text-gray-900">Board Insights</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Completion Rate */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Completion Rate</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full border-4 border-gray-200 flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full border-4 border-green-500"
                  style={{
                    clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`, // Simple approximation, for real donut use SVG
                    transform: `rotate(${completionRate * 3.6}deg)` // This is tricky with CSS only for donut
                  }}
                />
                 {/* Better CSS Donut approach */}
                 <div className="absolute inset-0 rounded-full" style={{
                    background: `conic-gradient(#22c55e ${completionRate}%, #e5e7eb 0)`
                 }}></div>
                 <div className="absolute inset-2 bg-gray-50 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">{completionRate}%</span>
                 </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">{insights.completion.completed} Completed</p>
                <p className="text-sm text-gray-600">{insights.completion.incomplete} Incomplete</p>
              </div>
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Priority</h3>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex mb-2">
              <div style={{ width: `${highPct}%` }} className="bg-red-500 h-full" title="High" />
              <div style={{ width: `${mediumPct}%` }} className="bg-yellow-500 h-full" title="Medium" />
              <div style={{ width: `${lowPct}%` }} className="bg-green-500 h-full" title="Low" />
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"></div> High: {insights.priority.high}</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div> Med: {insights.priority.medium}</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Low: {insights.priority.low}</span>
            </div>
          </div>

          {/* Column Breakdown */}
          <div className="bg-gray-50 p-4 rounded-lg col-span-1 md:col-span-2">
            <h3 className="text-sm font-medium text-gray-500 mb-2">By Column</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
              {insights.byColumn.map(col => (
                <div key={col.columnId} className="flex items-center gap-2 text-sm">
                  <span className="w-24 truncate font-medium text-gray-700" title={col.name}>{col.name}</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${(col.total / Math.max(1, Math.max(...insights.byColumn.map(c => c.total)))) * 100}%` }}
                      className="bg-blue-500 h-full rounded-full"
                    />
                  </div>
                  <span className="text-gray-600 w-8 text-right">{col.total}</span>
                  {col.overdue > 0 && (
                    <span className="text-red-600 text-xs bg-red-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <HiExclamation /> {col.overdue}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Assignee Breakdown */}
          <div className="bg-gray-50 p-4 rounded-lg col-span-1 md:col-span-2">
            <h3 className="text-sm font-medium text-gray-500 mb-2">By Assignee</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
              {insights.byAssignee.map(assignee => (
                <div key={assignee.assigneeId || 'unassigned'} className="flex items-center gap-2 text-sm">
                  <span className="w-24 truncate font-medium text-gray-700" title={assignee.name || 'Unassigned'}>
                    {assignee.name || 'Unassigned'}
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${assignee.total > 0 ? (assignee.completed / assignee.total) * 100 : 0}%` }}
                      className="bg-green-500 h-full"
                      title={`${assignee.completed} Completed`}
                    />
                  </div>
                  <span className="text-gray-600 w-16 text-right text-xs">
                    {assignee.completed}/{assignee.total}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Label Breakdown */}
          <div className="bg-gray-50 p-4 rounded-lg col-span-1 md:col-span-2">
            <h3 className="text-sm font-medium text-gray-500 mb-2">By Label</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
              {insights.byLabel.map(label => (
                <div key={label.labelId} className="flex items-center gap-2 text-sm">
                  <span className="w-24 truncate font-medium text-gray-700" title={label.name}>{label.name}</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${(label.count / Math.max(1, Math.max(...insights.byLabel.map(l => l.count)))) * 100}%`,
                        backgroundColor: getLabelColor(label.colorToken)
                      }}
                      className="h-full rounded-full"
                    />
                  </div>
                  <span className="text-gray-600 w-8 text-right">{label.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Assignee Table (Optional, maybe too crowded, let's keep it simple for now or add if space permits) */}
        {insights.noDueDate > 0 && (
            <div className="mt-4 text-xs text-gray-500 flex items-center gap-1">
                <HiExclamation className="text-orange-500" />
                {insights.noDueDate} incomplete cards have no due date.
            </div>
        )}
      </div>
    </div>
  );
};
