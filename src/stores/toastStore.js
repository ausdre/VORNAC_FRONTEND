/**
 * Toast Notification Store
 * Global state management for toast notifications
 */
import { create } from 'zustand';

export const useToastStore = create((set) => ({
  toasts: [],

  addToast: (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }]
    }));
    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    }));
  },

  // Convenience methods
  success: (message, duration) => {
    return useToastStore.getState().addToast(message, 'success', duration);
  },

  error: (message, duration) => {
    return useToastStore.getState().addToast(message, 'error', duration);
  },

  info: (message, duration) => {
    return useToastStore.getState().addToast(message, 'info', duration);
  },

  warning: (message, duration) => {
    return useToastStore.getState().addToast(message, 'warning', duration);
  }
}));
