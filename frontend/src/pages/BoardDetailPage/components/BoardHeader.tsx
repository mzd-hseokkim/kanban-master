import { HiArrowLeft, HiLightningBolt, HiSearch, HiTag, HiUsers } from 'react-icons/hi';

interface BoardHeaderProps {
  boardName: string;
  overdueCardCount: number;
  onBack: () => void;
  onSearch: () => void;
  onLabelManager: () => void;
  onToggleActivity: () => void;
  onToggleMembers: () => void;
}

export const BoardHeader = ({
  boardName,
  overdueCardCount,
  onBack,
  onSearch,
  onLabelManager,
  onToggleActivity,
  onToggleMembers,
}: BoardHeaderProps) => {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/50 flex-shrink-0 transition-colors duration-300">
      <div className="w-full max-w-[95vw] mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
            title="돌아가기"
          >
            <HiArrowLeft className="text-xl" />
          </button>

          <div className="h-6 w-px bg-slate-200" />

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{boardName}</h1>
            {overdueCardCount > 0 && (
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold shadow-sm">
                지연 {overdueCardCount}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <HeaderButton
            icon={<HiSearch />}
            label="검색"
            onClick={onSearch}
          />
          <HeaderButton
            icon={<HiTag />}
            label="라벨"
            onClick={onLabelManager}
          />
          <HeaderButton
            icon={<HiLightningBolt />}
            label="활동"
            onClick={onToggleActivity}
          />
          <HeaderButton
            icon={<HiUsers />}
            label="멤버"
            onClick={onToggleMembers}
          />
        </div>
      </div>
    </header>
  );
};

interface HeaderButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const HeaderButton = ({ icon, label, onClick }: HeaderButtonProps) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 font-medium text-sm group"
  >
    <span className="text-lg text-slate-400 group-hover:text-slate-900 transition-colors">{icon}</span>
    <span>{label}</span>
  </button>
);
