interface DashboardLoadingBannerProps {
  isVisible: boolean;
}

export const DashboardLoadingBanner = ({ isVisible }: DashboardLoadingBannerProps) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 flex items-center gap-2 text-sm text-pastel-blue-800 bg-white/80 px-3 py-1.5 rounded-full shadow-glass-sm border border-pastel-blue-100 z-10">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-pastel-blue-500 border-t-transparent" />
      <span>대시보드 데이터 동기화 중…</span>
    </div>
  );
};
