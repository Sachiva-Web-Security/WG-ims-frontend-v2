'use client';
import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const toast = useCallback((message, type = 'success', duration = 3500) => {
        const id = Date.now();
        setToasts(t => [...t, { id, message, type, dying: false }]);
        setTimeout(() => {
            setToasts(t => t.map(x => x.id === id ? { ...x, dying: true } : x));
            setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 280);
        }, duration);
    }, []);

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const colors = {
        success: 'bg-white border-l-4 border-emerald-500',
        error: 'bg-white border-l-4 border-red-500',
        warning: 'bg-white border-l-4 border-amber-500',
        info: 'bg-white border-l-4 border-blue-500',
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id}
                        className={`${colors[t.type]} ${t.dying ? 'toast-out' : 'toast-in'}
              rounded-xl shadow-elevated px-4 py-3 flex items-center gap-3
              min-w-[280px] max-w-sm pointer-events-auto`}>
                        <span className="text-lg flex-shrink-0">{icons[t.type]}</span>
                        <p className="text-sm font-medium text-slate-700">{t.message}</p>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);
