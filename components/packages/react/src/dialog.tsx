"use client";

import { forwardRef, useEffect, useId, useRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import { CloseIcon, LAMP_WEIGHT } from "./icons";

export interface DialogProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
}

const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export const Dialog = forwardRef<HTMLDivElement, DialogProps>(function Dialog(
  { open, onOpenChange, title, description, footer, closeLabel = "Close dialog", className, children, ...props }, forwardedRef,
) {
  const titleId = useId();
  const descriptionId = useId();
  const localRef = useRef<HTMLDivElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const setRef = (node: HTMLDivElement | null) => {
    localRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };
  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement;
    const dialog = localRef.current;
    dialog?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onOpenChange(false); return; }
      if (event.key !== "Tab" || !dialog) return;
      const nodes = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!nodes.length) { event.preventDefault(); dialog.focus(); return; }
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); previousFocus.current?.focus(); };
  }, [open, onOpenChange]);
  if (!open) return null;
  return (
    <div className={cx("td-overlay-backdrop", "td-react-overlay")} data-state={open ? "open" : "closed"} onMouseDown={event => { if (event.target === event.currentTarget) onOpenChange(false); }}>
      <div {...props} ref={setRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} tabIndex={-1} className={cx("td-modal", "td-react-dialog", className)}>
        <div className="td-modal-head"><h2 id={titleId} className="td-modal-title">{title}</h2><button type="button" className="td-alert-close" aria-label={closeLabel} onClick={() => onOpenChange(false)}><CloseIcon weight={LAMP_WEIGHT} /></button></div>
        {description ? <p id={descriptionId} className="td-modal-desc">{description}</p> : null}
        {children}
        {footer ? <div className="td-modal-actions">{footer}</div> : null}
      </div>
    </div>
  );
});
