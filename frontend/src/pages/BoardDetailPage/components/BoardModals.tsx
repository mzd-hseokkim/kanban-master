import { ArchivedCardsPanel } from '@/components/archive/ArchivedCardsPanel';
import { CreateCardModal } from '@/components/CreateCardModal';
import { CreateColumnModal } from '@/components/CreateColumnModal';
import { InviteMemberModal } from '@/components/InviteMemberModal';
import { LabelManager } from '@/components/label/LabelManager';
import { SearchPanel } from '@/components/SearchPanel';
import { CreateSprintModal } from '@/components/sprint/CreateSprintModal';
import { EnableSprintModal } from '@/components/sprint/EnableSprintModal';
import { usePresenceTransition } from '@/hooks/usePresenceTransition';
import type { Column } from '@/types/column';
import type { ImportJobStartResponse } from '@/types/excel';
import type { CardSearchResult, CardSearchState } from '@/types/search';
import type { Dispatch, SetStateAction } from 'react';
import { ActivityPanel } from './ActivityPanel';
import { CalendarModal } from './CalendarModal';
import { ExcelImportModal } from './ExcelImportModal';
import { ImportProgressPanel } from './ImportProgressPanel';
import { MembersModal } from './MembersModal';

interface BoardModalsProps {
  workspaceId: number;
  boardId: number;
  boardName: string;
  canManage: boolean;
  columns: Column[];

  // UI State
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

  // UI Actions
  onCloseCreateColumn: () => void;
  onCloseInviteModal: () => void;
  onCloseMembersPanel: () => void;
  onCloseActivityPanel: () => void;
  onCloseLabelManager: () => void;
  onCloseSearchPanel: () => void;
  onCloseCalendarModal: () => void;
  onCloseArchivePanel: () => void;
  onCloseImportModal: () => void;
  onCloseGlobalCreateCard: () => void;
  onCloseEnableSprintModal: () => void;
  onCloseCreateSprintModal: () => void;
  onOpenInviteModal: () => void;

  // Callbacks
  refreshColumns: () => Promise<void> | void;
  onCardSelect: (result: CardSearchResult) => void;
  loadCards: (workspaceId: number, boardId: number, columnId: number, options?: any) => Promise<any>;

  // Search State
  searchState: CardSearchState;
  setSearchState: Dispatch<SetStateAction<CardSearchState>>;

  // Excel Import State
  activeImportJobId: string | null;
  importFileName: string;
  importStatus: any;
  onImportStarted: (job: ImportJobStartResponse, fileName: string) => void;
  onRefreshImportStatus: () => void;
  onCloseImportProgress: () => void;

  // Sprint Handlers
  onEnableSprint: () => Promise<void>;
  onCreateSprint: (data: any) => Promise<void>;
}

export const BoardModals = ({
  workspaceId,
  boardId,
  boardName,
  canManage,
  columns,
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
  onCloseCreateColumn,
  onCloseInviteModal,
  onCloseMembersPanel,
  onCloseActivityPanel,
  onCloseLabelManager,
  onCloseSearchPanel,
  onCloseCalendarModal,
  onCloseArchivePanel,
  onCloseImportModal,
  onCloseGlobalCreateCard,
  onCloseEnableSprintModal,
  onCloseCreateSprintModal,
  onOpenInviteModal,
  refreshColumns,
  onCardSelect,
  loadCards,
  searchState,
  setSearchState,
  activeImportJobId,
  importFileName,
  importStatus,
  onImportStarted,
  onRefreshImportStatus,
  onCloseImportProgress,
  onEnableSprint,
  onCreateSprint,
}: BoardModalsProps) => {
  const activityPanelTransition = usePresenceTransition(showActivityPanel);

  return (
    <>
      {showCreateColumnModal && (
        <CreateColumnModal
          workspaceId={workspaceId}
          boardId={boardId}
          onClose={onCloseCreateColumn}
          onSuccess={() => refreshColumns()}
        />
      )}

      {showInviteModal && (
        <InviteMemberModal
          boardId={boardId}
          isOpen={showInviteModal}
          onClose={onCloseInviteModal}
          onSuccess={onCloseInviteModal}
        />
      )}

      {showLabelManager && <LabelManager boardId={boardId} onClose={onCloseLabelManager} />}

      {showSearchPanel && (
        <SearchPanel
          boardId={boardId}
          onClose={onCloseSearchPanel}
          onCardSelect={onCardSelect}
          searchState={searchState}
          setSearchState={setSearchState}
        />
      )}

      <CalendarModal
        isOpen={showCalendarModal}
        onClose={onCloseCalendarModal}
        boardId={boardId}
        onCardSelect={(cardId) => {
            onCardSelect({
              id: cardId,
              columnId: undefined,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);
            setTimeout(() => onCloseCalendarModal(), 50);
        }}
      />

      {showMembersPanel && (
        <MembersModal
          isOpen={showMembersPanel}
          boardId={boardId}
          canManage={canManage}
          onInvite={onOpenInviteModal}
          onClose={onCloseMembersPanel}
        />
      )}

      <ActivityPanel
        transition={{
          shouldRender: activityPanelTransition.shouldRender,
          stage: activityPanelTransition.stage,
        }}
        boardId={boardId}
        onClose={onCloseActivityPanel}
      />

      <ExcelImportModal
        isOpen={showImportModal}
        workspaceId={workspaceId}
        boardId={boardId}
        onClose={onCloseImportModal}
        onStarted={onImportStarted}
      />

      {importStatus && activeImportJobId && (
        <ImportProgressPanel
          status={importStatus}
          fileName={importFileName}
          onRefresh={onRefreshImportStatus}
          onClose={onCloseImportProgress}
        />
      )}

      {showArchivePanel && (
        <ArchivedCardsPanel
          workspaceId={workspaceId}
          boardId={boardId}
          onClose={onCloseArchivePanel}
          onRestore={() => refreshColumns()}
        />
      )}

      {showGlobalCreateCardModal && columns.length > 0 && (
        <CreateCardModal
          workspaceId={workspaceId}
          boardId={boardId}
          columnId={columns[0].id}
          onClose={onCloseGlobalCreateCard}
          onSuccess={() => {
            loadCards(workspaceId, boardId, columns[0].id);
          }}
        />
      )}

      <EnableSprintModal
        isOpen={showEnableSprintModal}
        boardId={boardId}
        boardName={boardName}
        onClose={onCloseEnableSprintModal}
        onConfirm={async () => {
          try {
            await onEnableSprint();
            onCloseEnableSprintModal();
            onCloseCreateSprintModal();
          } catch (error) {
            // Error already handled in onEnableSprint
          }
        }}
      />

      <CreateSprintModal
        isOpen={showCreateSprintModal}
        boardId={boardId}
        onClose={onCloseCreateSprintModal}
        onSubmit={onCreateSprint}
      />
    </>
  );
};
