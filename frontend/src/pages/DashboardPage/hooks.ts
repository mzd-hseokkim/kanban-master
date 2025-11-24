import cardService from '@/services/cardService';
import columnService from '@/services/columnService';
import type { UserProfile } from '@/types/auth';
import type { Board } from '@/types/board';
import type { Card } from '@/types/card';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type DashboardCard = Card & {
  boardId: number;
  boardName: string;
  columnId: number;
  workspaceId: number;
};

const IN_PROGRESS_COLUMN_IDS = new Set<number>([2, 3]);

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const toDashboardCard = (
  card: Card,
  meta: { boardId: number; boardName: string; columnId: number; workspaceId: number }
): DashboardCard => ({
  ...card,
  ...meta,
});

export const useDefaultWorkspace = (user: UserProfile | null) => {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.workspaces?.length) {
      return;
    }

    setSelectedWorkspaceId((prev) => prev ?? user.workspaces[0].workspaceId);
  }, [user]);

  return { selectedWorkspaceId, setSelectedWorkspaceId };
};

const fetchCardsByColumn = async (workspaceId: number, boards: Board[]) => {
  const columnEntries = await Promise.all(
    boards.map(async (board) => {
      const columns = await columnService.listColumns(workspaceId, board.id);
      const columnCards = await Promise.all(
        columns.map(async (column) => {
          const response = await cardService.listCards(workspaceId, board.id, column.id);
          const cards = response.content;
          return [
            column.id,
            {
              cards,
              boardId: board.id,
              boardName: board.name,
              workspaceId: board.workspaceId,
            },
          ] as const;
        })
      );
      return columnCards;
    })
  );

  return Object.fromEntries(columnEntries.flat());
};

export const useDashboardCards = (boards: Board[], workspaceId: number | null) => {
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsByColumn, setCardsByColumn] = useState<Record<number, { cards: Card[]; boardId: number; boardName: string; workspaceId: number }>>({});

  useEffect(() => {
    let isCancelled = false;

    const loadAllCards = async () => {
      if (!workspaceId || boards.length === 0) {
        setCardsByColumn({});
        setCardsLoading(false);
        return;
      }

      setCardsLoading(true);
      try {
        const data = await fetchCardsByColumn(workspaceId, boards);
        if (!isCancelled) {
          setCardsByColumn(data);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to load dashboard cards:', error);
          setCardsByColumn({});
        }
      } finally {
        if (!isCancelled) {
          setCardsLoading(false);
        }
      }
    };

    void loadAllCards();

    return () => {
      isCancelled = true;
    };
  }, [boards, workspaceId]);

  const activeCards = useMemo(() => {
    const flattened: DashboardCard[] = [];
    Object.entries(cardsByColumn).forEach(([columnId, columnData]) => {
      columnData.cards.forEach((card) => {
        if (card.isCompleted) {
          return;
        }

        flattened.push(
          toDashboardCard(card, {
            boardId: columnData.boardId,
            boardName: columnData.boardName,
            columnId: Number(columnId),
            workspaceId: columnData.workspaceId,
          })
        );
      });
    });
    return flattened;
  }, [cardsByColumn]);

  const categorizeCards = useCallback((cards: DashboardCard[]) => {
    const today = startOfDay(new Date());

    const upcoming: DashboardCard[] = [];
    const overdue: DashboardCard[] = [];
    const inProgress: DashboardCard[] = [];

    cards.forEach((card) => {
      if (IN_PROGRESS_COLUMN_IDS.has(card.columnId)) {
        inProgress.push(card);
      }

      if (!card.dueDate) {
        return;
      }

      const dueDate = startOfDay(new Date(card.dueDate));
      const diffInDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffInDays < 0) {
        overdue.push(card);
      } else if (diffInDays <= 1) {
        upcoming.push(card);
      }
    });

    const compareByDueDate = (a: DashboardCard, b: DashboardCard) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    };

    upcoming.sort(compareByDueDate);
    overdue.sort(compareByDueDate);

    return {
      upcomingCards: upcoming,
      overdueCards: overdue,
      inProgressCards: inProgress,
    };
  }, []);

  const { upcomingCards, overdueCards, inProgressCards } = useMemo(
    () => categorizeCards(activeCards),
    [activeCards, categorizeCards]
  );

  return {
    cardsLoading,
    upcomingCards,
    overdueCards,
    inProgressCards,
  };
};
