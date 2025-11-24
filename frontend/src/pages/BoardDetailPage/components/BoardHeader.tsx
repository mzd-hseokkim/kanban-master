import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { HiArrowLeft, HiCalendar, HiChartBar, HiChevronDown, HiDownload, HiLightningBolt, HiPlus, HiSearch, HiTag, HiUpload, HiUsers, HiViewBoards, HiViewList } from 'react-icons/hi';
import { MdArchive } from 'react-icons/md';

interface BoardHeaderProps {
  boardName: string;
  overdueCardCount: number;
  canEdit: boolean;
  viewMode: 'BOARD' | 'LIST' | 'ANALYTICS';
  onViewModeChange: (mode: 'BOARD' | 'LIST' | 'ANALYTICS') => void;
  onBack: () => void;
  onSearch: () => void;
  onLabelManager: () => void;
  onToggleActivity: () => void;
  onToggleMembers: () => void;
  onCalendar: () => void;
  onToggleArchive: () => void;
  onCreateColumn: () => void;
  onArchiveDrop: (cardId: number, columnId: number) => void;
  onTemplateDownload: () => void;
  onExportBoard: () => void;
  onImport: () => void;
  isExporting?: boolean;
  isDownloadingTemplate?: boolean;
}

export const BoardHeader = ({
  boardName,
  overdueCardCount,
  canEdit,
  viewMode,
  onViewModeChange,
  onBack,
  onSearch,
  onLabelManager,
  onToggleActivity,
  onToggleMembers,
  onCalendar,
  onToggleArchive,
  onCreateColumn,
  onArchiveDrop,
  onTemplateDownload,
  onExportBoard,
  onImport,
  isExporting,
}: BoardHeaderProps) => {
  const [isArchiveDropTarget, setIsArchiveDropTarget] = useState(false);
  const [isExcelMenuOpen, setIsExcelMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleArchiveDragOver = (e: DragEvent<HTMLButtonElement>) => {
    if (!canEdit) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsArchiveDropTarget(true);
  };

  const handleArchiveDragLeave = () => {
    if (!canEdit) return;
    setIsArchiveDropTarget(false);
  };

  const handleArchiveDrop = (e: DragEvent<HTMLButtonElement>) => {
    if (!canEdit) return;
    e.preventDefault();
    e.stopPropagation();
    setIsArchiveDropTarget(false);

    const cardId = Number(e.dataTransfer.getData('cardId'));
    const sourceColumnId = Number(e.dataTransfer.getData('sourceColumnId'));
    if (Number.isNaN(cardId) || Number.isNaN(sourceColumnId)) {
      return;
    }

    onArchiveDrop(cardId, sourceColumnId);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsExcelMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/50 flex-shrink-0 transition-colors duration-300 relative z-[120]">
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

          <div className="h-6 w-px bg-slate-200 mx-2" />

          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => onViewModeChange('BOARD')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'BOARD'
                  ? 'bg-white text-pastel-blue-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="보드 뷰"
            >
              <HiViewBoards className="text-lg" />
            </button>
            <button
              onClick={() => onViewModeChange('LIST')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'LIST'
                  ? 'bg-white text-pastel-blue-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="리스트 뷰"
            >
              <HiViewList className="text-lg" />
            </button>
            <button
              onClick={() => onViewModeChange('ANALYTICS')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'ANALYTICS'
                  ? 'bg-white text-pastel-blue-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="분석 뷰"
            >
              <HiChartBar className="text-lg" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={onCreateColumn}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold text-sm shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-500 transition-all duration-200"
            >
              <HiPlus className="text-base" />
              <span className="hidden md:inline">칼럼 추가</span>
            </button>
          )}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsExcelMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 font-medium text-sm"
            >
              <HiDownload className="text-lg" />
              <span className="hidden md:inline">엑셀</span>
              <HiChevronDown className="text-sm" />
            </button>
            {isExcelMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden excel-dropdown"
              >
                <button
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    onTemplateDownload();
                    setIsExcelMenuOpen(false);
                  }}
                >
                  <HiDownload className="text-slate-500" />
                  템플릿 다운로드
                </button>
                <button
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    onExportBoard();
                    setIsExcelMenuOpen(false);
                  }}
                  disabled={isExporting}
                >
                  <HiArrowLeft className="text-slate-500 rotate-180" />
                  {isExporting ? '내보내는 중...' : '엑셀로 내보내기'}
                </button>
                <button
                  className={`w-full flex items-center gap-2 px-4 py-3 text-sm transition-colors ${
                    canEdit
                      ? 'text-slate-700 hover:bg-slate-50'
                      : 'text-slate-400 cursor-not-allowed bg-slate-50'
                  }`}
                  onClick={() => {
                    if (!canEdit) return;
                    onImport();
                    setIsExcelMenuOpen(false);
                  }}
                >
                  <HiUpload className="text-slate-500" />
                  엑셀 가져오기
                </button>
              </div>
            )}
          </div>
          <HeaderButton
            icon={<HiCalendar />}
            label="일정"
            onClick={onCalendar}
          />
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
          <HeaderButton
            icon={<MdArchive />}
            label="아카이브"
            onClick={onToggleArchive}
            onDragOver={handleArchiveDragOver}
            onDragLeave={handleArchiveDragLeave}
            onDrop={handleArchiveDrop}
            isDropActive={isArchiveDropTarget}
          />
        </div>
      </div>
    </header>
  );
};

interface HeaderButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  onDrop?: (e: DragEvent<HTMLButtonElement>) => void;
  onDragOver?: (e: DragEvent<HTMLButtonElement>) => void;
  onDragLeave?: (e: DragEvent<HTMLButtonElement>) => void;
  isDropActive?: boolean;
}

const HeaderButton = ({ icon, label, onClick, onDrop, onDragOver, onDragLeave, isDropActive }: HeaderButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    onDrop={onDrop}
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 font-medium text-sm group focus:outline-none ${
      isDropActive ? 'ring-2 ring-pastel-blue-300 bg-pastel-blue-50 text-pastel-blue-700' : ''
    }`}
  >
    <span className="text-lg text-slate-400 group-hover:text-slate-900 transition-colors">{icon}</span>
    <span className="hidden xl:inline">{label}</span>
  </button>
);
