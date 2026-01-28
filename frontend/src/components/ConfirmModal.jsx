import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmContext = createContext();

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within ConfirmProvider');
    }
    return context;
};

export const ConfirmProvider = ({ children }) => {
    const [config, setConfig] = useState(null);

    const confirm = useCallback(({
        title = 'Confirm Action',
        message = 'Are you sure you want to proceed?',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        type = 'warning' // warning, danger, info
    }) => {
        return new Promise((resolve) => {
            setConfig({
                title,
                message,
                confirmText,
                cancelText,
                type,
                onConfirm: () => {
                    setConfig(null);
                    resolve(true);
                },
                onCancel: () => {
                    setConfig(null);
                    resolve(false);
                }
            });
        });
    }, []);

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {config && <ConfirmModal {...config} />}
        </ConfirmContext.Provider>
    );
};

const ConfirmModal = ({ title, message, confirmText, cancelText, type, onConfirm, onCancel }) => {
    const typeConfig = {
        warning: {
            iconBg: 'bg-yellow-100',
            iconColor: 'text-yellow-600',
            confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        },
        danger: {
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            confirmBtn: 'bg-red-600 hover:bg-red-700 text-white'
        },
        info: {
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white'
        }
    };

    const config = typeConfig[type] || typeConfig.warning;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-sm shadow-2xl max-w-md w-full p-6 animate-scale-in">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center mb-4`}>
                    <AlertTriangle className={config.iconColor} size={24} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-primary mb-2">{title}</h3>
                <p className="text-text-secondary text-sm mb-6 leading-relaxed">{message}</p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 border border-secondary/20 rounded-sm text-sm font-medium text-text-secondary hover:bg-secondary/5 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2.5 rounded-sm text-sm font-bold uppercase tracking-wider transition-colors shadow-sm ${config.confirmBtn}`}
                    >
                        {confirmText}
                    </button>
                </div>

                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-text-secondary hover:text-primary transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};
