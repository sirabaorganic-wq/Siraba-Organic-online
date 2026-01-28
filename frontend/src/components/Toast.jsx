import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(toast => toast.id !== id));
            }, duration);
        }
    }, []);

    const success = useCallback((message, duration) => showToast(message, 'success', duration), [showToast]);
    const error = useCallback((message, duration) => showToast(message, 'error', duration), [showToast]);
    const warning = useCallback((message, duration) => showToast(message, 'warning', duration), [showToast]);
    const info = useCallback((message, duration) => showToast(message, 'info', duration), [showToast]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ success, error, warning, info, showToast }}>
            {children}
            <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const Toast = ({ message, type, onClose }) => {
    const config = {
        success: {
            icon: CheckCircle,
            className: 'bg-green-50 border-green-200 text-green-800',
            iconColor: 'text-green-600'
        },
        error: {
            icon: XCircle,
            className: 'bg-red-50 border-red-200 text-red-800',
            iconColor: 'text-red-600'
        },
        warning: {
            icon: AlertCircle,
            className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            iconColor: 'text-yellow-600'
        },
        info: {
            icon: Info,
            className: 'bg-blue-50 border-blue-200 text-blue-800',
            iconColor: 'text-blue-600'
        }
    };

    const { icon: Icon, className, iconColor } = config[type] || config.info;

    return (
        <div className={`pointer-events-auto flex items-start gap-3 min-w-80 max-w-md p-4 rounded-sm border shadow-lg backdrop-blur-sm animate-slide-in-right ${className}`}>
            <Icon className={`flex-shrink-0 ${iconColor}`} size={20} />
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button
                onClick={onClose}
                className="flex-shrink-0 hover:bg-black/5 rounded-sm p-1 transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
};
