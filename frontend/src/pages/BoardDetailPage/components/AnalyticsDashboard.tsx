import React, { useEffect, useState } from 'react';
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
import { BurndownDataPoint, CycleTimeData, getBurndownChart, getCycleTime } from '../../../services/analyticsService';

interface AnalyticsDashboardProps {
    boardId: number;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ boardId }) => {
    const [burndownData, setBurndownData] = useState<BurndownDataPoint[]>([]);
    const [cycleTimeData, setCycleTimeData] = useState<CycleTimeData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [burndown, cycleTime] = await Promise.all([
                    getBurndownChart(boardId),
                    getCycleTime(boardId)
                ]);
                setBurndownData(burndown);
                setCycleTimeData(cycleTime);
            } catch (error) {
                console.error("Failed to fetch analytics data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [boardId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-gray-500">Loading analytics...</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 bg-gray-50 h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800">Board Analytics</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Burndown Chart */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Burndown Chart (Last 30 Days)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={burndownData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    stroke="#9ca3af"
                                    tick={{fontSize: 12}}
                                />
                                <YAxis stroke="#9ca3af" tick={{fontSize: 12}} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="remainingTasks" name="Remaining Tasks" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                                {/* <Line type="monotone" dataKey="idealTasks" name="Ideal Burn" stroke="#9ca3af" strokeDasharray="5 5" dot={false} /> */}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Cycle Time Scatter Plot */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Cycle Time Distribution</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="completedAt"
                                    type="category"
                                    tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    stroke="#9ca3af"
                                    tick={{fontSize: 12}}
                                    allowDuplicatedCategory={false}
                                />
                                <YAxis
                                    dataKey="cycleTimeDays"
                                    name="Days"
                                    unit="d"
                                    stroke="#9ca3af"
                                    tick={{fontSize: 12}}
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

            {/* Summary Stats */}
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
                    <p className="mt-2 text-3xl font-bold text-gray-900">{cycleTimeData.length}</p>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Remaining Tasks</h4>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {burndownData.length > 0 ? burndownData[burndownData.length - 1].remainingTasks : 0}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
