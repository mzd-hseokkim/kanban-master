import axiosInstance from '@/utils/axios';

export interface AuditLog {
  id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  targetType: 'BOARD' | 'COLUMN' | 'CARD' | 'MEMBER';
  targetId: string;
  actorId: number;
  ipAddress?: string;
  userAgent?: string;
  changes?: string; // JSON string
  createdAt: string;
}

export interface AuditLogParams {
  page?: number;
  size?: number;
  sort?: string;
  targetType?: string;
  targetId?: string;
  actorId?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export const getAuditLogs = async (params: AuditLogParams): Promise<PageResponse<AuditLog>> => {
  const response = await axiosInstance.get('/audit-logs', { params });
  return response.data;
};
