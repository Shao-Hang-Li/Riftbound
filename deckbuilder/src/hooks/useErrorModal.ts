import { useState, useCallback } from 'react';

export interface ErrorModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'error' | 'warning' | 'success' | 'info';
}

export const useErrorModal = () => {
  const [errorModal, setErrorModal] = useState<ErrorModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  const showError = useCallback((title: string, message: string, type: 'error' | 'warning' | 'success' | 'info' = 'error') => {
    setErrorModal({
      isOpen: true,
      title,
      message,
      type
    });
  }, []);

  const closeError = useCallback(() => {
    setErrorModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    errorModal,
    showError,
    closeError
  };
};
