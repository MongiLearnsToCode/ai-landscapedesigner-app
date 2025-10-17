import React from 'react';
import { useToast } from '../contexts/ToastContext';
import { Toast } from './Toast';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex flex-col items-end justify-start px-4 py-6 pointer-events-none sm:p-6 z-50 space-y-4"
    >
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
};
