import { useState } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (props: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { ...props, id };
    setToasts((prevToasts) => [...prevToasts, newToast]);

    // Auto-dismiss after duration (default 3 seconds)
    setTimeout(() => {
      dismiss(id);
    }, props.duration || 3000);

    return { id, dismiss: () => dismiss(id) };
  };

  const dismiss = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
  };

  return {
    toast,
    toasts,
    dismiss,
  };
}