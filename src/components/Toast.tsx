import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

let toastFn: (type: ToastType, message: string) => void;
const toastQueue: { type: ToastType, message: string }[] = [];

export const toast = (type: ToastType, message: string) => {
  if (toastFn) {
    toastFn(type, message);
  } else {
    toastQueue.push({ type, message });
  }
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toastFn = (type, message) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts(prev => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };

    // Process any buffered toasts
    while (toastQueue.length > 0) {
      const { type, message } = toastQueue.shift()!;
      toastFn(type, message);
    }

    return () => {
      // @ts-ignore
      toastFn = null;
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={cn(
              "pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border backdrop-blur-xl min-w-[320px] max-w-md",
              "bg-white border-red-50",
              t.type === 'success' && "border-red-100",
              t.type === 'error' && "border-red-200",
              t.type === 'warning' && "border-amber-100",
              t.type === 'info' && "border-blue-100"
            )}
          >
            <div className={cn(
              "p-3 rounded-2xl shadow-lg",
              t.type === 'success' && "bg-red-600 text-white shadow-red-600/20",
              t.type === 'error' && "bg-red-700 text-white shadow-red-700/20",
              t.type === 'warning' && "bg-amber-500 text-white shadow-amber-500/20",
              t.type === 'info' && "bg-blue-600 text-white shadow-blue-600/20"
            )}>
              {t.type === 'success' && <CheckCircle2 size={18} strokeWidth={3} />}
              {t.type === 'error' && <XCircle size={18} strokeWidth={3} />}
              {t.type === 'warning' && <AlertCircle size={18} strokeWidth={3} />}
              {t.type === 'info' && <Info size={18} strokeWidth={3} />}
            </div>
            <div className="flex-grow flex flex-col items-start gap-0.5">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-red-600/50 mb-0.5">
                {t.type === 'success' ? 'Dshop Notification' : t.type === 'error' ? 'Critical Alert' : t.type === 'warning' ? 'Attention' : 'System Info'}
              </span>
              <div className="font-black text-sm text-red-600 tracking-tight leading-snug">
                {t.message}
              </div>
            </div>
            <button 
              onClick={() => removeToast(t.id)}
              className="text-gray-300 hover:text-red-600 transition-colors p-1"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
