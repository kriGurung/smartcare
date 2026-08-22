import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let toastId = 0;

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const TONES = {
  success: 'bg-care-50 text-care-800 border-care-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  info: 'bg-brand-50 text-brand-800 border-brand-200',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', durationMs = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (durationMs > 0) {
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), durationMs);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2" role="status" aria-live="polite">
          {toasts.map((t) => {
            const Icon = ICONS[t.type] || ICONS.info;
            return (
              <div key={t.id} className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all ${TONES[t.type] || TONES.info}`}>
                <Icon size={18} className="mt-0.5 shrink-0" />
                <p className="flex-1 text-sm font-medium">{t.message}</p>
                <button onClick={() => removeToast(t.id)} className="shrink-0 rounded-lg p-0.5 opacity-60 transition hover:opacity-100" aria-label="Dismiss">
                  <X size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
