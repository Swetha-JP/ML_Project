import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import type { ToastMessage } from '../../types';
import { useApp } from '../../context/AppContext';
import clsx from 'clsx';

const icons = {
  success: <CheckCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  error:   <XCircle size={16} />,
  info:    <Info size={16} />,
};

function ToastItem({ toast }: { toast: ToastMessage }) {
  const { removeToast } = useApp();
  return (
    <div className={clsx('toast', `toast-${toast.type}`)}>
      <span className="toast-icon">{icons[toast.type]}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={() => removeToast(toast.id)}>
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useApp();
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
