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
    <header className="glass-light shadow-glass flex-shrink-0">
      <div className="w-full max-w-[95vw] mx-auto py-3 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-pastel-blue-600 hover:text-pastel-blue-700 font-semibold mb-2 block"
          >
            ← 돌아가기
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-pastel-blue-900">{boardName}</h1>
            {overdueCardCount > 0 && (
              <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-pastel-pink-500 text-white text-sm font-bold whitespace-nowrap">
                지연:{overdueCardCount}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSearch}
            className="px-3 py-2 rounded-lg text-pastel-blue-600 hover:bg-white/20 transition font-medium text-sm"
            title="카드 검색"
          >
            🔍 검색
          </button>
          <button
            onClick={onLabelManager}
            className="px-3 py-2 rounded-lg text-pastel-blue-600 hover:bg-white/20 transition font-medium text-sm"
            title="라벨 관리"
          >
            🏷️ 라벨
          </button>
          <button
            onClick={onToggleActivity}
            className="px-3 py-2 rounded-lg text-pastel-blue-600 hover:bg-white/20 transition font-medium text-sm"
            title="활동 로그"
          >
            📋 활동
          </button>
          <button
            onClick={onToggleMembers}
            className="px-3 py-2 rounded-lg text-pastel-blue-600 hover:bg-white/20 transition font-medium text-sm"
            title="멤버 관리"
          >
            👥 멤버
          </button>
        </div>
      </div>
    </header>
  );
};
