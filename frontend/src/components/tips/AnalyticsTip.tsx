import React from 'react';
import { HiChartBar, HiLightningBolt, HiTrendingUp } from 'react-icons/hi';

export const AnalyticsTip: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col items-center px-6 py-2 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col items-center justify-center mb-6 shrink-0">
        <span className="text-4xl mb-3">📊</span>
        <h3 className="text-xl font-bold text-slate-800 mb-1">분석 대시보드</h3>
        <p className="text-sm text-slate-500">데이터 기반 인사이트로 프로젝트를 최적화하세요</p>
      </div>

      <div className="w-full max-w-2xl space-y-5 pb-4">
        {/* Feature 1: Current Statistics */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex-shrink-0">
              1
            </div>
            <h4 className="text-sm font-bold text-slate-800">현황 통계</h4>
          </div>
          <div className="ml-8">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
              <div className="flex flex-col items-center gap-3">
                <HiChartBar className="text-blue-600 text-2xl" />
                <div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    <span className="font-semibold">완료율, 우선순위, 컬럼별 분포</span>를<br />
                    시각적으로 확인할 수 있습니다.
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    담당자별, 라벨별 작업 분포도 한눈에 파악하세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Performance Metrics */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex-shrink-0">
              2
            </div>
            <h4 className="text-sm font-bold text-slate-800">성과 지표</h4>
          </div>
          <div className="ml-8">
            <div className="p-4 bg-green-50 rounded-lg border border-green-100 text-center">
              <p className="text-sm text-slate-700 leading-relaxed mb-3">
                핵심 성과 지표를 추적하여 팀 생산성을 측정:
              </p>
              <ul className="text-sm text-slate-700 space-y-1.5 inline-block text-left">
                <li>• <span className="font-semibold">평균 사이클 타임</span>: 작업 완료에 걸리는 평균 시간</li>
                <li>• <span className="font-semibold">완료/남은 작업</span>: 진행 상황 추적</li>
                <li>• 데이터 기반 워크플로우 개선 가능</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Feature 3: Trends */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex-shrink-0">
              3
            </div>
            <h4 className="text-sm font-bold text-slate-800">트렌드 분석</h4>
          </div>
          <div className="ml-8">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 text-center">
              <div className="flex flex-col items-center gap-3">
                <HiTrendingUp className="text-purple-600 text-2xl" />
                <div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    <span className="font-semibold">번다운 차트</span>로 최근 30일 진행 추이를 확인하고<br />
                    <span className="font-semibold">사이클 타임 분포</span>로 작업 패턴을 분석하세요.
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    병목 구간을 파악하고 프로세스를 개선할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bonus: Actionable Insights */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex-shrink-0">
              +
            </div>
            <h4 className="text-sm font-bold text-slate-800">실행 가능한 인사이트</h4>
          </div>
          <div className="ml-8">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 text-center">
              <div className="flex flex-col items-center gap-3">
                <HiLightningBolt className="text-orange-600 text-2xl" />
                <div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    데이터를 통해 팀의 작업 패턴을 이해하고<br />
                    병목을 해소하여 생산성을 높이세요.
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    정기적인 분석으로 지속적인 개선을 이끌어낼 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100 shrink-0 w-full max-w-2xl">
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <span>💡</span> Tip: 우측 상단의 분석 버튼을 클릭하여 대시보드를 확인하세요
        </p>
      </div>
    </div>
  );
};
