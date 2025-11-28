import React from 'react';
import { HiCalendar, HiClock } from 'react-icons/hi';

export const CalendarTip: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col items-center px-6 py-2 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col items-center justify-center mb-6 shrink-0">
        <span className="text-4xl mb-3">📅</span>
        <h3 className="text-xl font-bold text-slate-800 mb-1">일정을 한눈에 파악</h3>
        <p className="text-sm text-slate-500">캘린더 뷰로 프로젝트 흐름을 놓치지 마세요</p>
      </div>

      <div className="w-full max-w-2xl space-y-6 pb-4">
        {/* Visual Mockup */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
            <h4 className="font-bold text-slate-700 text-sm">2025년 11월</h4>
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400 mb-2">
            <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-xs text-slate-600">
            {/* Week 1 - dates with small cards showing */}
            <div className="p-1 opacity-30">27</div>
            <div className="p-1 opacity-30">28</div>
            <div className="p-1 opacity-30">29</div>
            <div className="p-1 opacity-30">30</div>
            <div className="p-1 opacity-30">31</div>
            <div className="p-1">1</div>
            <div className="p-1 text-red-500">2</div>

            {/* Week 2 - showing cards list */}
            <div className="p-1 text-red-500">3</div>
            <div className="p-1 relative h-16 bg-blue-50 rounded border border-blue-100">
              <div className="text-[9px] text-blue-600 p-1 space-y-0.5">
                <div className="flex items-center gap-0.5">
                  <span className="text-green-500">✓</span>
                  <span className="truncate">회의록</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <span className="text-gray-300">○</span>
                  <span className="truncate">디자인</span>
                </div>
              </div>
            </div>
            <div className="p-1">5</div>
            <div className="p-1">6</div>
            <div className="p-1">7</div>
            <div className="p-1">8</div>
            <div className="p-1 text-red-500">9</div>

            {/* Week 3 */}
            <div className="p-1 text-red-500">10</div>
            <div className="p-1 relative h-16 bg-purple-50 rounded border border-purple-100">
              <div className="text-[9px] text-purple-600 p-1 space-y-0.5">
                <div className="flex items-center gap-0.5">
                  <span className="text-gray-300">○</span>
                  <span className="truncate">기획 회의</span>
                </div>
              </div>
            </div>
            <div className="p-1">12</div>
            <div className="p-1">13</div>
            <div className="p-1 relative h-16 bg-green-50 rounded border border-green-100">
              <div className="text-[9px] text-green-600 p-1 space-y-0.5">
                <div className="flex items-center gap-0.5">
                  <span className="text-green-500">✓</span>
                  <span className="truncate">배포</span>
                </div>
              </div>
            </div>
            <div className="p-1">15</div>
            <div className="p-1 text-red-500">16</div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <HiCalendar className="text-lg" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">일별 카드 확인</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              날짜별로 시작하거나 종료되는 카드를 확인하세요.
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 text-center">
            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <HiClock className="text-lg" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">완료 상태 표시</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              체크 표시로 완료 여부를 한눈에 파악하세요.
            </p>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 text-center">
            <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-sm">S</div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">월간 조망</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              한 달 전체 일정을 한 화면에서 조망하세요.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100 shrink-0 w-full max-w-2xl">
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <span>💡</span> Tip: 보드 상단의 캘린더 아이콘을 클릭하여 전환하세요
        </p>
      </div>
    </div>
  );
};
