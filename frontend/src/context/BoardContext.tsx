import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Board } from '@/types/board';
import { boardService } from '@/services/boardService';

interface BoardContextType {
  boards: Board[];
  recentBoards: Board[];
  loading: boolean;
  error: string | null;
  selectedWorkspaceId: number | null;
  
  // Actions
  loadBoards: (workspaceId: number) => Promise<void>;
  loadRecentBoards: (workspaceId: number, limit?: number) => Promise<void>;
  createBoard: (workspaceId: number, data: any) => Promise<Board>;
  updateBoard: (workspaceId: number, boardId: number, data: any) => Promise<Board>;
  deleteBoard: (workspaceId: number, boardId: number) => Promise<void>;
  archiveBoard: (workspaceId: number, boardId: number) => Promise<Board>;
  unarchiveBoard: (workspaceId: number, boardId: number) => Promise<Board>;
  restoreBoard: (workspaceId: number, boardId: number) => Promise<Board>;
  clearError: () => void;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export const BoardProvider = ({ children }: { children: ReactNode }) => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [recentBoards, setRecentBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);

  const loadBoards = useCallback(async (workspaceId: number) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedWorkspaceId(workspaceId);
      const data = await boardService.listBoards(workspaceId);
      setBoards(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load boards';
      setError(message);
      console.error('Error loading boards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecentBoards = useCallback(async (workspaceId: number, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      const data = await boardService.getRecentBoards(workspaceId, limit);
      setRecentBoards(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load recent boards';
      setError(message);
      console.error('Error loading recent boards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBoard = useCallback(async (workspaceId: number, data: any) => {
    try {
      setLoading(true);
      setError(null);
      const newBoard = await boardService.createBoard(workspaceId, data);
      setBoards(prev => [newBoard, ...prev]);
      setRecentBoards(prev => [newBoard, ...prev].slice(0, 10));
      return newBoard;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create board';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBoard = useCallback(async (workspaceId: number, boardId: number, data: any) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await boardService.updateBoard(workspaceId, boardId, data);
      setBoards(prev => prev.map(b => b.id === boardId ? updated : b));
      setRecentBoards(prev => prev.map(b => b.id === boardId ? updated : b));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update board';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBoard = useCallback(async (workspaceId: number, boardId: number) => {
    try {
      setLoading(true);
      setError(null);
      await boardService.deleteBoard(workspaceId, boardId);
      setBoards(prev => prev.filter(b => b.id !== boardId));
      setRecentBoards(prev => prev.filter(b => b.id !== boardId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete board';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const archiveBoard = useCallback(async (workspaceId: number, boardId: number) => {
    try {
      setLoading(true);
      setError(null);
      const archived = await boardService.archiveBoard(workspaceId, boardId);
      setBoards(prev => prev.map(b => b.id === boardId ? archived : b));
      setRecentBoards(prev => prev.map(b => b.id === boardId ? archived : b));
      return archived;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to archive board';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const unarchiveBoard = useCallback(async (workspaceId: number, boardId: number) => {
    try {
      setLoading(true);
      setError(null);
      const unarchived = await boardService.unarchiveBoard(workspaceId, boardId);
      setBoards(prev => prev.map(b => b.id === boardId ? unarchived : b));
      setRecentBoards(prev => prev.map(b => b.id === boardId ? unarchived : b));
      return unarchived;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unarchive board';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const restoreBoard = useCallback(async (workspaceId: number, boardId: number) => {
    try {
      setLoading(true);
      setError(null);
      const restored = await boardService.restoreBoard(workspaceId, boardId);
      setBoards(prev => [restored, ...prev]);
      setRecentBoards(prev => [restored, ...prev].slice(0, 10));
      return restored;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to restore board';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: BoardContextType = {
    boards,
    recentBoards,
    loading,
    error,
    selectedWorkspaceId,
    loadBoards,
    loadRecentBoards,
    createBoard,
    updateBoard,
    deleteBoard,
    archiveBoard,
    unarchiveBoard,
    restoreBoard,
    clearError,
  };

  return (
    <BoardContext.Provider value={value}>
      {children}
    </BoardContext.Provider>
  );
};

export const useBoard = () => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoard must be used within BoardProvider');
  }
  return context;
};
