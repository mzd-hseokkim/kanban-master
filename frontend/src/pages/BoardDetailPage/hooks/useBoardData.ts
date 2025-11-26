import { boardService } from '@/services/boardService';
import type { Board } from '@/types/board';
import { useCallback, useEffect, useState } from 'react';

export const useBoardData = (
  workspaceId: string | undefined,
  boardId: string | undefined,
  loadColumns: (workspaceId: number, boardId: number) => Promise<void>
) => {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBoard = useCallback(async () => {
    if (!workspaceId || !boardId) {
      setError('Invalid board or workspace');
      setBoard(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const workspaceNumericId = Number(workspaceId);
      const boardNumericId = Number(boardId);
      const data = await boardService.getBoard(workspaceNumericId, boardNumericId);
      setBoard(data);

      await loadColumns(workspaceNumericId, boardNumericId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load board';
      setError(errorMessage);
      console.error('Failed to load board:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, boardId, loadColumns]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const updateBoardLocally = useCallback((updatedBoard: Board) => {
    setBoard(updatedBoard);
  }, []);

  return { board, loading, error, reloadBoard: loadBoard, updateBoardLocally };
};
