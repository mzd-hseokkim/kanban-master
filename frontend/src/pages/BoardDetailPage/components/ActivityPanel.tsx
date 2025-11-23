import { ActivityTimeline } from "@/components/ActivityTimeline";
import type { PresenceStage } from "@/hooks/usePresenceTransition";

interface PanelTransition {
  shouldRender: boolean;
  stage: PresenceStage;
}

interface ActivityPanelProps {
  transition: PanelTransition;
  boardId: number;
  onClose: () => void;
}

export const ActivityPanel = ({
  transition,
  boardId,
  onClose,
}: ActivityPanelProps) => {
  if (!transition.shouldRender) {
    return null;
  }

  return (
    <div className="absolute top-0 right-0 h-full z-40 pointer-events-none translate-x-2 lg:translate-x-4">
      <aside
        className={`panel-slide panel-slide-${transition.stage} h-full w-96 glass shadow-glass-lg rounded-2xl border border-white/30 overflow-hidden pointer-events-auto`}
      >
        <div className="h-full flex flex-col">
          <div className="px-4 py-3 border-b border-white/20 flex items-center justify-between">
            <span className="font-semibold text-pastel-blue-800">
              활동 로그
            </span>
            <button
              onClick={onClose}
              className="text-pastel-blue-500 hover:text-pastel-blue-700 text-sm font-medium"
            >
              닫기
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ActivityTimeline boardId={boardId} maxHeight="h-full" />
          </div>
        </div>
      </aside>
    </div>
  );
};
