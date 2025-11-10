import { BoardMemberTable } from '@/components/BoardMemberTable';
import type { PresenceStage } from '@/hooks/usePresenceTransition';

interface PanelTransition {
  shouldRender: boolean;
  stage: PresenceStage;
}

interface MembersPanelProps {
  transition: PanelTransition;
  boardId: number;
  onInvite: () => void;
  onClose: () => void;
}

export const MembersPanel = ({ transition, boardId, onInvite, onClose }: MembersPanelProps) => {
  if (!transition.shouldRender) {
    return null;
  }

  return (
    <div className="absolute top-0 right-0 h-full z-20 pointer-events-none">
      <aside
        className={`panel-slide panel-slide-${transition.stage} h-full w-80 glass shadow-glass-lg rounded-2xl border border-white/30 overflow-hidden pointer-events-auto`}
      >
        <div className="h-full flex flex-col">
          <div className="px-4 py-3 border-b border-white/20 flex items-center justify-between">
            <span className="font-semibold text-pastel-blue-800">멤버</span>
            <div className="flex items-center gap-2">
              <button
                onClick={onInvite}
                className="px-3 py-1.5 rounded-lg bg-pastel-blue-500 text-white hover:bg-pastel-blue-600 transition font-medium text-sm"
              >
                + 초대
              </button>
              <button onClick={onClose} className="text-pastel-blue-500 hover:text-pastel-blue-700 text-sm font-medium">
                닫기
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <BoardMemberTable boardId={boardId} />
          </div>
        </div>
      </aside>
    </div>
  );
};
