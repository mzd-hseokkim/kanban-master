import { CreateColumnModal } from '@/components/CreateColumnModal';
import { InviteMemberModal } from '@/components/InviteMemberModal';
import { LabelManager } from '@/components/label/LabelManager';
import { SearchPanel } from '@/components/SearchPanel';
import type { Card } from '@/types/card';
import type { CardSearchResult } from '@/types/search';
import { CalendarModal } from './CalendarModal';

interface BoardModalsProps {
  workspaceId: number;
  boardId: number;
  showCreateColumnModal: boolean;
  onCloseCreateColumn: () => void;
  refreshColumns: () => Promise<void> | void;
  showInviteModal: boolean;
  onCloseInviteModal: () => void;
  showLabelManager: boolean;
  onCloseLabelManager: () => void;
  showSearchPanel: boolean;
  onCloseSearchPanel: () => void;
  onCardSelect: (result: CardSearchResult) => void;
  showCalendarModal: boolean;
  onCloseCalendarModal: () => void;
  cards: Card[];
  searchState: any;
  setSearchState: (state: any) => void;
}

export const BoardModals = ({
  workspaceId,
  boardId,
  showCreateColumnModal,
  onCloseCreateColumn,
  refreshColumns,
  showInviteModal,
  onCloseInviteModal,
  showLabelManager,
  onCloseLabelManager,
  showSearchPanel,
  onCloseSearchPanel,
  onCardSelect,
  showCalendarModal,
  onCloseCalendarModal,
  cards,
  searchState,
  setSearchState,
}: BoardModalsProps) => {
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
        cards={cards}
        onCardSelect={(cardId) => {
          // Find card to get columnId for navigation/focus
          const card = cards.find(c => c.id === cardId);
          if (card) {
            onCardSelect({
              id: card.id,
              columnId: undefined,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);
            // Small delay to ensure onCardSelect state updates propagate before unmounting
            setTimeout(() => onCloseCalendarModal(), 50);
          }
        }}
      />
    </>
  );
};
