"use client";

import { forwardRef, useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode, type SVGProps } from "react";
import { createPortal } from "react-dom";
import "./tonaldepth-dialog.css";

const LAMP_WEIGHT = "fill" as const;

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * TonalDepth's own glyphs, copied in because a registry item is one
 * self-contained file. Filled and colour-neutral by construction, so the
 * component's lamp ladder moves them through `currentColor`.
 */
interface TdIconProps extends SVGProps<SVGSVGElement> {
  /** Edge length. `1em` so the glyph scales with the type it sits beside. */
  size?: number | string;
  /** The fill. `currentColor` so the lamp ramp can move it. */
  color?: string;
  /**
   * Accepted so a TD glyph is a drop-in at a call site passing
   * `weight={LAMP_WEIGHT}`. TD glyphs are filled by construction, so there is
   * nothing to switch — the prop is swallowed rather than forwarded, because
   * `weight` is not an SVG attribute and React would put it on the DOM.
   */
  weight?: string;
  /** Flip horizontally, matching Phosphor's prop of the same name. */
  mirrored?: boolean;
}

/** `fillRule` comes from `SVGProps`; pass `evenodd` where the artwork knocks a
 *  hole out of its own outline. */
interface TdGlyphProps extends TdIconProps {
  viewBox: string;
  d: string;
}

function TdGlyph({ viewBox, d, fillRule, size = "1em", color = "currentColor", weight, mirrored, ...props }: TdGlyphProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      fill={color}
      transform={mirrored ? "scale(-1, 1)" : undefined}
      {...props}
    >
      <path d={d} fillRule={fillRule} />
    </svg>
  );
}

// A bare cross, drawn as one filled polygon: two 40-unit bars crossing at the
// centre, tips at 30.4/225.6. Not a stroked path — the set is filled by
// construction, and a stroke cannot carry the lamp's glow.
const CLOSE = "M58.7,225.6 30.4,197.3 99.7,128 30.4,58.7 58.7,30.4 128,99.7 197.3,30.4 225.6,58.7 156.3,128 225.6,197.3 197.3,225.6 128,156.3Z";

/**
 * The dismiss mark. A bare cross.
 *
 * Phosphor's `X` cannot be used: at `fill` weight a stroke-only glyph renders
 * as a filled square PLATE with the mark knocked out of it. Its `XCircle` —
 * which this replaces — is a solid disc, and at the 13px a dismiss control
 * uses that reads as a hole punched in the surface rather than as a mark on
 * it, which is the one move the system forbids. The bar and the disc were
 * also the same glyph as CancelIcon, so dismissing a panel and refusing an
 * action looked identical.
 */
function TdClose(props: TdIconProps) {
  return <TdGlyph viewBox="0 0 256 256" d={CLOSE} {...props} />;
}

const CloseIcon = TdClose;

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
export type TonalDepthDialogSize = "sm" | "md" | "lg";

export interface TonalDepthDialogProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
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
  size?: TonalDepthDialogSize;
}

const TonalDepthFOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Track how many overlays are open so the first close does not unlock
 *  the scroll while a second dialog is still showing. */
let TonalDepthscrollLockCount = 0;

export const TonalDepthDialog = forwardRef<HTMLDivElement, TonalDepthDialogProps>(function TonalDepthDialog(
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
    const focusables = () => [...(dialog?.querySelectorAll<HTMLElement>(TonalDepthFOCUSABLE) ?? [])];
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
    const isFirst = TonalDepthscrollLockCount === 0;
    TonalDepthscrollLockCount++;
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
      TonalDepthscrollLockCount--;
      if (TonalDepthscrollLockCount === 0) {
        body.style.overflow = previousOverflow;
        body.style.paddingRight = previousPadding;
      }
    };
  }, [open]);

  if (!open) return null;

  const overlay = (
    <div className={cx("td-overlay-backdrop", "td-registry-overlay")} data-state={open ? "open" : "closed"} onMouseDown={event => { if (event.target === event.currentTarget) onOpenChangeRef.current(false); }}>
      <div {...props} ref={setRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} tabIndex={-1} className={cx("td-modal", "td-registry-dialog", `td-registry-dialog--${size}`, className)}>
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
