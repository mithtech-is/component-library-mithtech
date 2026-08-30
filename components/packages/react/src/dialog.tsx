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
  /* `onOpenChange` is read through a ref rather than named as a dependency.

     Naming it meant the effect tore down and re-ran on every render where the
     caller passed a fresh arrow — which is the normal way to pass it. The
     cleanup restores focus and the setup moves it to the first focusable, so a
     dialog holding a form threw the caret to the close button on EVERY
     KEYSTROKE. It went unnoticed because the test passed `setOpen` straight
     from `useState`, whose identity never changes. */
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement;
    const dialog = localRef.current;
    /* Land on the first real control, not on the close button. Dismiss is the
       one thing a reader can always reach; opening a form with the caret on
       "close" asks them to tab past the exit to reach the first question. */
    const focusables = () => [...(dialog?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
    const nodes = focusables();
    (nodes.find(node => !node.hasAttribute("data-dialog-close")) ?? nodes[0])?.focus();
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onOpenChangeRef.current(false); return; }
      if (event.key !== "Tab" || !dialog) return;
      const current = focusables();
      if (!current.length) { event.preventDefault(); dialog.focus(); return; }
      const first = current[0], last = current[current.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); previousFocus.current?.focus(); };
  }, [open]);
  if (!open) return null;
  return (
    <div className={cx("td-overlay-backdrop", "td-react-overlay")} data-state={open ? "open" : "closed"} onMouseDown={event => { if (event.target === event.currentTarget) onOpenChangeRef.current(false); }}>
      <div {...props} ref={setRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} tabIndex={-1} className={cx("td-modal", "td-react-dialog", className)}>
        <div className="td-modal-head"><h2 id={titleId} className="td-modal-title">{title}</h2><button type="button" data-dialog-close className="td-alert-close" aria-label={closeLabel} onClick={() => onOpenChange(false)}><CloseIcon weight={LAMP_WEIGHT} /></button></div>
        {description ? <p id={descriptionId} className="td-modal-desc">{description}</p> : null}
        {children}
        {footer ? <div className="td-modal-actions">{footer}</div> : null}
      </div>
    </div>
  );
});
