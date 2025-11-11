import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ConfirmDialog, AlertDialog } from '../components/common/Dialog';

interface DialogConfig {
  title?: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'error' | 'success';
}

interface ConfirmDialogConfig extends DialogConfig {
  variant?: 'danger' | 'warning' | 'info';
}

interface AlertDialogConfig extends DialogConfig {
  variant?: 'error' | 'warning' | 'info' | 'success';
}

interface DialogContextType {
  showConfirm: (config: ConfirmDialogConfig) => Promise<boolean>;
  showAlert: (config: AlertDialogConfig) => Promise<void>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = (): DialogContextType => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within DialogProvider');
  }
  return context;
};

interface DialogProviderProps {
  children: ReactNode;
}

export const DialogProvider: React.FC<DialogProviderProps> = ({ children }) => {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    config: ConfirmDialogConfig | null;
    resolve: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    config: null,
    resolve: null,
  });

  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    config: AlertDialogConfig | null;
    resolve: (() => void) | null;
  }>({
    isOpen: false,
    config: null,
    resolve: null,
  });

  const showConfirm = useCallback((config: ConfirmDialogConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        config,
        resolve,
      });
    });
  }, []);

  const showAlert = useCallback((config: AlertDialogConfig): Promise<void> => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        config,
        resolve,
      });
    });
  }, []);

  const handleConfirmClose = useCallback(() => {
    if (confirmState.resolve) {
      confirmState.resolve(false);
    }
    setConfirmState({ isOpen: false, config: null, resolve: null });
  }, [confirmState]);

  const handleConfirmConfirm = useCallback(() => {
    if (confirmState.resolve) {
      confirmState.resolve(true);
    }
    setConfirmState({ isOpen: false, config: null, resolve: null });
  }, [confirmState]);

  const handleAlertClose = useCallback(() => {
    if (alertState.resolve) {
      alertState.resolve();
    }
    setAlertState({ isOpen: false, config: null, resolve: null });
  }, [alertState]);

  return (
    <DialogContext.Provider value={{ showConfirm, showAlert }}>
      {children}
      {confirmState.config && (
        <ConfirmDialog
          isOpen={confirmState.isOpen}
          onClose={handleConfirmClose}
          onConfirm={handleConfirmConfirm}
          title={confirmState.config.title}
          confirmText={confirmState.config.confirmText}
          cancelText={confirmState.config.cancelText}
          variant={confirmState.config.variant}
        >
          {confirmState.config.message}
        </ConfirmDialog>
      )}
      {alertState.config && (
        <AlertDialog
          isOpen={alertState.isOpen}
          onClose={handleAlertClose}
          title={alertState.config.title}
          confirmText={alertState.config.confirmText}
          variant={alertState.config.variant}
        >
          {alertState.config.message}
        </AlertDialog>
      )}
    </DialogContext.Provider>
  );
};
