import React from 'react';
import { HiArrowLeft, HiDownload, HiUpload } from 'react-icons/hi';

export const ExcelImportTip: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col items-center px-6 py-2 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col items-center justify-center mb-6 shrink-0">
        <span className="text-4xl mb-3">📊</span>
        <h3 className="text-xl font-bold text-slate-800 mb-1">Excel 가져오기</h3>
        <p className="text-sm text-slate-500">Excel 파일로 카드를 일괄 생성하고 관리하세요</p>
      </div>

      <div className="w-full max-w-2xl space-y-5 pb-4">
        {/* Step 1: Template Download */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex-shrink-0">
              1
            </div>
            <h4 className="text-sm font-bold text-slate-800">템플릿 다운로드</h4>
          </div>
          <div className="ml-8">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
              <div className="flex flex-col items-center gap-3">
                <HiDownload className="text-blue-600 text-2xl" />
                <div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    우측 상단 <span className="font-semibold">엑셀</span> 버튼을 클릭하고,<br />
                    <span className="font-semibold">템플릿 다운로드</span>를 선택하세요.
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    올바른 형식의 Excel 파일을 받을 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Fill Template */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex-shrink-0">
              2
            </div>
            <h4 className="text-sm font-bold text-slate-800">템플릿 작성</h4>
          </div>
          <div className="ml-8">
            <div className="p-4 bg-green-50 rounded-lg border border-green-100 text-center">
              <p className="text-sm text-slate-700 leading-relaxed mb-3">
                다운로드한 템플릿에 카드 정보를 입력하세요:
              </p>
              <ul className="text-sm text-slate-700 space-y-1.5 inline-block text-left">
                <li>• 제목, 설명, 담당자, 우선순위</li>
                <li>• 시작일, 마감일, 라벨</li>
                <li>• 각 컬럼에 맞는 형식으로 입력</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 3: Import */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex-shrink-0">
              3
            </div>
            <h4 className="text-sm font-bold text-slate-800">엑셀 가져오기</h4>
          </div>
          <div className="ml-8">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 text-center">
              <div className="flex flex-col items-center gap-3">
                <HiUpload className="text-purple-600 text-2xl" />
                <p className="text-sm text-slate-700 leading-relaxed">
                  <span className="font-semibold">엑셀 가져오기</span>를 클릭하고 작성한 파일을 업로드하면<br />
                  카드가 자동 생성됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bonus: Export - 동일한 스타일로 변경 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex-shrink-0">
              +
            </div>
            <h4 className="text-sm font-bold text-slate-800">엑셀로 내보내기</h4>
          </div>
          <div className="ml-8">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 text-center">
              <div className="flex flex-col items-center gap-3">
                <HiArrowLeft className="text-orange-600 text-2xl rotate-180" />
                <div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    현재 보드의 모든 카드를 Excel 파일로<br />
                    내보내기할 수 있습니다.
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    백업, 공유, 분석 등에 활용하세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100 shrink-0 w-full max-w-2xl">
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <span>💡</span> Tip: 대량의 카드를 한 번에 생성할 때 유용합니다
        </p>
      </div>
    </div>
  );
};
