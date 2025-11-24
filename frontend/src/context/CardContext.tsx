import cardService from '@/services/cardService';
import { Card, CardPageResponse, CardSortKey, CreateCardRequest, SortDirection, UpdateCardRequest } from '@/types/card';
import React, { createContext, useCallback, useContext, useState } from 'react';

interface CardContextType {
  cards: { [columnId: number]: Card[] };
  loading: boolean;
  error: string | null;
  loadCards: (
    workspaceId: number,
    boardId: number,
    columnId: number,
    options?: {
      page?: number;
      size?: number;
      sortKey?: CardSortKey;
      direction?: SortDirection;
      append?: boolean;
      silent?: boolean;
    }
  ) => Promise<CardPageResponse | undefined>;
  createCard: (workspaceId: number, boardId: number, columnId: number, request: CreateCardRequest) => Promise<Card>;
  updateCard: (workspaceId: number, boardId: number, columnId: number, cardId: number, request: UpdateCardRequest) => Promise<Card>;
  deleteCard: (workspaceId: number, boardId: number, columnId: number, cardId: number) => Promise<void>;
  updateCardPosition: (workspaceId: number, boardId: number, columnId: number, cardId: number, newPosition: number) => Promise<Card>;
  handleCardEvent: (event: any) => void;
}

const CardContext = createContext<CardContextType | undefined>(undefined);

export const CardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cards, setCards] = useState<{ [columnId: number]: Card[] }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCards = useCallback(async (
    workspaceId: number,
    boardId: number,
    columnId: number,
    options: {
      page?: number;
      size?: number;
      sortKey?: CardSortKey;
      direction?: SortDirection;
      append?: boolean;
      silent?: boolean;
    } = {}
  ) => {
    const { page = 0, size = 500, sortKey = 'createdAt', direction = 'asc', append = false, silent = false } = options;
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await cardService.listCards(workspaceId, boardId, columnId, {
        page,
        size,
        sortBy: sortKey,
        direction,
      });
      // 아카이브된 카드는 제외
      const filteredData = data.content.filter(card => !card.isArchived);
      setCards(prev => ({
        ...prev,
        [columnId]: append ? [...(prev[columnId] || []), ...filteredData] : filteredData
      }));
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : '카드를 불러올 수 없습니다';
      setError(message);
      console.error('Failed to load cards:', err);
      return undefined;
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // ... create/update/delete methods ...

  const handleCardEvent = useCallback((event: any) => {
    const { type, payload } = event;

    switch (type) {
      case 'CARD_CREATED': {
        const newCard = payload;
        setCards(prev => ({
          ...prev,
          [newCard.columnId]: [...(prev[newCard.columnId] || []), newCard]
        }));
        break;
      }
      case 'CARD_UPDATED': {
        const updatedCard = payload;
        // 카드가 아카이브되면 목록에서 제거
        if (updatedCard.isArchived) {
          setCards(prev => ({
            ...prev,
            [updatedCard.columnId]: (prev[updatedCard.columnId] || []).filter(c => c.id !== updatedCard.id)
          }));
        } else {
          setCards(prev => ({
            ...prev,
            [updatedCard.columnId]: (prev[updatedCard.columnId] || []).map(c => c.id === updatedCard.id ? updatedCard : c)
          }));
        }
        break;
      }
      case 'CARD_DELETED': {
        // Payload is Map { cardId, columnId }
        const { cardId, columnId } = payload;
        setCards(prev => ({
          ...prev,
          [columnId]: (prev[columnId] || []).filter(c => c.id !== Number(cardId))
        }));
        break;
      }
      case 'CARD_MOVED': {
        const movedCard = payload;
        // Find source column by looking for the card
        setCards(prev => {
            const nextState = { ...prev };


            // Remove from source
            Object.keys(nextState).forEach(colId => {
                const cId = Number(colId);
                if (nextState[cId]?.some(c => c.id === movedCard.id)) {
                    nextState[cId] = nextState[cId].filter(c => c.id !== movedCard.id);
                }
            });

            // Add to target
            const targetColId = movedCard.columnId;
            const targetList = [...(nextState[targetColId] || [])];

            // Insert at position (simple sort)
            targetList.push(movedCard);
            targetList.sort((a, b) => a.position - b.position);

            nextState[targetColId] = targetList;
            return nextState;
        });
        break;
      }
    }
  }, []);



  const createCard = useCallback(
    async (workspaceId: number, boardId: number, columnId: number, request: CreateCardRequest): Promise<Card> => {
      try {
        setError(null);
        const newCard = await cardService.createCard(workspaceId, boardId, columnId, request);
        setCards(prev => ({
          ...prev,
          [columnId]: [...(prev[columnId] || []), newCard]
        }));
        return newCard;
      } catch (err) {
        const message = err instanceof Error ? err.message : '카드 생성에 실패했습니다';
        setError(message);
        console.error('Failed to create card:', err);
        throw err;
      }
    },
    []
  );

  const updateCard = useCallback(
    async (workspaceId: number, boardId: number, columnId: number, cardId: number, request: UpdateCardRequest): Promise<Card> => {
      try {
        setError(null);
        const updated = await cardService.updateCard(workspaceId, boardId, columnId, cardId, request);
        setCards(prev => ({
          ...prev,
          [columnId]: (prev[columnId] || []).map(card => (card.id === cardId ? updated : card))
        }));
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : '카드 수정에 실패했습니다';
        setError(message);
        console.error('Failed to update card:', err);
        throw err;
      }
    },
    []
  );

  const deleteCard = useCallback(
    async (workspaceId: number, boardId: number, columnId: number, cardId: number) => {
      try {
        setError(null);
        await cardService.deleteCard(workspaceId, boardId, columnId, cardId);
        setCards(prev => ({
          ...prev,
          [columnId]: (prev[columnId] || []).filter(card => card.id !== cardId)
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : '카드 삭제에 실패했습니다';
        setError(message);
        console.error('Failed to delete card:', err);
        throw err;
      }
    },
    []
  );

  const updateCardPosition = useCallback(
    async (workspaceId: number, boardId: number, columnId: number, cardId: number, newPosition: number): Promise<Card> => {
      try {
        setError(null);
        const updated = await cardService.updateCardPosition(workspaceId, boardId, columnId, cardId, newPosition);
        setCards(prev => ({
          ...prev,
          [columnId]: (prev[columnId] || []).map(card => (card.id === cardId ? updated : card))
        }));
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : '카드 위치 변경에 실패했습니다';
        setError(message);
        console.error('Failed to update card position:', err);
        throw err;
      }
    },
    []
  );

  return (
    <CardContext.Provider
      value={{
        cards,
        loading,
        error,
        loadCards,
        createCard,
        updateCard,
        deleteCard,
        updateCardPosition,
        handleCardEvent,
      }}
    >
      {children}
    </CardContext.Provider>
  );
};

export const useCard = () => {
  const context = useContext(CardContext);
  if (!context) {
    throw new Error('useCard must be used within CardProvider');
  }
  return context;
};
