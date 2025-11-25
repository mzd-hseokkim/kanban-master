import goalService from '@/services/goalService';
import sprintService from '@/services/sprintService';
import type { Goal, GoalCreateRequest } from '@/types/goal';
import type { Sprint, SprintCreateRequest } from '@/types/sprint';
import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

interface SprintContextType {
  sprints: Sprint[];
  activeSprint: Sprint | null;
  goals: Goal[];
  loading: boolean;
  error: string | null;

  // Sprint Actions
  loadSprints: (boardId: number, silent?: boolean) => Promise<void>;
  createSprint: (boardId: number, data: Omit<SprintCreateRequest, 'boardId'>) => Promise<Sprint>;
  startSprint: (sprintId: number) => Promise<Sprint>;
  completeSprint: (sprintId: number) => Promise<Sprint>;
  assignCardsToSprint: (sprintId: number, cardIds: number[]) => Promise<void>;
  removeCardFromSprint: (sprintId: number, cardId: number) => Promise<void>;

  // Goal Actions
  loadGoals: (boardId: number) => Promise<void>;
  createGoal: (boardId: number, data: Omit<GoalCreateRequest, 'boardId'>) => Promise<Goal>;
  updateGoalProgress: (goalId: number, progress: number) => Promise<Goal>;

  clearError: () => void;
}

const SprintContext = createContext<SprintContextType | undefined>(undefined);

export const SprintProvider = ({ children }: { children: ReactNode }) => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSprints = useCallback(async (boardId: number, silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const data = await sprintService.getSprints(boardId);
      setSprints(data);

      // Set active sprint
      const active = data.find(s => s.status === 'ACTIVE');
      setActiveSprint(active || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load sprints';
      setError(message);
      console.error('Error loading sprints:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const createSprint = useCallback(async (boardId: number, data: Omit<SprintCreateRequest, 'boardId'>) => {
    try {
      setLoading(true);
      setError(null);
      const newSprint = await sprintService.createSprint(boardId, data);
      setSprints(prev => [newSprint, ...prev]);
      return newSprint;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create sprint';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const startSprint = useCallback(async (sprintId: number) => {
    try {
      setLoading(true);
      setError(null);
      const started = await sprintService.startSprint(sprintId);
      setSprints(prev => prev.map(s => s.id === sprintId ? started : s));
      setActiveSprint(started);
      return started;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start sprint';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeSprint = useCallback(async (sprintId: number) => {
    try {
      setLoading(true);
      setError(null);
      const completed = await sprintService.completeSprint(sprintId);
      setSprints(prev => prev.map(s => s.id === sprintId ? completed : s));
      setActiveSprint(null);
      return completed;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete sprint';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignCardsToSprint = useCallback(async (sprintId: number, cardIds: number[]) => {
    try {
      setLoading(true);
      setError(null);
      await sprintService.assignCards(sprintId, cardIds);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign cards';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeCardFromSprint = useCallback(async (sprintId: number, cardId: number) => {
    try {
      setLoading(true);
      setError(null);
      await sprintService.removeCard(sprintId, cardId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove card';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGoals = useCallback(async (boardId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await goalService.getGoals(boardId);
      setGoals(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load goals';
      setError(message);
      console.error('Error loading goals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createGoal = useCallback(async (boardId: number, data: Omit<GoalCreateRequest, 'boardId'>) => {
    try {
      setLoading(true);
      setError(null);
      const newGoal = await goalService.createGoal(boardId, data);
      setGoals(prev => [newGoal, ...prev]);
      return newGoal;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create goal';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateGoalProgress = useCallback(async (goalId: number, progress: number) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await goalService.updateProgress(goalId, progress);
      setGoals(prev => prev.map(g => g.id === goalId ? updated : g));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update goal progress';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: SprintContextType = {
    sprints,
    activeSprint,
    goals,
    loading,
    error,
    loadSprints,
    createSprint,
    startSprint,
    completeSprint,
    assignCardsToSprint,
    removeCardFromSprint,
    loadGoals,
    createGoal,
    updateGoalProgress,
    clearError,
  };

  return (
    <SprintContext.Provider value={value}>
      {children}
    </SprintContext.Provider>
  );
};

export const useSprint = () => {
  const context = useContext(SprintContext);
  if (!context) {
    throw new Error('useSprint must be used within SprintProvider');
  }
  return context;
};
