import columnService from '@/services/columnService';
import { Column, CreateColumnRequest, UpdateColumnRequest } from '@/types/column';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface ColumnContextType {
  columns: Column[];
  loading: boolean;
  error: string | null;
  loadColumns: (workspaceId: number, boardId: number) => Promise<void>;
  createColumn: (workspaceId: number, boardId: number, request: CreateColumnRequest) => Promise<Column>;
  updateColumn: (workspaceId: number, boardId: number, columnId: number, request: UpdateColumnRequest) => Promise<Column>;
  deleteColumn: (workspaceId: number, boardId: number, columnId: number) => Promise<void>;
  updateColumnPosition: (workspaceId: number, boardId: number, columnId: number, newPosition: number) => Promise<Column>;
  setColumnsOptimistic: (columns: Column[]) => void;
  handleColumnEvent: (event: any) => void;
}

const ColumnContext = createContext<ColumnContextType | undefined>(undefined);

export const ColumnProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadColumns = useCallback(async (workspaceId: number, boardId: number, silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await columnService.listColumns(workspaceId, boardId);
      setColumns(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : '칼럼을 불러올 수 없습니다';
      setError(message);
      console.error('Failed to load columns:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // ... create/update/delete methods ...

  const handleColumnEvent = useCallback((event: any) => {
    const { type, payload } = event;
    switch (type) {
      case 'COLUMN_CREATED':
        // 동일 ID 중복 추가 방지 (웹소켓/로컬 생성 이벤트 동시 도착 대비)
        setColumns(prev => {
          const exists = prev.some(col => col.id === payload.id);
          return exists
            ? prev.map(col => (col.id === payload.id ? payload : col))
            : [...prev, payload];
        });
        break;
      case 'COLUMN_UPDATED':
        setColumns(prev => prev.map(col => col.id === payload.id ? payload : col));
        break;
      case 'COLUMN_DELETED':
        // payload is Map with columnId, or just check payload structure
        // Backend sends Map for delete: {columnId: ...}
        // But wait, I didn't change delete payload to DTO. It's still Map.
        // I need to handle both DTO and Map.
        const columnId = payload.columnId || payload.id;
        setColumns(prev => prev.filter(col => col.id !== Number(columnId)));
        break;
      case 'COLUMN_REORDERED':
        // For reorder, it's safer to reload to get all correct positions
        // But we can update the specific one optimistically
        setColumns(prev => {
            const updated = prev.map(col => col.id === payload.id ? payload : col);
            return updated.sort((a, b) => a.position - b.position);
        });
        break;
    }
  }, []);


  const createColumn = useCallback(
    async (workspaceId: number, boardId: number, request: CreateColumnRequest): Promise<Column> => {
      try {
        setError(null);
        const newColumn = await columnService.createColumn(workspaceId, boardId, request);
        // 웹소켓 이벤트와 중복으로 들어오는 경우를 대비해 upsert 처리
        setColumns(prev => {
          const exists = prev.some(col => col.id === newColumn.id);
          return exists
            ? prev.map(col => (col.id === newColumn.id ? newColumn : col))
            : [...prev, newColumn];
        });
        return newColumn;
      } catch (err) {
        const message = err instanceof Error ? err.message : '칼럼 생성에 실패했습니다';
        setError(message);
        console.error('Failed to create column:', err);
        throw err;
      }
    },
    []
  );

  const updateColumn = useCallback(
    async (workspaceId: number, boardId: number, columnId: number, request: UpdateColumnRequest): Promise<Column> => {
      try {
        setError(null);
        const updated = await columnService.updateColumn(workspaceId, boardId, columnId, request);
        setColumns(prev =>
          prev.map(col => (col.id === columnId ? updated : col))
        );
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : '칼럼 수정에 실패했습니다';
        setError(message);
        console.error('Failed to update column:', err);
        throw err;
      }
    },
    []
  );

  const deleteColumn = useCallback(
    async (workspaceId: number, boardId: number, columnId: number) => {
      try {
        setError(null);
        await columnService.deleteColumn(workspaceId, boardId, columnId);
        setColumns(prev => prev.filter(col => col.id !== columnId));
      } catch (err) {
        const message = err instanceof Error ? err.message : '칼럼 삭제에 실패했습니다';
        setError(message);
        console.error('Failed to delete column:', err);
        throw err;
      }
    },
    []
  );

  const updateColumnPosition = useCallback(
    async (workspaceId: number, boardId: number, columnId: number, newPosition: number): Promise<Column> => {
      try {
        setError(null);
        const updated = await columnService.updateColumnPosition(workspaceId, boardId, columnId, newPosition);
        // 낙관적 업데이트는 ColumnsSection에서 처리하므로 여기서는 API 호출만
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : '칼럼 위치 변경에 실패했습니다';
        setError(message);
        console.error('Failed to update column position:', err);
        throw err;
      }
    },
    []
  );

  const setColumnsOptimistic = useCallback((newColumns: Column[]) => {
    setColumns(newColumns);
  }, []);

  const value = useMemo(
    () => ({
      columns,
      loading,
      error,
      loadColumns,
      createColumn,
      updateColumn,
      deleteColumn,
      updateColumnPosition,
      setColumnsOptimistic,
      handleColumnEvent,
    }),
    [
      columns,
      loading,
      error,
      loadColumns,
      createColumn,
      updateColumn,
      deleteColumn,
      updateColumnPosition,
      setColumnsOptimistic,
      handleColumnEvent,
    ],
  );

  return <ColumnContext.Provider value={value}>{children}</ColumnContext.Provider>;
};

export const useColumn = () => {
  const context = useContext(ColumnContext);
  if (!context) {
    throw new Error('useColumn must be used within ColumnProvider');
  }
  return context;
};
