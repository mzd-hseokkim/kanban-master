import type { CardSearchResult } from '@/types/search';
import { useCallback, useEffect, useState } from 'react';

interface UIState {
  viewMode: 'BOARD' | 'LIST' | 'ANALYTICS' | 'PLANNING';
  showCreateColumnModal: boolean;
  showInviteModal: boolean;
  showMembersPanel: boolean;
  showActivityPanel: boolean;
  showLabelManager: boolean;
  showSearchPanel: boolean;
  showCalendarModal: boolean;
  showArchivePanel: boolean;
  showImportModal: boolean;
  showGlobalCreateCardModal: boolean;
  showEnableSprintModal: boolean;
  showCreateSprintModal: boolean;
  archiveError: string | null;
  searchState: {
    keyword: string;
    selectedPriorities: string[];
    selectedLabelIds: number[];
    selectedAssigneeIds: number[];
    isCompleted: boolean | undefined;
    overdue: boolean;
    dueDateFrom: string;
    dueDateTo: string;
    sortBy: 'PRIORITY' | 'DUE_DATE' | 'CREATED_AT' | 'UPDATED_AT';
    sortDir: 'ASC' | 'DESC';
  };
}

interface UIActions {
  setViewMode: (mode: 'BOARD' | 'LIST' | 'ANALYTICS' | 'PLANNING') => void;
  setShowCreateColumnModal: (show: boolean) => void;
  setShowInviteModal: (show: boolean) => void;
  setShowMembersPanel: (show: boolean) => void;
  setShowActivityPanel: (show: boolean) => void;
  setShowLabelManager: (show: boolean) => void;
  setShowSearchPanel: (show: boolean) => void;
  setShowCalendarModal: (show: boolean) => void;
  setShowArchivePanel: (show: boolean) => void;
  setShowImportModal: (show: boolean) => void;
  setShowGlobalCreateCardModal: (show: boolean) => void;
  setShowEnableSprintModal: (show: boolean) => void;
  setShowCreateSprintModal: (show: boolean) => void;
  setArchiveError: (error: string | null) => void;
  setSearchState: (state: any) => void;
  handleCardSelect: (result: CardSearchResult) => void;
}

export const useBoardUI = (
  setInlineCardFocus: (focus: { cardId: number; columnId?: number | null }) => void
) => {
  const [viewMode, setViewMode] = useState<'BOARD' | 'LIST' | 'ANALYTICS' | 'PLANNING'>(() => {
    const savedMode = localStorage.getItem('boardViewMode');
    return (savedMode === 'BOARD' || savedMode === 'LIST') ? savedMode : 'BOARD';
  });

  const [showCreateColumnModal, setShowCreateColumnModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(false);
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showArchivePanel, setShowArchivePanel] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showGlobalCreateCardModal, setShowGlobalCreateCardModal] = useState(false);
  const [showEnableSprintModal, setShowEnableSprintModal] = useState(false);
  const [showCreateSprintModal, setShowCreateSprintModal] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const [searchState, setSearchState] = useState({
    keyword: '',
    selectedPriorities: [] as string[],
    selectedLabelIds: [] as number[],
    selectedAssigneeIds: [] as number[],
    isCompleted: undefined as boolean | undefined,
    overdue: false,
    dueDateFrom: '',
    dueDateTo: '',
    sortBy: 'UPDATED_AT' as 'PRIORITY' | 'DUE_DATE' | 'CREATED_AT' | 'UPDATED_AT',
    sortDir: 'DESC' as 'ASC' | 'DESC',
  });

  useEffect(() => {
    if (viewMode === 'BOARD' || viewMode === 'LIST') {
      localStorage.setItem('boardViewMode', viewMode);
    }
  }, [viewMode]);

  const handleCardSelect = useCallback(
    (result: CardSearchResult) => {
      setInlineCardFocus({ cardId: result.id, columnId: result.columnId });
    },
    [setInlineCardFocus],
  );

  const uiState: UIState = {
    viewMode,
    showCreateColumnModal,
    showInviteModal,
    showMembersPanel,
    showActivityPanel,
    showLabelManager,
    showSearchPanel,
    showCalendarModal,
    showArchivePanel,
    showImportModal,
    showGlobalCreateCardModal,
    showEnableSprintModal,
    showCreateSprintModal,
    archiveError,
    searchState,
  };

  const uiActions: UIActions = {
    setViewMode,
    setShowCreateColumnModal,
    setShowInviteModal,
    setShowMembersPanel,
    setShowActivityPanel,
    setShowLabelManager,
    setShowSearchPanel,
    setShowCalendarModal,
    setShowArchivePanel,
    setShowImportModal,
    setShowGlobalCreateCardModal,
    setShowEnableSprintModal,
    setShowCreateSprintModal,
    setArchiveError,
    setSearchState,
    handleCardSelect,
  };

  return { uiState, uiActions };
};
