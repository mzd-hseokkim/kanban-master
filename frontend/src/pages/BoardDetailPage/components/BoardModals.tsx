import { CreateColumnModal } from '@/components/CreateColumnModal';
import { InviteMemberModal } from '@/components/InviteMemberModal';
import { LabelManager } from '@/components/label/LabelManager';
import { SearchPanel } from '@/components/SearchPanel';
import type { CardSearchResult } from '@/types/search';

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
}: BoardModalsProps) => {
  return (
    <>
      {showCreateColumnModal && (
        <CreateColumnModal
          workspaceId={workspaceId}
          boardId={boardId}
          onClose={onCloseCreateColumn}
          onSuccess={() => void refreshColumns()}
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
        />
      )}
    </>
  );
};
