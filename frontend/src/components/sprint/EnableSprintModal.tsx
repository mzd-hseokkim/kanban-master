import { useDialog } from '@/context/DialogContext';
import { useState } from 'react';
import { HiExclamationCircle, HiX } from 'react-icons/hi';

interface EnableSprintModalProps {
  isOpen: boolean;
  boardId: number;
  boardName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const EnableSprintModal = ({
  isOpen,
  boardId,
  boardName,
  onClose,
  onConfirm,
}: EnableSprintModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { alert } = useDialog();

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm();
      // Success - modal will be closed by parent
    } catch (error) {
      // Error handled by parent
      console.error('Enable sprint error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            Sprint 모드 활성화
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
            disabled={isLoading}
          >
            <HiX className="text-xl text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <HiExclamationCircle className="text-2xl text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold text-amber-900">
                이 작업은 되돌릴 수 없습니다
              </p>
              <p className="text-sm text-amber-800">
                Sprint 모드를 활성화하면 보드가 스프린트 기반 워크플로우로 전환됩니다.
                이후 다시 칸반 모드로 되돌릴 수 없습니다.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900">Sprint 모드의 특징:</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>정해진 기간(Sprint) 단위로 작업 관리</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>백로그에서 Sprint로 카드 할당</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>용량 계획 및 번다운 차트</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Sprint 완료 시 자동 롤오버</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-slate-500 italic">
            보드: <strong>{boardName}</strong>
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
          >
            {isLoading ? '활성화 중...' : 'Sprint 활성화'}
          </button>
        </div>
      </div>
    </div>
  );
};
