"use client";

import { forwardRef, useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode, type SVGProps } from "react";
import { createPortal } from "react-dom";
import "./tonaldepth-drawer.css";

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

export type TonalDepthDrawerSide = "right" | "left";

export interface TonalDepthDrawerProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
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
  side?: TonalDepthDrawerSide;
  /** The close button's accessible name. Default `"Close"`. */
  closeLabel?: string;
}

const TonalDepthFOCUSABLE =
  'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Shared with the other overlays: the first close must not unlock the scroll
 *  while a second overlay is still open. */
let TonalDepthdrawerScrollLockCount = 0;

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
export const TonalDepthDrawer = forwardRef<HTMLDivElement, TonalDepthDrawerProps>(function TonalDepthDrawer(
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
    const focusables = () => [...(panel?.querySelectorAll<HTMLElement>(TonalDepthFOCUSABLE) ?? [])];
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
    const isFirst = TonalDepthdrawerScrollLockCount === 0;
    TonalDepthdrawerScrollLockCount++;
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
      TonalDepthdrawerScrollLockCount--;
      if (TonalDepthdrawerScrollLockCount === 0) {
        body.style.overflow = previousOverflow;
        body.style.paddingRight = previousPadding;
      }
    };
  }, [open]);

  if (!open) return null;

  const overlay = (
    <div
      className={cx("td-overlay-backdrop", "td-registry-overlay")}
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
        className={cx("td-drawer", "td-registry-drawer", className)}
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
