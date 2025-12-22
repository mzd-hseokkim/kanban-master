import { useModalAnimation } from '@/hooks/useModalAnimation';
import { modalOverlayClass, modalPanelClass } from '@/styles/modalStyles';
import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
  confirmText = '확인',
  cancelText = '취소',
  isDestructive = false,
}) => {
  const { t } = useTranslation(['common']);
  // confirm 모달은 닫힐 때 취소로 간주하므로 onClose에 onCancel을 연결
  const { stage, close } = useModalAnimation(onCancel);

  if (!isOpen && stage !== 'exit') return null;

  const handleConfirm = () => {
    // 애니메이션 없이 즉시 닫히고 동작 수행 (또는 애니메이션 기다릴 수도 있음)
    // 여기서는 UX를 위해 애니메이션과 함께 닫히도록 close 호출 후 onConfirm 실행은 부모에서 처리?
    // 아니면 여기서 close() 호출하고 setTimeout으로 onConfirm?
    // useModalAnimation의 close는 상태만 변경하므로, 실제 로직은 별도로 처리해야 함.
    // 하지만 Promise 기반 호출을 위해선 여기서 즉시 응답을 보내는 게 나을 수 있음.
    // 일단 단순히 버튼 클릭 시 바로 onConfirm 호출 (DialogContext에서 닫기 처리)
    onConfirm();
  };

  const modalContent = (
    <div className={modalOverlayClass(stage, 'z-[1100]')} onClick={close}>
      <div
        className={`${modalPanelClass({ stage })} max-w-sm w-full p-6 text-center`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('common:confirm.title', { defaultValue: '확인' })}</h3>
        <p className="text-sm text-gray-500 mb-6 whitespace-pre-wrap">{message}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={close}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {cancelText || t('common:button.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isDestructive
                ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500'
                : 'bg-pastel-blue-500 hover:bg-pastel-blue-600 focus:ring-pastel-blue-500'
            }`}
          >
            {confirmText || t('common:button.confirm')}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
