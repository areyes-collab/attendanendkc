import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  message: string;
  type: ToastType;
}

export interface UseToastReturn {
  showToast: (message: string, type: ToastType) => void;
  toast: Toast | null;
}

export function useToast(): UseToastReturn {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return {
    toast,
    showToast,
  };
}