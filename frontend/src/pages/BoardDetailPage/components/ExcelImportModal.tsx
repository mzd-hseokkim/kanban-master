import { useDialog } from '@/context/DialogContext';
import excelService from '@/services/excelService';
import type { ExcelImportMode, ImportJobStartResponse } from '@/types/excel';
import { useState } from 'react';
import { HiUpload } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation(['board', 'common']);
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
      setError(t('board:excel.selectFileError'));
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
        err instanceof Error ? err.message : t('board:excel.startFailed');
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
            <h2 className="text-lg font-bold text-slate-900 mt-1">{t('board:excel.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors"
            aria-label={t('common:button.close')}
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
              <p className="text-sm text-slate-800 font-semibold">{t('board:excel.description')}</p>
              <p className="text-xs text-slate-500 mt-1">{t('board:excel.hint')}</p>
              <div className="mt-3 flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors">
                  <input type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />
                  <span>{t('board:excel.chooseFile')}</span>
                </label>
                <span className="text-sm text-slate-600">
                  {selectedFile ? selectedFile.name : t('board:excel.noFile')}
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
              <p className="text-xs text-slate-500 mt-1">{t('board:excel.mergeHint')}</p>
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
              <p className="text-sm font-semibold">{t('board:excel.overwrite')}</p>
              <p className="text-xs text-slate-500 mt-1">{t('board:excel.overwriteHint')}</p>
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
            {t('common:button.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 shadow-md hover:from-blue-500 hover:to-cyan-500 transition-all disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('board:excel.uploading') : t('board:excel.start')}
          </button>
        </div>
      </div>
    </div>
  );
};
