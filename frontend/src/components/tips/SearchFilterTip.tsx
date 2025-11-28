import React from 'react';
import { HiFilter, HiSearch } from 'react-icons/hi';

export const SearchFilterTip: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col items-center px-6 py-2 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col items-center justify-center mb-6 shrink-0">
        <span className="text-4xl mb-3">🔍</span>
        <h3 className="text-xl font-bold text-slate-800 mb-1">스마트 검색 필터</h3>
        <p className="text-sm text-slate-500">다양한 조건으로 카드를 빠르게 찾아보세요</p>
      </div>

      <div className="w-full max-w-2xl space-y-5 pb-4">
        {/* Step 1: 검색 열기 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex-shrink-0">
              1
            </div>
            <h4 className="text-sm font-bold text-slate-800">검색 패널 열기</h4>
          </div>
          <div className="ml-8">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
              <div className="flex flex-col items-center gap-3">
                <HiSearch className="text-blue-600 text-2xl" />
                <div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    우측 상단 <span className="font-semibold">검색</span> 버튼을 클릭하거나<br />
                    키보드에서 <span className="font-semibold px-2 py-0.5 bg-white rounded border border-blue-200">/</span> 키를 눌러보세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: 필터 적용 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex-shrink-0">
              2
            </div>
            <h4 className="text-sm font-bold text-slate-800">다양한 필터 조건</h4>
          </div>
          <div className="ml-8">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex flex-col items-center gap-3 mb-4">
                <HiFilter className="text-purple-600 text-2xl" />
                <p className="text-sm text-slate-700 text-center">
                  강력한 필터 옵션으로 원하는 카드를 정확히 찾을 수 있습니다:
                </p>
              </div>
              <ul className="text-sm text-slate-700 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span><span className="font-semibold">우선순위</span>: HIGH, MEDIUM, LOW</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span><span className="font-semibold">담당자</span>: 특정 팀원에게 할당된 카드</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span><span className="font-semibold">상태</span>: 완료, 미완료, 지연됨</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span><span className="font-semibold">라벨</span>: 프로젝트별, 카테고리별 분류</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span><span className="font-semibold">마감일 범위</span>: 특정 기간 내 카드</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100 shrink-0 w-full max-w-2xl">
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <span>💡</span> Tip: 여러 필터를 조합하면 더 정확한 검색이 가능합니다
        </p>
      </div>
    </div>
  );
};
