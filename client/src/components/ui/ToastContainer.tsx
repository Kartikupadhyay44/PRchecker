import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md text-sm ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-950 dark:text-indigo-200'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-500" />}
            </div>
            <div className="flex-1 font-medium leading-snug">{toast.message}</div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
