import React, { createContext, useContext, useState, useCallback } from 'react';
import { Card, CreateCardRequest, UpdateCardRequest } from '@/types/card';
import cardService from '@/services/cardService';

interface CardContextType {
  cards: { [columnId: number]: Card[] };
  loading: boolean;
  error: string | null;
  loadCards: (workspaceId: number, boardId: number, columnId: number) => Promise<void>;
  createCard: (workspaceId: number, boardId: number, columnId: number, request: CreateCardRequest) => Promise<Card>;
  updateCard: (workspaceId: number, boardId: number, columnId: number, cardId: number, request: UpdateCardRequest) => Promise<Card>;
  deleteCard: (workspaceId: number, boardId: number, columnId: number, cardId: number) => Promise<void>;
  updateCardPosition: (workspaceId: number, boardId: number, columnId: number, cardId: number, newPosition: number) => Promise<Card>;
}

const CardContext = createContext<CardContextType | undefined>(undefined);

export const CardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cards, setCards] = useState<{ [columnId: number]: Card[] }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCards = useCallback(async (workspaceId: number, boardId: number, columnId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await cardService.listCards(workspaceId, boardId, columnId);
      setCards(prev => ({
        ...prev,
        [columnId]: data
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : '카드를 불러올 수 없습니다';
      setError(message);
      console.error('Failed to load cards:', err);
    } finally {
      setLoading(false);
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
