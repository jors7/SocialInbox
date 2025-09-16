'use client';

import { useState, useEffect } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

let toastCount = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (props: Omit<Toast, 'id'>) => {
    const id = String(toastCount++);
    const newToast = { ...props, id };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // For now, we'll just log toasts to console
  // In a real app, you'd render these with a toast component
  useEffect(() => {
    if (toasts.length > 0) {
      const latest = toasts[toasts.length - 1];
      console.log(`[Toast] ${latest.title}: ${latest.description || ''}`);
    }
  }, [toasts]);

  return { toast, dismiss };
}