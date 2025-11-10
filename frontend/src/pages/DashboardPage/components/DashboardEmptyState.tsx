interface DashboardEmptyStateProps {
  onCreateBoard: () => void;
}

export const DashboardEmptyState = ({ onCreateBoard }: DashboardEmptyStateProps) => (
  <div className="flex-1 flex items-center justify-center">
    <div className="glass rounded-2xl p-12 shadow-glass-lg text-center max-w-2xl">
      <h2 className="text-2xl font-bold text-pastel-blue-900 mb-2">보드가 없습니다</h2>
      <p className="text-pastel-blue-600 mb-8">첫 번째 보드를 만들어 시작하세요.</p>
      <button
        onClick={onCreateBoard}
        className="px-8 py-3 rounded-lg bg-pastel-blue-500 text-white font-semibold hover:bg-pastel-blue-600 transition"
        type="button"
      >
        + 새 보드 만들기
      </button>
    </div>
  </div>
);
