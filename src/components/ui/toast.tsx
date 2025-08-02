'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

export function Toast({ 
  title, 
  description, 
  type = 'info', 
  onClose 
}: Omit<ToastProps, 'id'>) {
  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-blue-600';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={cn(
      'relative flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out',
      getToastStyles()
    )}>
      <div className={cn('flex-shrink-0 text-lg font-bold', getIconColor())}>
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        {title && (
          <div className="font-semibold text-sm mb-1">
            {title}
          </div>
        )}
        {description && (
          <div className="text-sm opacity-90">
            {description}
          </div>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className={cn(
            'flex-shrink-0 rounded-md p-1 hover:bg-black/10 transition-colors',
            getIconColor()
          )}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}