import { create } from 'zustand';
import type { ToastMessage } from '../types';

interface ToastState {
  toasts: ToastMessage[];
}

interface ToastActions {
  addToast: (message: string, type: ToastMessage['type']) => void;
  removeToast: (id: number) => void;
}

type ToastStore = ToastState & ToastActions;

let toastId = 0;

export const useToastStore = create<ToastStore>((set) => ({
  // Initial state
  toasts: [],

  // Actions
  addToast: (message: string, type: ToastMessage['type']) => {
    const id = toastId++;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
  },

  removeToast: (id: number) => {
    set((state) => ({ toasts: state.toasts.filter(toast => toast.id !== id) }));
  },
}));