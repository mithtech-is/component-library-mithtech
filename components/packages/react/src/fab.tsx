"use client";

import { forwardRef, useEffect, useId, useRef, useState, type HTMLAttributes, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "./utils";
import { IconButton } from "./icon-button";
import { AddIcon, LAMP_WEIGHT } from "./icons";
import "./fab.css";

/**
 * The FAB's colour.
 * - `papaya` — the filled brand housing, white glyph. This is the system's
 *   one sanctioned loud control ([[L11]] exempts the single call to action),
 *   and a floating action is exactly that.
 * - `neutral` — the carved surface housing whose lamp lights green, for a FAB
 *   that should not shout over the page it floats on.
 */
export type FabTone = "papaya" | "neutral";

/** Which way the actions fan out from the main button. */
export type FabExpand = "up" | "down" | "left" | "right";

/** Which corner of the viewport the FAB pins to. `end`/`start` follow the
 *  reading direction — `end` is the right in English. */
export type FabCorner = "bottom-end" | "bottom-start" | "top-end" | "top-start";

export interface FabAction {
  /** The glyph. A filled mark, so the lamp can move it ([[L15]]). */
  icon: ReactNode;
  /**
   * Required. The pill beside the action AND its accessible name — a speed
   * dial of unlabelled discs is a row of mysteries.
   */
  label: string;
  onClick?: (event: ReactMouseEvent) => void;
  /** Renders the action as a link. */
  href?: string;
  /**
   * Render the link yourself — a framework `<Link>` — instead of a bare `<a>`.
   * Threaded to the action's IconButton, so a dial of links is client-routed
   * rather than a page load each. Ignored without `href`.
   */
  renderLink?: (props: { className: string; href: string; children: ReactNode }) => ReactNode;
  /** Override the child tone. Children are `neutral` by default so the main
   *  button stays the one loud thing. */
  tone?: FabTone;
}

export interface FloatingActionButtonProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** The main button's glyph. Defaults to a plus, which rotates to a cross
   *  when the dial opens. */
  icon?: ReactNode;
  /** The main button's accessible name — what the action is, or "Actions" for
   *  a dial. Required: an icon-only control with no name is unnamed to a
   *  screen reader. */
  label: string;
  /**
   * The speed-dial actions. Given none, the FAB is a single button that fires
   * `onClick` — a plain floating action rather than a dial.
   */
  actions?: FabAction[];
  /** Fired when there are no `actions` — the single-action form. */
  onClick?: (event: ReactMouseEvent) => void;
  /** `papaya` (the default, filled brand) or `neutral` (carved surface). */
  tone?: FabTone;
  /**
   * Which way the dial fans. Defaults from the corner — `up` from a bottom
   * corner, `down` from a top one — so the actions open into the screen rather
   * than off it. Set `left`/`right` for a horizontal dial.
   */
  expand?: FabExpand;
  /** Which corner it pins to. Default `bottom-end`. */
  corner?: FabCorner;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * The glyph shown while open. Given none, the main glyph rotates 45° — a
   * plus becomes a cross — which is the close affordance a dial wants.
   */
  openIcon?: ReactNode;
  /** Draw the label pill beside each action. On by default. */
  labels?: boolean;
  /** Distance from the pinned corner. A CSS length; defaults to the HUD inset. */
  inset?: number | string;
  /**
   * Pin it to the viewport corner. On by default, which is what a FAB is. Off
   * renders it in normal flow — for a specimen, or a FAB scoped to a section
   * rather than the whole screen. A pinned FAB portals to `document.body`,
   * because `position: fixed` resolves against a transformed ancestor and a
   * page that transforms anything would otherwise pin it to that element.
   */
  pinned?: boolean;
  /** Close the dial after an action fires. On by default. */
  closeOnAction?: boolean;
}

const DEFAULT_EXPAND: Record<FabCorner, FabExpand> = {
  "bottom-end": "up",
  "bottom-start": "up",
  "top-end": "down",
  "top-start": "down",
};

