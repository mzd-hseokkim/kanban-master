import type { ImportJobStatus } from '@/types/excel';
import { HiCheckCircle, HiExclamationCircle, HiRefresh } from 'react-icons/hi';

interface ImportProgressPanelProps {
  status: ImportJobStatus;
  fileName: string;
  onRefresh?: () => void;
  onClose?: () => void;
}

export const ImportProgressPanel = ({
  status,
  fileName,
  onRefresh,
  onClose,
}: ImportProgressPanelProps) => {
  const isDone = status.state === 'COMPLETED';
  const isFailed = status.state === 'FAILED';

  return (
    <div className="fixed bottom-4 right-4 z-30 w-[360px] rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-200/70">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Excel Import</p>
          <p className="text-sm font-bold text-slate-900">{fileName}</p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              aria-label="새로고침"
            >
              <HiRefresh />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              aria-label="닫기"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700">
            {isDone ? '가져오기 완료' : isFailed ? '실패' : '처리 중'}
          </span>
          <span className="text-slate-500">
            {status.processedRows}/{status.totalRows || '--'} 행
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full transition-all ${isFailed ? 'bg-rose-400' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`}
            style={{ width: `${Math.min(status.progressPercent || 0, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>성공 {status.successCount}</span>
          <span>실패 {status.failureCount}</span>
        </div>

        {status.errors && status.errors.length > 0 && (
          <div className="rounded-lg bg-rose-50 border border-rose-100 p-3 space-y-2">
            <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm">
              <HiExclamationCircle />
              <span>실패한 행</span>
            </div>
            <ul className="text-xs text-rose-700 space-y-1 max-h-32 overflow-auto">
              {status.errors.slice(0, 5).map((error, idx) => (
                <li key={`${error.rowNumber}-${idx}`}>
                  #{error.rowNumber}: {error.message}
                </li>
              ))}
              {status.errors.length > 5 && (
                <li className="text-rose-500">...외 {status.errors.length - 5}건</li>
              )}
            </ul>
          </div>
        )}

        {status.message && (
          <p className={`text-sm ${isFailed ? 'text-rose-600' : 'text-slate-600'}`}>
            {status.message}
          </p>
        )}
      </div>

      {isDone && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-sm text-slate-600 flex items-center gap-2">
          <HiCheckCircle className="text-emerald-500" />
          <span>가져오기가 완료되었습니다.</span>
        </div>
      )}
    </div>
  );
};
