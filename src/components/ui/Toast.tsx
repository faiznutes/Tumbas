"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Toast as ToastType } from "@/types";

interface ToastContextType {
  toasts: ToastType[];
  addToast: (message: string, type?: ToastType["type"]) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const addToast = useCallback((message: string, type: ToastType["type"] = "info") => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: ToastType[];
  removeToast: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const themes = {
    success: {
      icon: "text-emerald-600",
      ring: "ring-emerald-100",
      progress: "bg-emerald-500",
      badge: "Sukses",
    },
    error: {
      icon: "text-rose-600",
      ring: "ring-rose-100",
      progress: "bg-rose-500",
      badge: "Error",
    },
    warning: {
      icon: "text-amber-600",
      ring: "ring-amber-100",
      progress: "bg-amber-500",
      badge: "Perhatian",
    },
    info: {
      icon: "text-sky-600",
      ring: "ring-sky-100",
      progress: "bg-sky-500",
      badge: "Info",
    },
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[92vw] max-w-sm flex-col gap-3 sm:w-full">
      {toasts.map((toast) => {
        const theme = themes[toast.type];
        return (
          <div
            key={toast.id}
            className={`relative overflow-hidden rounded-2xl border border-[#e7edf3] bg-white/95 p-4 shadow-xl backdrop-blur ${theme.ring} ring-1 animate-in slide-in-from-right duration-300`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 ${theme.icon}`}>
                {icons[toast.type]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#4c739a]">{theme.badge}</p>
                <p className="mt-0.5 text-sm font-medium text-[#0d141b] leading-snug">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="rounded-md p-1 text-[#4c739a] hover:bg-slate-100 hover:text-[#0d141b]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full ${theme.progress} animate-[toastbar_4s_linear_forwards]`} />
            </div>
          </div>
        );
      })}
      <style jsx global>{`
        @keyframes toastbar {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
