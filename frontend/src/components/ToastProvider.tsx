import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  ttl?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, ttlMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }>= ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', ttlMs = 3500) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const toast: Toast = { id, message, type, ttl: ttlMs };
    setToasts(prev => [...prev, toast]);
    if (ttlMs > 0) {
      setTimeout(() => removeToast(id), ttlMs);
    }
  }, [removeToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[2000] space-y-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={[
              'min-w-[260px] max-w-[420px] rounded-lg shadow-lg px-4 py-3 text-sm text-white flex items-start gap-3',
              t.type === 'success' ? 'bg-green-600' : '',
              t.type === 'error' ? 'bg-red-600' : '',
              t.type === 'warning' ? 'bg-yellow-600' : '',
              t.type === 'info' ? 'bg-gray-800' : ''
            ].join(' ')}
          >
            <span className="flex-1">{t.message}</span>
            <button
              className="ml-2 opacity-80 hover:opacity-100"
              onClick={() => removeToast(t.id)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
