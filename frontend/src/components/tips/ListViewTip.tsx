import React from 'react';
import { HiEye, HiPencil, HiViewList } from 'react-icons/hi';

export const ListViewTip: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col items-center px-6 py-2 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col items-center justify-center mb-6 shrink-0">
        <span className="text-4xl mb-3">📋</span>
        <h3 className="text-xl font-bold text-slate-800 mb-1">리스트 뷰</h3>
        <p className="text-sm text-slate-500">테이블 형식으로 모든 카드를 효율적으로 관리하세요</p>
      </div>

      <div className="w-full max-w-2xl space-y-5 pb-4">
        {/* Feature 1: 편집 모드 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex-shrink-0">
              1
            </div>
            <h4 className="text-sm font-bold text-slate-800">편집 모드 지원</h4>
          </div>
          <div className="ml-8">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
              <div className="flex flex-col items-center gap-3">
                <HiPencil className="text-blue-600 text-2xl" />
                <div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    리스트 뷰에서 바로 <span className="font-semibold">편집 모드</span>를 활성화하여<br />
                    카드를 열지 않고도 빠르게 수정할 수 있습니다.
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    여러 카드의 정보를 한 번에 업데이트하기에 최적화되어 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: 스티키 헤더 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex-shrink-0">
              2
            </div>
            <h4 className="text-sm font-bold text-slate-800">스티키 컬럼 헤더</h4>
          </div>
          <div className="ml-8">
            <div className="p-4 bg-green-50 rounded-lg border border-green-100 text-center">
              <p className="text-sm text-slate-700 leading-relaxed mb-3">
                스크롤 시 컬럼 헤더가 상단에 고정되어:
              </p>
              <ul className="text-sm text-slate-700 space-y-1.5 inline-block text-left">
                <li>• 긴 목록을 탐색할 때도 컬럼 구분이 명확합니다</li>
                <li>• 각 행이 어느 컬럼에 속하는지 쉽게 파악할 수 있습니다</li>
                <li>• 대량의 데이터를 효율적으로 탐색할 수 있습니다</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Feature 3: 빠른 네비게이션 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex-shrink-0">
              3
            </div>
            <h4 className="text-sm font-bold text-slate-800">원클릭 네비게이션</h4>
          </div>
          <div className="ml-8">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 text-center">
              <div className="flex flex-col items-center gap-3">
                <HiEye className="text-purple-600 text-2xl" />
                <p className="text-sm text-slate-700 leading-relaxed">
                  <span className="font-semibold">컬럼 헤더를 클릭</span>하면 해당 컬럼의<br />
                  첫 번째 카드로 즉시 이동합니다.
                </p>
                <p className="text-xs text-slate-500">
                  원하는 컬럼의 카드를 빠르게 찾을 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bonus: 전체 뷰 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex-shrink-0">
              +
            </div>
            <h4 className="text-sm font-bold text-slate-800">전체 카드 조망</h4>
          </div>
          <div className="ml-8">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 text-center">
              <div className="flex flex-col items-center gap-3">
                <HiViewList className="text-orange-600 text-2xl" />
                <div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    모든 컬럼의 카드를 한 화면에서 확인하고<br />
                    전체적인 작업 현황을 파악할 수 있습니다.
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    칸반 뷰와 리스트 뷰를 전환하며 최적의 작업 방식을 선택하세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100 shrink-0 w-full max-w-2xl">
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <span>💡</span> Tip: 보드 헤더의 리스트 아이콘을 클릭하여 전환할 수 있습니다
        </p>
      </div>
    </div>
  );
};
