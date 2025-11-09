import React, { useEffect } from 'react';

interface ErrorNotificationProps {
  message: string;
  onClose: () => void;
  duration?: number; // ms, default 5000
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  message,
  onClose,
  duration = 5000,
}) => {
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-pastel-pink-100 border border-pastel-pink-300 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="text-pastel-pink-600 font-bold text-xl flex-shrink-0">!</div>
          <div className="flex-1">
            <p className="text-sm text-pastel-pink-700 font-medium">에러 발생</p>
            <p className="text-sm text-pastel-pink-600 mt-1">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-pastel-pink-500 hover:text-pastel-pink-700 flex-shrink-0 font-bold text-lg"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};
