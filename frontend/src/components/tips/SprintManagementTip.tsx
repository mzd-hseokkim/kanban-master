import React from 'react';

export const SprintManagementTip: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-4">
      <div className="text-6xl mb-4">🏃</div>
      <h3 className="text-2xl font-bold text-slate-800 mb-4">스프린트로 일정 관리</h3>

      <div className="w-full max-w-sm bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm font-bold text-slate-700">Sprint 23</span>
          </div>
          <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">D-3</span>
        </div>

        <div className="space-y-2">
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-3/4 rounded-full"></div>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>진행률 75%</span>
            <span>12/16 완료</span>
          </div>
        </div>
      </div>

      <p className="text-slate-600 text-sm mt-4 text-center">
        목표를 설정하고 진행 상황을<br/>한눈에 파악하세요.
      </p>
    </div>
  );
};