/**
 * The floating action button — a primary action pinned to a corner, and,
 * given a list, a speed dial that grows out of it.
 *
 * It is built out of `IconButton`, so the housing, the lamp and the depth
 * ladder are the system's own: `papaya` is the filled brand call to action and
 * `neutral` is the carved surface, and nothing here invents a new material.
 * The dial's children stay `neutral` by default, because a stack of filled
 * discs is the wall of fills the system forbids ([[L11]]) — one loud button,
 * quiet actions.
 */
export const FloatingActionButton = forwardRef<HTMLDivElement, FloatingActionButtonProps>(function FloatingActionButton(
  {
    icon,
    label,
    actions = [],
    onClick,
    tone = "papaya",
    expand,
    corner = "bottom-end",
    open,
    defaultOpen = false,
    onOpenChange,
    openIcon,
    labels = true,
    inset,
    pinned = true,
    closeOnAction = true,
    className,
    style,
    ...props
  },
  ref,
) {
  const base = useId();
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const isOpen = open ?? uncontrolled;
  const root = useRef<HTMLDivElement>(null);
  const mainButton = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  const dial = actions.length > 0;
  const fan = expand ?? DEFAULT_EXPAND[corner];

  const setOpen = (next: boolean) => {
    if (open === undefined) setUncontrolled(next);
    onOpenChange?.(next);
  };

  // Escape closes and hands focus back to the button that opened the dial.
  // Outside pointer-downs close it too, so a dial left open does not sit over
  // the page catching clicks. Both only run while it is open.
  useEffect(() => {
    if (!dial || !isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      mainButton.current?.focus();
    };
    const onDown = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dial, isOpen]);

  const toggle = (event: ReactMouseEvent) => {
    if (!dial) {
      onClick?.(event);
      return;
    }
    setOpen(!isOpen);
  };

  const fire = (action: FabAction) => (event: ReactMouseEvent) => {
    action.onClick?.(event);
    if (closeOnAction) setOpen(false);
  };

  const node = (
    <div
      {...props}
      ref={node => {
        root.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
      }}
      data-corner={corner}
      data-expand={fan}
      data-open={dial && isOpen ? "" : undefined}
      data-tone={tone}
      data-pinned={pinned ? "" : undefined}
      style={{ ...style, ...(inset !== undefined ? { ["--td-fab-inset" as string]: typeof inset === "number" ? `${inset}px` : inset } : null) }}
      className={cx("td-react-fab", className)}
    >
      {dial ? (
        <div
          className="td-react-fab-actions"
          id={`${base}-actions`}
          role="menu"
          aria-label={label}
          /* Kept in the DOM so it can animate open and shut, but taken out of
             the a11y tree and the tab order while closed, and made
             click-through in CSS — a closed dial is invisible to a screen
             reader and catches no pointer, without a display swap that would
             kill the transition. */
          aria-hidden={!isOpen || undefined}
        >
          {actions.map((action, i) => {
            const child = (
              <IconButton
                key="button"
                role="menuitem"
                tone={action.tone ?? "neutral"}
                icon={action.icon}
                aria-label={action.label}
                tabIndex={isOpen ? undefined : -1}
                {...(action.href ? { href: action.href, renderLink: action.renderLink } : { onClick: fire(action) })}
              />
            );
            return (
              <div
                key={i}
                className="td-react-fab-item"
                /* The stagger: each item leaves a beat after the one before,
                   so the dial unfurls rather than snapping open all at once. */
                style={{ ["--td-fab-i" as string]: i }}
              >
                {labels ? <span className="td-react-fab-label" aria-hidden="true">{action.label}</span> : null}
                {child}
              </div>
            );
          })}
        </div>
      ) : null}
      <IconButton
        ref={mainButton}
        className="td-react-fab-main"
        tone={tone}
        icon={dial && isOpen && openIcon ? openIcon : (icon ?? <AddIcon weight={LAMP_WEIGHT} />)}
        data-rotate={dial && !openIcon ? "" : undefined}
        aria-label={label}
        {...(dial ? { "aria-expanded": isOpen, "aria-controls": `${base}-actions`, "aria-haspopup": "menu" as const } : null)}
        onClick={toggle}
      />
    </div>
  );

  if (!pinned) return node;
  return typeof document === "undefined" ? node : createPortal(node, document.body);
});

