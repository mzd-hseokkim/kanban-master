import { BoardMemberTable } from '@/components/BoardMemberTable';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import {
    modalOverlayClass,
    modalPanelClass,
} from '@/styles/modalStyles';

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: number;
  canManage: boolean;
  onInvite: () => void;
}

export const MembersModal = ({
  isOpen,
  onClose,
  boardId,
  canManage,
  onInvite,
}: MembersModalProps) => {
  const { stage, close } = useModalAnimation(() => {
    onClose();
  });

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
           <BoardMemberTable boardId={boardId} canManage={canManage} />
        </div>
      </div>
    </div>
  );
};
