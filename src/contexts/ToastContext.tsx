'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastProps } from '@/components/ui/toast';

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void;
  showSuccess: (title: string, description?: string) => void;
  showError: (title: string, description?: string) => void;
  showWarning: (title: string, description?: string) => void;
  showInfo: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback implementation when ToastProvider is not available
    // This should not happen now that we have ToastProvider in root layout
    console.warn('useToast called outside of ToastProvider. Using fallback implementation.');
    return {
      showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
        console.log('Toast fallback:', toast.title, toast.description);
      },
      showSuccess: (title: string, description?: string) => {
        console.log('✅ Success:', title, description);
      },
      showError: (title: string, description?: string) => {
        console.error('❌ Error:', title, description);
      },
      showWarning: (title: string, description?: string) => {
        console.warn('⚠️ Warning:', title, description);
      },
      showInfo: (title: string, description?: string) => {
        console.info('ℹ️ Info:', title, description);
      },
    };
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: () => removeToast(id),
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration (default 5 seconds)
    const duration = toast.duration || 5000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const showSuccess = useCallback((title: string, description?: string) => {
    showToast({ title, description, type: 'success' });
  }, [showToast]);

  const showError = useCallback((title: string, description?: string) => {
    showToast({ title, description, type: 'error' });
  }, [showToast]);

  const showWarning = useCallback((title: string, description?: string) => {
    showToast({ title, description, type: 'warning' });
  }, [showToast]);

  const showInfo = useCallback((title: string, description?: string) => {
    showToast({ title, description, type: 'info' });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
    }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-in slide-in-from-right-full duration-300"
          >
            <Toast
              title={toast.title}
              description={toast.description}
              type={toast.type}
              onClose={toast.onClose}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}