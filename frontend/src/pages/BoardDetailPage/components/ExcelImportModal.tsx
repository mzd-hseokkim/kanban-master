import { useDialog } from '@/context/DialogContext';
import excelService from '@/services/excelService';
import type { ExcelImportMode, ImportJobStartResponse } from '@/types/excel';
import { useState } from 'react';
import { HiUpload } from 'react-icons/hi';

interface ExcelImportModalProps {
  isOpen: boolean;
  workspaceId: number;
  boardId: number;
  onClose: () => void;
  onStarted: (job: ImportJobStartResponse, fileName: string) => void;
}

export const ExcelImportModal = ({
  isOpen,
  workspaceId,
  boardId,
  onClose,
  onStarted,
}: ExcelImportModalProps) => {
  const { alert } = useDialog();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ExcelImportMode>('MERGE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('가져올 엑셀 파일을 선택해주세요.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const job = await excelService.startImport(workspaceId, boardId, selectedFile, mode);
      onStarted(job, selectedFile.name);
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '가져오기 작업을 시작하지 못했습니다.';
      setError(message);
      await alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Excel Import</p>
            <h2 className="text-lg font-bold text-slate-900 mt-1">보드로 엑셀 데이터 가져오기</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/90 to-cyan-500/80 text-white flex items-center justify-center text-lg font-bold shadow-sm">
              <HiUpload />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-800 font-semibold">템플릿과 동일한 형식의 XLSX 파일을 선택하세요.</p>
              <p className="text-xs text-slate-500 mt-1">라벨, 담당자 이메일, 마감일(UTC ISO8601), 체크리스트를 포함할 수 있습니다. 25MB 이하 파일만 지원합니다.</p>
              <div className="mt-3 flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors">
                  <input type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />
                  <span>파일 선택</span>
                </label>
                <span className="text-sm text-slate-600">
                  {selectedFile ? selectedFile.name : '선택된 파일 없음'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className={`rounded-xl border px-4 py-3 cursor-pointer transition-all ${mode === 'MERGE' ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}>
              <input
                type="radio"
                name="import-mode"
                value="MERGE"
                checked={mode === 'MERGE'}
                onChange={() => setMode('MERGE')}
                className="hidden"
              />
              <p className="text-sm font-semibold">병합</p>
              <p className="text-xs text-slate-500 mt-1">기존 데이터에 카드와 칼럼을 추가하거나 업데이트합니다.</p>
            </label>
            <label className={`rounded-xl border px-4 py-3 cursor-pointer transition-all ${mode === 'OVERWRITE' ? 'border-rose-400 bg-rose-50 text-rose-700 shadow-sm' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}>
              <input
                type="radio"
                name="import-mode"
                value="OVERWRITE"
                checked={mode === 'OVERWRITE'}
                onChange={() => setMode('OVERWRITE')}
                className="hidden"
              />
              <p className="text-sm font-semibold">덮어쓰기</p>
              <p className="text-xs text-slate-500 mt-1">동일 제목 카드를 대체하고, 기존 카드를 아카이브 처리합니다.</p>
            </label>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>

        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
            disabled={isSubmitting}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 shadow-md hover:from-blue-500 hover:to-cyan-500 transition-all disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? '업로드 중...' : '업로드 시작'}
          </button>
        </div>
      </div>
    </div>
  );
};
