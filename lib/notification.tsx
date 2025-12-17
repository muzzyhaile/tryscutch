/**
 * Notification Service - Testable alternative to native alert/confirm
 * Implements Dependency Inversion Principle and Separation of Concerns
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationOptions {
  title?: string;
  message: string;
  type?: NotificationType;
  duration?: number;
  onClose?: () => void;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger';
}

interface Notification {
  id: string;
  title?: string;
  message: string;
  type: NotificationType;
  duration?: number;
  onClose?: () => void;
}

interface ConfirmDialog {
  id: string;
  title?: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: 'warning' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

interface NotificationContextValue {
  notify: (options: NotificationOptions) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const useNotification = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);

  const notify = useCallback((options: NotificationOptions) => {
    const id = crypto.randomUUID();
    const notification: Notification = {
      id,
      title: options.title,
      message: options.message,
      type: options.type ?? 'info',
      duration: options.duration ?? 5000,
      onClose: options.onClose,
    };

    setNotifications(prev => [...prev, notification]);

    if (notification.duration) {
      setTimeout(() => {
        dismissNotification(id);
      }, notification.duration);
    }
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification?.onClose) {
        notification.onClose();
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = crypto.randomUUID();
      setConfirmDialog({
        id,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText ?? 'Confirm',
        cancelText: options.cancelText ?? 'Cancel',
        type: options.type ?? 'warning',
        onConfirm: () => {
          setConfirmDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        },
      });
    });
  }, []);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getTypeClasses = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'error':
        return 'bg-rose-50 border-rose-200 text-rose-900';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  return (
    <NotificationContext.Provider value={{ notify, confirm, dismissNotification }}>
      {children}

      {/* Notification Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-md">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start gap-3 p-4 rounded-xl border-2 shadow-lg animate-in slide-in-from-top-5 ${getTypeClasses(notification.type)}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              {notification.title && (
                <h4 className="font-bold text-sm mb-1">{notification.title}</h4>
              )}
              <p className="text-sm">{notification.message}</p>
            </div>
            <button
              onClick={() => dismissNotification(notification.id)}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
            {confirmDialog.title && (
              <h3 className="text-xl font-bold text-zinc-950 mb-2">
                {confirmDialog.title}
              </h3>
            )}
            <p className="text-zinc-600 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={confirmDialog.onCancel}
                className="px-4 py-2 rounded-lg border-2 border-zinc-200 text-zinc-700 font-semibold hover:bg-zinc-50 transition-colors"
              >
                {confirmDialog.cancelText}
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  confirmDialog.type === 'danger'
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'bg-zinc-950 text-white hover:bg-zinc-800'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};
