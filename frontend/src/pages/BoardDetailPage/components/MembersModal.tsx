import { BoardMemberTable, BoardMemberTableRef } from '@/components/BoardMemberTable';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import {
  modalOverlayClass,
  modalPanelClass,
} from '@/styles/modalStyles';
import { forwardRef, useImperativeHandle, useRef } from 'react';

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: number;
  boardOwnerId: number;
  canManage: boolean;
  onInvite: () => void;
}

export interface MembersModalRef {
  refreshTable: () => Promise<void>;
}

export const MembersModal = forwardRef<MembersModalRef, MembersModalProps>(({
  isOpen,
  onClose,
  boardId,
  boardOwnerId,
  canManage,
  onInvite,
}, ref) => {
  const { stage, close } = useModalAnimation(() => {
    onClose();
  });
  const tableRef = useRef<BoardMemberTableRef>(null);

  useImperativeHandle(ref, () => ({
    refreshTable: async () => {
      await tableRef.current?.refresh();
    },
  }));

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={modalOverlayClass(stage)}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          close();
        }
      }}
    >
      <div className={`${modalPanelClass({ stage })} w-[67.5vw] max-w-none`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-pastel-blue-500 font-semibold">
              Team
            </p>
            <h2 className="text-2xl font-bold text-pastel-blue-900 mt-1">멤버 관리</h2>
          </div>
          <div className="flex items-center gap-3">
            {canManage && (
              <button
                onClick={onInvite}
                className="px-4 py-2 rounded-xl bg-pastel-blue-500 text-white hover:bg-pastel-blue-600 transition font-medium text-sm shadow-sm hover:shadow-md"
              >
                + 멤버 초대
              </button>
            )}
            <button
              onClick={close}
              className="w-10 h-10 rounded-full text-xl text-pastel-blue-500 hover:bg-white/40 transition flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-[60vh] overflow-hidden rounded-2xl border border-white/40 bg-white/30 backdrop-blur-sm">
           <BoardMemberTable ref={tableRef} boardId={boardId} boardOwnerId={boardOwnerId} canManage={canManage} />
        </div>
      </div>
    </div>
  );
});

MembersModal.displayName = 'MembersModal';
