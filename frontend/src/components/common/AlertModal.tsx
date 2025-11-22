import { useModalAnimation } from '@/hooks/useModalAnimation';
import { modalOverlayClass, modalPanelClass } from '@/styles/modalStyles';
import React from 'react';

interface AlertModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ isOpen, message, onClose }) => {
  const { stage, close } = useModalAnimation(onClose);

  if (!isOpen && stage !== 'exit') return null;

  return (
    <div className={modalOverlayClass(stage)} onClick={close}>
      <div
        className={`${modalPanelClass({ stage })} max-w-sm w-full p-6 text-center`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">알림</h3>
        <p className="text-sm text-gray-500 mb-6 whitespace-pre-wrap">{message}</p>
        <div className="flex justify-center">
          <button
            onClick={close}
            className="px-4 py-2 bg-pastel-blue-500 text-white text-sm font-medium rounded-lg hover:bg-pastel-blue-600 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-blue-500"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
