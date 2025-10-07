import { useState, useCallback } from 'react';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
  confirmButtonClass?: string;
}

interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean;
  onConfirm: () => void;
}

export function useConfirmation() {
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showConfirmation = useCallback((
    options: ConfirmationOptions,
    onConfirm: () => void
  ) => {
    setConfirmationState({
      ...options,
      isOpen: true,
      onConfirm,
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmationState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const confirmAndExecute = useCallback((
    options: ConfirmationOptions,
    action: () => void | Promise<void>
  ) => {
    showConfirmation(options, async () => {
      try {
        await action();
      } catch (error) {
        console.error('Action failed:', error);
      }
    });
  }, [showConfirmation]);

  return {
    confirmationState,
    showConfirmation,
    hideConfirmation,
    confirmAndExecute,
  };
}
