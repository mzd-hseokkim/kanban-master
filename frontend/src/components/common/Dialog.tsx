import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useModalAnimation } from '@/hooks/useModalAnimation';

interface BaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

interface ConfirmDialogProps extends BaseDialogProps {
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface AlertDialogProps extends BaseDialogProps {
  onConfirm?: () => void;
  confirmText?: string;
  variant?: 'error' | 'warning' | 'info' | 'success';
}

/**
 * Base Dialog Component with glassy design
 */
const BaseDialog: React.FC<BaseDialogProps> = ({ isOpen, onClose, title, children }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { stage, close } = useModalAnimation(onClose);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, close]);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      firstElement?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className={`modal-overlay ${stage ? `modal-overlay-${stage}` : ''} bg-gradient-pastel/80 backdrop-blur-sm z-[9999]`}
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'dialog-title' : undefined}
    >
      <div
        ref={dialogRef}
        className={`modal-panel ${stage ? `modal-panel-${stage}` : ''} glass-light rounded-3xl shadow-glass-lg border border-white/30 w-full max-w-md mx-4 p-7`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-pastel-blue-500 font-semibold mb-1">
              Dialog
            </p>
            <h2 id="dialog-title" className="text-2xl font-bold text-pastel-blue-900">
              {title}
            </h2>
          </div>
        )}
        <div>{children}</div>
      </div>
    </div>,
    document.body
  );
};

/**
 * Confirm Dialog - 확인/취소 선택용
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '확인',
  children,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'warning',
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const variantStyles = {
    danger: {
      button: 'bg-gradient-to-r from-pastel-blue-500 to-pastel-cyan-400 text-white font-semibold hover:shadow-lg transition shadow-glass-sm',
      icon: '⚠️',
      iconBg: 'bg-pastel-pink-100/70',
    },
    warning: {
      button: 'bg-gradient-to-r from-pastel-blue-500 to-pastel-cyan-400 text-white font-semibold hover:shadow-lg transition shadow-glass-sm',
      icon: '⚠️',
      iconBg: 'bg-pastel-pink-100/70',
    },
    info: {
      button: 'bg-gradient-to-r from-pastel-blue-500 to-pastel-cyan-400 text-white font-semibold hover:shadow-lg transition shadow-glass-sm',
      icon: 'ℹ️',
      iconBg: 'bg-pastel-blue-100/70',
    },
  };

  const style = variantStyles[variant];

  return (
    <BaseDialog isOpen={isOpen} onClose={onClose} title={title}>
      <div className="mb-6">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-2xl ${style.iconBg} backdrop-blur-sm flex items-center justify-center text-2xl shadow-glass-sm`}>
            {style.icon}
          </div>
          <div className="flex-1 pt-2">
            <p className="text-pastel-blue-900 leading-relaxed">{children}</p>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-3 rounded-xl bg-white/30 hover:bg-white/40 backdrop-blur-sm text-pastel-blue-700 font-semibold border border-white/40 transition disabled:opacity-50 shadow-glass-sm"
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          className={`flex-1 px-4 py-3 rounded-xl font-semibold transition disabled:opacity-50 shadow-glass-sm ${style.button}`}
        >
          {confirmText}
        </button>
      </div>
    </BaseDialog>
  );
};

/**
 * Alert Dialog - 단순 알림용
 */
export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '알림',
  children,
  confirmText = '확인',
  variant = 'info',
}) => {
  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  const variantStyles = {
    error: {
      button: 'bg-gradient-to-r from-pastel-blue-500 to-pastel-cyan-400 text-white font-semibold hover:shadow-lg transition shadow-glass-sm',
      icon: '❌',
      iconBg: 'bg-pastel-pink-100/70',
    },
    warning: {
      button: 'bg-gradient-to-r from-pastel-blue-500 to-pastel-cyan-400 text-white font-semibold hover:shadow-lg transition shadow-glass-sm',
      icon: '⚠️',
      iconBg: 'bg-pastel-pink-100/70',
    },
    info: {
      button: 'bg-gradient-to-r from-pastel-blue-500 to-pastel-cyan-400 text-white font-semibold hover:shadow-lg transition shadow-glass-sm',
      icon: 'ℹ️',
      iconBg: 'bg-pastel-blue-100/70',
    },
    success: {
      button: 'bg-gradient-to-r from-pastel-blue-500 to-pastel-cyan-400 text-white font-semibold hover:shadow-lg transition shadow-glass-sm',
      icon: '✅',
      iconBg: 'bg-pastel-mint-100/70',
    },
  };

  const style = variantStyles[variant];

  return (
    <BaseDialog isOpen={isOpen} onClose={onClose} title={title}>
      <div className="mb-6">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-2xl ${style.iconBg} backdrop-blur-sm flex items-center justify-center text-2xl shadow-glass-sm`}>
            {style.icon}
          </div>
          <div className="flex-1 pt-2">
            <p className="text-pastel-blue-900 leading-relaxed">{children}</p>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleConfirm}
          className={`px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50 shadow-glass-sm ${style.button}`}
        >
          {confirmText}
        </button>
      </div>
    </BaseDialog>
  );
};
