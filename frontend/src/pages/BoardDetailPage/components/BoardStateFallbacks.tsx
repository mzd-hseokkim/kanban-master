interface BoardErrorStateProps {
  onBack: () => void;
}

export const BoardLoadingState = () => (
  <div className="min-h-screen bg-gradient-pastel flex items-center justify-center">
    <div className="glass rounded-2xl px-8 py-6 shadow-glass text-pastel-blue-700">
      <div className="flex items-center gap-3">
        <div className="animate-spin h-5 w-5 border-2 border-pastel-blue-500 border-t-transparent rounded-full" />
        <span className="font-medium">보드를 불러오는 중…</span>
      </div>
    </div>
  </div>
);

export const BoardErrorState = ({ onBack }: BoardErrorStateProps) => (
  <div className="min-h-screen bg-gradient-pastel flex flex-col">
    <header className="glass-light shadow-glass flex-shrink-0">
      <div className="w-full max-w-[95vw] mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <button onClick={onBack} className="text-pastel-blue-600 hover:text-pastel-blue-700 font-semibold">
          ← 돌아가기
        </button>
      </div>
    </header>

    <main className="flex-1 flex items-center justify-center p-6">
      <div className="glass rounded-2xl p-12 shadow-glass-lg max-w-md w-full text-center">
        <p className="text-lg text-pastel-pink-600 font-semibold mb-4">보드를 찾을 수 없습니다</p>
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg bg-pastel-blue-500 text-white font-semibold hover:bg-pastel-blue-600 transition"
        >
          보드 목록으로 돌아가기
        </button>
      </div>
    </main>
  </div>
);
