import type { Card } from '@/types/card';
import type { Column } from '@/types/column';
import { useMemo } from 'react';

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
