"use client";

import { forwardRef, useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "./utils";
import { CloseIcon, LAMP_WEIGHT } from "./icons";
import "./drawer.css";

export type DrawerSide = "right" | "left";

export interface DrawerProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Whether the drawer is open. Controlled. */
  open: boolean;
  /** Called when the drawer wants to close — Escape, the close button, or the scrim. */
  onOpenChange: (open: boolean) => void;
  /** The drawer's heading, and its accessible name. */
  title: ReactNode;
  /** A line under the title. */
  description?: ReactNode;
  /** The action row pinned at the foot — Close, a primary action. */
  footer?: ReactNode;
  /** Which edge it slides from. Default `"right"`. */
  side?: DrawerSide;
  /** The close button's accessible name. Default `"Close"`. */
  closeLabel?: string;
}

const FOCUSABLE =
  'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Shared with the other overlays: the first close must not unlock the scroll
 *  while a second overlay is still open. */
let drawerScrollLockCount = 0;

/**
 * A modal panel that slides in from the edge — settings, a record's detail, a
 * runbook opened beside the work rather than on top of it.
 *
 * It is the `Dialog`'s modal machinery on the base `.td-drawer` panel ([[L16]]):
 * a scrim over the page, focus trapped inside and returned to the opener on
 * close, Escape and a scrim click to dismiss, the body scroll locked, and the
 * whole thing portalled to `document.body` so no ancestor's stacking context or
 * transform can trap it.
 *
 * **Not a `Dialog`.** A dialog is a centred box for a short, self-contained task;
 * a drawer is an edge panel for something longer that stays anchored to the side
 * — a form with sections, a detail view, a filter panel. **Not a `Popover`**,
 * which is small, non-modal and anchored to its trigger; a drawer takes the page.
 *
 * *(This is the modal side sheet. A non-modal "side page" variant — no scrim, the
 * page left live — is a later addition once its design is settled.)*
 */
export const Drawer = forwardRef<HTMLDivElement, DrawerProps>(function Drawer(
  { open, onOpenChange, title, description, footer, side = "right", closeLabel = "Close", className, children, ...props },
  forwardedRef,
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
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !mounted) return;
    previousFocus.current = document.activeElement as HTMLElement;
    const panel = localRef.current;
    const focusables = () => [...(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
    const nodes = focusables();
    // Land on the first real control, not the close button.
    (nodes.find((node) => !node.hasAttribute("data-drawer-close")) ?? nodes[0])?.focus();
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChangeRef.current(false);
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const current = focusables();
      if (!current.length) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = current[0];
      const last = current[current.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previousFocus.current?.focus();
    };
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const isFirst = drawerScrollLockCount === 0;
    drawerScrollLockCount++;
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
      drawerScrollLockCount--;
      if (drawerScrollLockCount === 0) {
        body.style.overflow = previousOverflow;
        body.style.paddingRight = previousPadding;
      }
    };
  }, [open]);

  if (!open) return null;

  const overlay = (
    <div
      className={cx("td-overlay-backdrop", "td-react-overlay")}
      data-state="open"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChangeRef.current(false);
      }}
    >
      <div
        {...props}
        ref={setRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        data-side={side}
        data-state="open"
        className={cx("td-drawer", "td-react-drawer", className)}
      >
        <div className="td-modal-head">
          <h2 id={titleId} className="td-modal-title">
            {title}
          </h2>
          <button type="button" data-drawer-close className="td-alert-close" aria-label={closeLabel} onClick={() => onOpenChange(false)}>
            <CloseIcon weight={LAMP_WEIGHT} />
          </button>
        </div>
        {description ? (
          <p id={descriptionId} className="td-modal-desc">
            {description}
          </p>
        ) : null}
        {children}
        {footer ? <div className="td-modal-actions">{footer}</div> : null}
      </div>
    </div>
  );

  if (mounted && typeof document !== "undefined") {
    return createPortal(overlay, document.body);
  }
  return null;
});
