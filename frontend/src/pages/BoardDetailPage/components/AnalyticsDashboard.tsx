import { getLabelColor } from '@/constants/labelColors';
import { dashboardService } from '@/services/dashboardService';
import { BoardInsightsResponse } from '@/types/dashboard';
import React, { useEffect, useState } from 'react';
import { HiChartPie, HiExclamation } from 'react-icons/hi';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis, YAxis,
    ZAxis
} from 'recharts';
import { BurndownDataPoint, CycleTimeData, getBurndownChart, getCompletedTasksCount, getCycleTime } from '../../../services/analyticsService';

interface AnalyticsDashboardProps {
    workspaceId: number;
    boardId: number;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ workspaceId, boardId }) => {
    const [burndownData, setBurndownData] = useState<BurndownDataPoint[]>([]);
    const [cycleTimeData, setCycleTimeData] = useState<CycleTimeData[]>([]);
    const [completedTasksCount, setCompletedTasksCount] = useState<number>(0);
    const [insights, setInsights] = useState<BoardInsightsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [burndown, cycleTime, completedCount, boardInsights] = await Promise.all([
                    getBurndownChart(boardId),
                    getCycleTime(boardId),
                    getCompletedTasksCount(boardId),
                    dashboardService.getBoardInsights(workspaceId, boardId)
                ]);
                setBurndownData(burndown);
                setCycleTimeData(cycleTime);
                setCompletedTasksCount(completedCount);
                setInsights(boardInsights);
            } catch (error) {
                console.error("Failed to fetch analytics data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [boardId, workspaceId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-gray-500">Loading analytics...</div>
            </div>
        );
    }

    if (!insights) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-gray-500">Failed to load analytics data</div>
            </div>
        );
    }

    const totalCompletion = insights.completion.completed + insights.completion.incomplete;
    const completionRate = totalCompletion > 0 ? Math.round((insights.completion.completed / totalCompletion) * 100) : 0;

    const totalPriority = insights.priority.high + insights.priority.medium + insights.priority.low;
    const highPct = totalPriority > 0 ? (insights.priority.high / totalPriority) * 100 : 0;
    const mediumPct = totalPriority > 0 ? (insights.priority.medium / totalPriority) * 100 : 0;
    const lowPct = totalPriority > 0 ? (insights.priority.low / totalPriority) * 100 : 0;

    return (
        <div className="p-6 space-y-8 bg-gray-50 h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800">Board Analytics</h2>

            {/* Board Statistics Section */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <HiChartPie className="text-blue-600 text-xl" />
                    <h3 className="text-lg font-semibold text-gray-700">Current Statistics</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Completion Rate */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Completion Rate</h4>
                        <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 rounded-full">
                                <div className="absolute inset-0 rounded-full" style={{
                                    background: `conic-gradient(#22c55e ${completionRate}%, #e5e7eb 0)`
                                }}>
                                </div>
                                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold text-gray-900">{completionRate}%</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">{insights.completion.completed} Completed</p>
                                <p className="text-sm text-gray-600">{insights.completion.incomplete} Incomplete</p>
                            </div>
                        </div>
                    </div>

                    {/* Priority Distribution */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Priority</h4>
                        <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex mb-3">
                            <div style={{ width: `${highPct}%` }} className="bg-red-500 h-full" title="High" />
                            <div style={{ width: `${mediumPct}%` }} className="bg-yellow-500 h-full" title="Medium" />
                            <div style={{ width: `${lowPct}%` }} className="bg-green-500 h-full" title="Low" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-gray-600">
                                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"></div> High</span>
                                <span className="font-medium">{insights.priority.high}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-600">
                                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div> Medium</span>
                                <span className="font-medium">{insights.priority.medium}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-600">
                                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Low</span>
                                <span className="font-medium">{insights.priority.low}</span>
                            </div>
                        </div>
                    </div>

                    {/* Column Breakdown */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 col-span-1 md:col-span-2">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">By Column</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
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
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 col-span-1 md:col-span-2">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">By Assignee</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
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
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 col-span-1 md:col-span-2">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">By Label</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
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

                {insights.noDueDate > 0 && (
                    <div className="mt-4 text-xs text-gray-500 flex items-center gap-1 bg-white p-3 rounded-lg border border-gray-200">
                        <HiExclamation className="text-orange-500" />
                        {insights.noDueDate} incomplete cards have no due date.
                    </div>
                )}
            </section>

            {/* Performance Metrics Section */}
            <section>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Avg Cycle Time</h4>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            {cycleTimeData.length > 0
                                ? (cycleTimeData.reduce((acc, curr) => acc + curr.cycleTimeDays, 0) / cycleTimeData.length).toFixed(1)
                                : 0}
                            <span className="text-lg font-normal text-gray-500 ml-1">days</span>
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Completed Tasks</h4>
                        <p className="mt-2 text-3xl font-bold text-gray-900">{completedTasksCount}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Remaining Tasks</h4>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            {burndownData.length > 0 ? burndownData[burndownData.length - 1].remainingTasks : 0}
                        </p>
                    </div>
                </div>
            </section>

            {/* Trends Section */}
            <section>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Trends</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Burndown Chart */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Burndown Chart (Last 30 Days)</h4>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={burndownData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        stroke="#9ca3af"
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="remainingTasks" name="Remaining Tasks" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Cycle Time Scatter Plot */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Cycle Time Distribution</h4>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="completedAt"
                                        type="category"
                                        tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        stroke="#9ca3af"
                                        tick={{ fontSize: 12 }}
                                        allowDuplicatedCategory={false}
                                    />
                                    <YAxis
                                        dataKey="cycleTimeDays"
                                        name="Days"
                                        unit="d"
                                        stroke="#9ca3af"
                                        tick={{ fontSize: 12 }}
                                    />
                                    <ZAxis dataKey="title" name="Card" />
                                    <Tooltip
                                        cursor={{ strokeDasharray: '3 3' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg">
                                                        <p className="font-semibold text-gray-800">{data.title}</p>
                                                        <p className="text-sm text-gray-600">Cycle Time: <span className="font-medium text-blue-600">{data.cycleTimeDays} days</span></p>
                                                        <p className="text-xs text-gray-500 mt-1">Completed: {new Date(data.completedAt).toLocaleDateString()}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Scatter name="Tasks" data={cycleTimeData} fill="#10b981" />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AnalyticsDashboard;
