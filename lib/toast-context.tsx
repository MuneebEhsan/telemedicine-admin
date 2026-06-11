"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, duration = 5000) => {
      const id = `toast-${++toastCounter}-${Date.now()}`;
      const toast: Toast = { id, type, message, duration };
      setToasts((prev) => [...prev.slice(-4), toast]);
      const timer = setTimeout(() => removeToast(id), duration);
      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  const showSuccess = useCallback(
    (message: string) => addToast("success", message),
    [addToast]
  );
  const showError = useCallback(
    (message: string) => addToast("error", message, 7000),
    [addToast]
  );
  const showWarning = useCallback(
    (message: string) => addToast("warning", message, 6000),
    [addToast]
  );
  const showInfo = useCallback(
    (message: string) => addToast("info", message),
    [addToast]
  );

  const iconMap = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  const colorMap = {
    success: { bg: "#ecfdf5", border: "#6ee7b7", text: "#065f46", icon: "#059669" },
    error: { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b", icon: "#dc2626" },
    warning: { bg: "#fffbeb", border: "#fcd34d", text: "#92400e", icon: "#d97706" },
    info: { bg: "#eff6ff", border: "#93c5fd", text: "#1e40af", icon: "#2563eb" },
  };

  return (
    <ToastContext.Provider
      value={{ toasts, showSuccess, showError, showWarning, showInfo, removeToast }}
    >
      {children}
      {/* Toast Container */}
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          pointerEvents: "none",
          maxWidth: 380,
          width: "100%",
        }}
      >
        {toasts.map((toast) => {
          const colors = colorMap[toast.type];
          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: "auto",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.bg,
                color: colors.text,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                animation: "adminSlideIn 0.3s ease-out forwards",
                fontSize: 14,
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: colors.icon,
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {iconMap[toast.type]}
              </span>
              <p style={{ flex: 1, margin: 0, fontWeight: 500, lineHeight: 1.4 }}>
                {toast.message}
              </p>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: colors.text,
                  cursor: "pointer",
                  opacity: 0.5,
                  fontSize: 14,
                  padding: 0,
                  flexShrink: 0,
                }}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
      <style jsx global>{`
        @keyframes adminSlideIn {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>
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
