import React from 'react';
import { HiDotsVertical } from 'react-icons/hi';
import { MdArchive } from 'react-icons/md';

export const ArchiveTip: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col items-center px-6 py-2 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col items-center justify-center mb-6 shrink-0">
        <span className="text-4xl mb-3">📦</span>
        <h3 className="text-xl font-bold text-slate-800 mb-1">아카이브로 정리정돈</h3>
        <p className="text-sm text-slate-500">완료된 카드를 간단하게 보관하세요</p>
      </div>

      <div className="w-full max-w-2xl space-y-5 pb-4">
        {/* Method 1: Drag & Drop */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex-shrink-0">
              1
            </div>
            <h4 className="text-sm font-bold text-slate-800">드래그 앤 드롭</h4>
          </div>
          <div className="ml-8">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-white rounded border-2 border-blue-300 flex items-center justify-center shadow-sm">
                    <span className="text-xs">카드</span>
                  </div>
                  <span className="text-2xl">→</span>
                  <MdArchive className="text-blue-600 text-3xl" />
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  카드를 우측 상단의 <span className="font-semibold">아카이브 버튼</span>으로<br />
                  드래그하면 즉시 보관됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Method 2: Column Menu */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex-shrink-0">
              2
            </div>
            <h4 className="text-sm font-bold text-slate-800">컬럼 전체 아카이빙</h4>
          </div>
          <div className="ml-8">
            <div className="p-4 bg-green-50 rounded-lg border border-green-100 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="px-3 py-2 bg-white rounded border border-slate-200 flex items-center gap-2 shadow-sm">
                    <span className="text-xs font-medium">완료</span>
                    <HiDotsVertical className="text-slate-400 text-sm" />
                  </div>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  컬럼 제목의 <span className="font-semibold">메뉴 버튼</span>을 클릭하고<br />
                  <span className="font-semibold">모든 카드 보관</span>을 선택하면<br />
                  컬럼의 모든 카드를 한 번에 아카이빙할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Method 3: Archive Panel */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex-shrink-0">
              3
            </div>
            <h4 className="text-sm font-bold text-slate-800">아카이브 관리</h4>
          </div>
          <div className="ml-8">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 text-center">
              <div className="flex flex-col items-center gap-3">
                <MdArchive className="text-purple-600 text-2xl" />
                <div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    우측 상단의 <span className="font-semibold">아카이브 버튼</span>을 클릭하면<br />
                    보관된 카드를 확인하고 복원할 수 있습니다.
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    필요시 언제든지 복원 가능합니다!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100 shrink-0 w-full max-w-2xl">
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <span>💡</span> Tip: 완료된 작업을 정리하여 보드를 깔끔하게 유지하세요
        </p>
      </div>
    </div>
  );
};
