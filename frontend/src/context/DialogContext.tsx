import { AlertModal } from '@/components/common/AlertModal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import React, { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';

interface DialogContextType {
  alert: (message: string) => Promise<void>;
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
}

interface ConfirmOptions {
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

const DialogContext = createContext<DialogContextType | null>(null);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

interface DialogProviderProps {
  children: ReactNode;
}

export const DialogProvider: React.FC<DialogProviderProps> = ({ children }) => {
  // Alert State
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    message: string;
  }>({
    isOpen: false,
    message: '',
  });

  const alertResolveRef = useRef<(() => void) | null>(null);

  // Confirm State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    message: string;
    options: ConfirmOptions;
  }>({
    isOpen: false,
    message: '',
    options: {},
  });

  const confirmResolveRef = useRef<((value: boolean) => void) | null>(null);

  const alert = useCallback((message: string): Promise<void> => {
    return new Promise((resolve) => {
      alertResolveRef.current = resolve;
      setAlertState({
        isOpen: true,
        message,
      });
    });
  }, []);

  const confirm = useCallback((message: string, options: ConfirmOptions = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmState({
        isOpen: true,
        message,
        options,
      });
    });
  }, []);

  const closeAlert = useCallback(() => {
    if (alertResolveRef.current) {
      alertResolveRef.current();
      alertResolveRef.current = null;
    }
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const closeConfirm = useCallback((result: boolean) => {
    if (confirmResolveRef.current) {
      confirmResolveRef.current(result);
      confirmResolveRef.current = null;
    }
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const contextValue = useMemo(() => ({ alert, confirm }), [alert, confirm]);

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      {alertState.isOpen && (
        <AlertModal
          isOpen={alertState.isOpen}
          message={alertState.message}
          onClose={closeAlert}
        />
      )}
      {confirmState.isOpen && (
        <ConfirmModal
          isOpen={confirmState.isOpen}
          message={confirmState.message}
          onConfirm={() => closeConfirm(true)}
          onCancel={() => closeConfirm(false)}
          confirmText={confirmState.options.confirmText}
          cancelText={confirmState.options.cancelText}
          isDestructive={confirmState.options.isDestructive}
        />
      )}
    </DialogContext.Provider>
  );
};
