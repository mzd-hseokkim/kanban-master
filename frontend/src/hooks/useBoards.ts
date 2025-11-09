import { useState, useCallback } from 'react';
import { boardService } from '@/services/boardService';
import type { Board, CreateBoardRequest, UpdateBoardRequest } from '@/types/board';

export const useBoards = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBoards = useCallback(async (workspaceId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await boardService.listBoards(workspaceId);
      setBoards(data);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch boards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBoard = useCallback(async (workspaceId: number, data: CreateBoardRequest): Promise<Board | null> => {
    try {
      setError(null);
      const newBoard = await boardService.createBoard(workspaceId, data);
      setBoards((prev) => [newBoard, ...prev]);
      return newBoard;
    } catch (err) {
      setError(err as Error);
      console.error('Failed to create board:', err);
      return null;
    }
  }, []);

  const updateBoard = useCallback(async (workspaceId: number, boardId: number, data: UpdateBoardRequest): Promise<Board | null> => {
    try {
      setError(null);
      const updated = await boardService.updateBoard(workspaceId, boardId, data);
      setBoards((prev) => prev.map((b) => (b.id === boardId ? updated : b)));
      return updated;
    } catch (err) {
      setError(err as Error);
      console.error('Failed to update board:', err);
      return null;
    }
  }, []);

  const deleteBoard = useCallback(async (workspaceId: number, boardId: number): Promise<boolean> => {
    try {
      setError(null);
      await boardService.deleteBoard(workspaceId, boardId);
      setBoards((prev) => prev.filter((board) => board.id !== boardId));
      return true;
    } catch (err) {
      setError(err as Error);
      console.error('Failed to delete board:', err);
      return false;
    }
  }, []);

  const refresh = useCallback((workspaceId: number) => {
    fetchBoards(workspaceId);
  }, [fetchBoards]);

  return {
    boards,
    loading,
    error,
    fetchBoards,
    createBoard,
    updateBoard,
    deleteBoard,
    refresh,
  };
};
