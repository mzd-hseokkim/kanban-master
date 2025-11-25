import { boardService } from '@/services/boardService';
import type { Board } from '@/types/board';
import type { Card } from '@/types/card';
import type { Column } from '@/types/column';
import { useCallback, useEffect, useMemo, useState } from 'react';

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

export const useOverdueCardCount = (columns: Column[] | null | undefined, cards: Record<number, Card[]>) => {
  return useMemo(() => {
    if (!columns || columns.length === 0) {
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return columns.reduce((count, column) => {
      const columnCards = cards[column.id] || [];
      const overdue = columnCards.filter((card) => {
        if (card.isCompleted || !card.dueDate) {
          return false;
        }

        const dueDate = new Date(card.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      });

      return count + overdue.length;
    }, 0);
  }, [columns, cards]);
};

interface InlineCardFocus {
  cardId: number;
  columnId?: number | null;
}

const parseNumericParam = (params: URLSearchParams, key: string) => {
  const value = params.get(key);
  if (value === null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export const useAutoOpenTargets = (searchParams: URLSearchParams) => {
  const [inlineCardFocus, setInlineCardFocus] = useState<InlineCardFocus | null>(null);
  const cardIdFromQuery = useMemo(() => parseNumericParam(searchParams, 'cardId'), [searchParams]);
  const columnIdFromQuery = useMemo(() => parseNumericParam(searchParams, 'columnId'), [searchParams]);

  const effectiveAutoOpenCardId = inlineCardFocus?.cardId ?? cardIdFromQuery;
  const effectiveAutoOpenColumnId = inlineCardFocus?.columnId ?? columnIdFromQuery;

  const handleInlineAutoOpenHandled = useCallback(() => {
    setInlineCardFocus((prev) => (prev ? null : prev));
  }, []);

  return {
    effectiveAutoOpenCardId,
    effectiveAutoOpenColumnId,
    setInlineCardFocus,
    handleInlineAutoOpenHandled,
  };
};
