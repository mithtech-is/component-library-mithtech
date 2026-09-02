"use client";

import { forwardRef, useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "./utils";
import { CloseIcon, LAMP_WEIGHT } from "./icons";
import "./dialog.css";

/**
 * How wide the panel is allowed to get.
 *
 * `md` is the default and the one to reach for: a question, a short form, a
 * confirmation. `sm` is for a single decision — a confirm, a one-field prompt —
 * where the default measure leaves a sentence stranded across 500px. `lg` is
 * for a dialog that carries a LAYOUT rather than a column: a settings panel
 * with zones down one side and their toggles beside them, a table, a diff.
 *
 * Every size is capped against the viewport, so `lg` on a phone is the same
 * width as `sm` on a phone. It widens the ceiling, it does not set a width.
 */
export type DialogSize = "sm" | "md" | "lg";

export interface DialogProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  /**
   * The panel's width ceiling. `md` (560px) by default.
   *
   * Reach for `lg` when the content is two-dimensional. A settings dialog
   * listing five zones and their toggles is a layout, and squeezing a layout
   * into the default measure turns every row into three wrapped lines — which
   * is what sent the first consumer to override `.td-modal` at the call site.
   */
  size?: DialogSize;
}

const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Track how many overlays are open so the first close does not unlock
 *  the scroll while a second dialog is still showing. */
let scrollLockCount = 0;

export const Dialog = forwardRef<HTMLDivElement, DialogProps>(function Dialog(
  { open, onOpenChange, title, description, footer, closeLabel = "Close dialog", size = "md", className, children, ...props }, forwardedRef,
) {
  const titleId = useId();
  const descriptionId = useId();
  const localRef = useRef<HTMLDivElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
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

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open || !mounted) return;
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
  }, [open, mounted]);

  /* Scroll lock: overflow hidden on body, compensated for the scrollbar gutter
     so the page does not jump sideways. A counter rather than a boolean handles
     stacked dialogs — the first close does not unlock while a second is open. */
  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const isFirst = scrollLockCount === 0;
    scrollLockCount++;
    let previousOverflow = "";
    let previousPadding = "";
    if (isFirst) {
      previousOverflow = body.style.overflow;
      previousPadding = body.style.paddingRight;
      const gutter = window.innerWidth - document.documentElement.clientWidth;
      body.style.overflow = "hidden";
      if (gutter > 0) body.style.paddingRight = `${gutter}px`;
    }
    return () => {
      scrollLockCount--;
      if (scrollLockCount === 0) {
        body.style.overflow = previousOverflow;
        body.style.paddingRight = previousPadding;
      }
    };
  }, [open]);

  if (!open) return null;

  const overlay = (
    <div className={cx("td-overlay-backdrop", "td-react-overlay")} data-state={open ? "open" : "closed"} onMouseDown={event => { if (event.target === event.currentTarget) onOpenChangeRef.current(false); }}>
      <div {...props} ref={setRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} tabIndex={-1} className={cx("td-modal", "td-react-dialog", `td-react-dialog--${size}`, className)}>
        <div className="td-modal-head"><h2 id={titleId} className="td-modal-title">{title}</h2><button type="button" data-dialog-close className="td-alert-close" aria-label={closeLabel} onClick={() => onOpenChange(false)}><CloseIcon weight={LAMP_WEIGHT} /></button></div>
        {description ? <p id={descriptionId} className="td-modal-desc">{description}</p> : null}
        {children}
        {footer ? <div className="td-modal-actions">{footer}</div> : null}
      </div>
    </div>
  );

  /* Portal to document.body so the overlay escapes any stacking context its
     parent sits in. Without this, a sticky header at z-index 59 paints over
     the dialog at z-index 200 because they are in different contexts, and
     backdrop-filter computes to none inside a transformed ancestor. */
  if (mounted && typeof document !== "undefined") {
    return createPortal(overlay, document.body);
  }
  return null;
});
