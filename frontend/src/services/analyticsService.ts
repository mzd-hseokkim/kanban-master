import axiosInstance from '@/utils/axios';
const API_URL = '/analytics';

export interface BurndownDataPoint {
    date: string;
    remainingTasks: number;
    idealTasks?: number;
}

export interface CycleTimeData {
    cardId: number;
    title: string;
    cycleTimeDays: number;
    completedAt: string;
}

export const getBurndownChart = async (boardId: number, days: number = 30): Promise<BurndownDataPoint[]> => {
    const response = await axiosInstance.get(`${API_URL}/boards/${boardId}/burndown`, {
        params: { days }
    });
    return response.data;
};

export const getCycleTime = async (boardId: number): Promise<CycleTimeData[]> => {
    const response = await axiosInstance.get(`${API_URL}/boards/${boardId}/cycletime`);
    return response.data;
};
