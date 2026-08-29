"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CloseIcon, LAMP_WEIGHT } from "./icons";
import "./toast.css";

export type ToastVariant = "info" | "success" | "error";
export interface ToastInput { title: ReactNode; description?: ReactNode; variant?: ToastVariant; duration?: number }
interface ToastRecord extends ToastInput { id: number }
interface ToastContextValue { toast: (input: ToastInput) => number; dismiss: (id: number) => void }
const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps { children: ReactNode; defaultDuration?: number }
export function ToastProvider({ children, defaultDuration = 4000 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const sequence = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const dismiss = useCallback((id: number) => { const timer = timers.current.get(id); if (timer) clearTimeout(timer); timers.current.delete(id); setToasts(current => current.filter(item => item.id !== id)); }, []);
  const toast = useCallback((input: ToastInput) => {
    const id = ++sequence.current;
    setToasts(current => [...current, { ...input, id, variant: input.variant ?? "info" }]);
    const duration = input.duration ?? defaultDuration;
    if (duration > 0) timers.current.set(id, setTimeout(() => dismiss(id), duration));
    return id;
  }, [defaultDuration, dismiss]);
  useEffect(() => () => timers.current.forEach(timer => window.clearTimeout(timer)), []);
  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="td-react-toast-viewport" aria-live="polite" aria-atomic="false">
        {toasts.map(item => <div key={item.id} className={`td-toast td-toast--${item.variant} td-react-toast td-react-toast--${item.variant}`} role={item.variant === "error" ? "alert" : "status"}><span className="td-react-toast-lamp" aria-hidden="true" /><div><strong>{item.title}</strong>{item.description ? <p>{item.description}</p> : null}</div><button type="button" className="td-toast-close td-react-toast-close" aria-label="Dismiss notification" onClick={() => dismiss(item.id)}><CloseIcon weight={LAMP_WEIGHT} /></button></div>)}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used within ToastProvider");
  return value;
}
