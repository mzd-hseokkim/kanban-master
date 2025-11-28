import type { Card } from '@/types/card';
import type { CardSearchState } from '@/types/search';

const toStartOfDay = (value?: string) => {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  const date = new Date(parsed);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const toEndOfDay = (value?: string) => {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  const date = new Date(parsed);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
};

export const hasSearchCriteria = (state?: CardSearchState) => {
  if (!state) return false;
  const keyword = state.keyword?.trim();
  return Boolean(keyword) ||
    state.selectedPriorities.length > 0 ||
    state.selectedLabelIds.length > 0 ||
    state.selectedAssigneeIds.length > 0 ||
    state.isCompleted !== undefined ||
    state.overdue ||
    state.onlyMine ||
    Boolean(state.dueDateFrom) ||
    Boolean(state.dueDateTo);
};

export const hasActiveSearchFilter = (state?: CardSearchState) => {
  return hasSearchCriteria(state);
};

export const filterCardsBySearch = (cards: Card[], state?: CardSearchState, currentUserId?: number) => {
  if (!state || !hasActiveSearchFilter(state)) {
    return cards;
  }

  const keyword = state.keyword.trim().toLowerCase();
  const dueFrom = toStartOfDay(state.dueDateFrom);
  const dueTo = toEndOfDay(state.dueDateTo);
  const now = Date.now();

  return cards.filter((card) => {
    if (keyword) {
      const title = card.title?.toLowerCase() || '';
      const description = card.description?.toLowerCase() || '';
      if (!title.includes(keyword) && !description.includes(keyword)) {
        return false;
      }
    }

    if (state.selectedPriorities.length > 0) {
      const priority = card.priority || '';
      if (!state.selectedPriorities.includes(priority)) {
        return false;
      }
    }

    if (state.selectedLabelIds.length > 0) {
      const labelIds = (card.labels || []).map((label) => label.id);
      const hasAllLabels = state.selectedLabelIds.every((id) => labelIds.includes(id));
      if (!hasAllLabels) {
        return false;
      }
    }

    if (state.onlyMine && currentUserId) {
      if (card.assigneeId !== currentUserId) {
        return false;
      }
    } else if (state.selectedAssigneeIds.length > 0) {
      if (!card.assigneeId || !state.selectedAssigneeIds.includes(card.assigneeId)) {
        return false;
      }
    }

    if (state.isCompleted !== undefined && card.isCompleted !== state.isCompleted) {
      return false;
    }

    if (state.overdue) {
      const dueTime = card.dueDate ? Date.parse(card.dueDate) : NaN;
      const isOverdue = !Number.isNaN(dueTime) && !card.isCompleted && dueTime < now;
      if (!isOverdue) {
        return false;
      }
    }

    if (dueFrom !== null || dueTo !== null) {
      const dueTime = card.dueDate ? Date.parse(card.dueDate) : NaN;
      if (Number.isNaN(dueTime)) {
        return false;
      }
      if (dueFrom !== null && dueTime < dueFrom) {
        return false;
      }
      if (dueTo !== null && dueTime > dueTo) {
        return false;
      }
    }

    return true;
  });
};
