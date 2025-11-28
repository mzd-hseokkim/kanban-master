import React from 'react';
import { HiCheck, HiPlus, HiTrash } from 'react-icons/hi';

export const ChecklistTip: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col items-center px-6 py-2 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col items-center justify-center mb-6 shrink-0">
        <span className="text-4xl mb-3">✅</span>
        <h3 className="text-xl font-bold text-slate-800 mb-1">체크리스트로 꼼꼼하게</h3>
        <p className="text-sm text-slate-500">작업의 세부 단계를 놓치지 않고 관리하세요</p>
      </div>

      <div className="w-full max-w-2xl space-y-6 pb-4">
        {/* Visual Mockup */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-slate-700 flex items-center gap-2">
              <span className="text-blue-600">📋</span> 체크리스트
            </h4>
            <span className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">완료 항목 숨기기</span>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>2/3 완료</span>
              <span>66%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-2/3 rounded-full"></div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-3 group">
              <div className="w-5 h-5 rounded border border-green-500 bg-green-500 flex items-center justify-center text-white shrink-0">
                <HiCheck className="text-sm" />
              </div>
              <span className="text-sm text-slate-400 line-through flex-1">요구사항 분석하기</span>
              <HiTrash className="text-slate-300 text-sm opacity-0 group-hover:opacity-100" />
            </div>
            <div className="flex items-center gap-3 group">
              <div className="w-5 h-5 rounded border border-green-500 bg-green-500 flex items-center justify-center text-white shrink-0">
                <HiCheck className="text-sm" />
              </div>
              <span className="text-sm text-slate-400 line-through flex-1">디자인 시안 검토</span>
              <HiTrash className="text-slate-300 text-sm opacity-0 group-hover:opacity-100" />
            </div>
            <div className="flex items-center gap-3 group">
              <div className="w-5 h-5 rounded border-2 border-slate-300 flex items-center justify-center shrink-0"></div>
              <span className="text-sm text-slate-700 flex-1">개발 환경 설정</span>
              <HiTrash className="text-slate-300 text-sm opacity-0 group-hover:opacity-100" />
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 border-dashed text-slate-500 text-sm">
            <HiPlus />
            <span>새 항목 추가...</span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">1</div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">세부 작업 분해</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              큰 작업을 작은 단위로 쪼개어<br/>하나씩 해결해 나가세요.
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-100 text-center">
            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">2</div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">진행률 추적</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              체크박스를 클릭하면<br/>진행률이 자동 계산됩니다.
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 text-center">
            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">3</div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">유연한 관리</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              항목을 자유롭게 추가, 삭제하고<br/>순서를 변경할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100 shrink-0 w-full max-w-2xl">
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <span>💡</span> Tip: 엔터(Enter) 키를 눌러 연속으로 항목을 추가할 수 있습니다
        </p>
      </div>
    </div>
  );
};
