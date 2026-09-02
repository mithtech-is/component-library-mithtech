"use client";

import { forwardRef, useCallback, useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "./utils";
import { MoreIcon, CloseIcon, LAMP_WEIGHT } from "./icons";
import "./bottom-nav.css";

/** One destination on the bar. */
export interface BottomNavItem {
  id: string;
  label: ReactNode;
  /**
   * A filled glyph. The bar is read as icons with a word under them, not as a
   * row of text — an outline mark at 18px reads as a smudge, and the lamp
   * pattern ([[L15]]) needs solid alpha to glow.
   */
  icon: ReactNode;
  href?: string;
  current?: boolean;
  /** A count over the icon. Omit it rather than passing 0 — a badge reading
   *  zero is a mark that means nothing. */
  badge?: ReactNode;
  /** For a destination that is an action rather than a page. */
  onSelect?: () => void;
  /** Hand your router the anchor. Without it every tap is a document load. */
  renderLink?: (props: { className: string; href: string; children: ReactNode }) => ReactNode;
}

export interface BottomNavProps extends Omit<HTMLAttributes<HTMLElement>, "onSelect"> {
  items: BottomNavItem[];
  /**
   * How many DESTINATIONS ride the bar before the rest go behind **More**.
   *
   * Five slots is the ceiling however high this is set, and **More** takes one
   * of them whenever there is an overflow — so a bar that fits everything may
   * draw five destinations, and a bar that does not draws four and the
   * control. The ceiling is enforced rather than advised: a 360px bar divided
   * six ways gives each destination 56px, which is under the tap minimum once
   * the padding comes out and leaves no room for a word under the icon. A bar
   * you cannot hit is not a navigation.
   */
  max?: number;
  /** Names the landmark for a screen reader. */
  label?: string;
  /** The overflow control's word. */
  moreLabel?: string;
  /** The expanded sheet's heading. */
  moreTitle?: ReactNode;
  closeLabel?: string;
  /** Extra content under the overflow rows — a sign-in block, a theme toggle. */
  children?: ReactNode;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /**
   * `fixed` pins the bar to the bottom of the viewport, which is what a bottom
   * navigation is. `inline` leaves it in flow — for a specimen, a device frame,
   * or a page that pins it itself.
   */
  placement?: "fixed" | "inline";
  /**
   * Hand your router the anchor, for every destination the bar draws. An
   * item's own `renderLink` wins where it has one, so a consumer supplies its
   * router once.
   */
  renderLink?: (props: { className: string; href: string; children: ReactNode }) => ReactNode;
}

const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** The most destinations the bar will draw beside More, whatever `max` says. */
const CEILING = 5;

/**
 * The bottom bar: a handful of destinations under the thumb, and the rest
 * behind one control that expands upward.
 *
 * ## Why this and not the drawer
 *
 * `NavDrawer` is the whole navigation, reached deliberately: you tap a burger
 * at the top of the screen and a sheet covers the page. This is the opposite
 * trade — three or four destinations always present, always one tap away, at
 * the bottom of the screen where a thumb actually reaches. A site with a deep
 * IA wants the drawer; an app with four sections a person moves between all
 * day wants this. Many want both, and they compose: the drawer is the
 * *directory*, the bar is the *shortcuts*.
 *
 * ## Collapsed is the resting state
 *
 * The bar IS the collapsed form, and **More** expands it upward into a sheet
 * holding everything that did not fit. The sheet is anchored to the bar rather
 * than covering the page from the top, because the control that opened it is
 * at the bottom and a panel that opens away from its own trigger reads as an
 * unrelated thing appearing.
 *
 * Expanding is not modal in the way a dialog is — it is one level of a
 * navigation opening — but it still takes the focus, Escape and the scrim,
 * because a panel over the page that the keyboard cannot reach or leave is
 * worse than no panel.
 *
 * ## It is portalled, and it publishes its height
 *
 * `position: fixed` resolves against the nearest transformed ancestor rather
 * than the viewport, so a bar rendered inside a page that animates anything
 * would pin itself to that box instead of the screen — the defect
 * `SiteNavigation`'s scrim shipped with. It goes to `document.body`.
 *
 * It also publishes `--bottom-nav-offset`, the live height of the bar, so a
 * page can pad its last element clear of it. Without that the bar covers the
 * end of every scroll, which is the single most common way this pattern is
 * got wrong.
 */
export const BottomNav = forwardRef<HTMLElement, BottomNavProps>(function BottomNav(
  {
    items,
    max = 4,
    label = "Primary",
    moreLabel = "More",
    moreTitle = "Everything else",
    closeLabel = "Close menu",
    children,
    expanded,
    defaultExpanded = false,
    onExpandedChange,
    placement = "fixed",
    renderLink,
    className,
    ...props
  },
  ref,
) {
  const base = useId();
  const [uncontrolled, setUncontrolled] = useState(defaultExpanded);
  const isOpen = expanded ?? uncontrolled;
  const barRef = useRef<HTMLElement | null>(null);
  const moreRef = useRef<HTMLButtonElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onExpandedChange);
  onChangeRef.current = onExpandedChange;

  const setBarRef = useCallback(
    (node: HTMLElement | null) => {
      barRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const setOpen = useCallback((next: boolean) => {
    if (expanded === undefined) setUncontrolled(next);
    onChangeRef.current?.(next);
  }, [expanded]);

  const close = useCallback(() => setOpen(false), [setOpen]);

  /*
   * The bar's live height, for a page to pad against. Published as a custom
   * property rather than returned, because the element that needs it is almost
   * never the one that rendered this — it is the page's own last section, and
   * threading a number down to it is a prop drilled through the whole tree.
   *
   * Measured rather than assumed: the bar grows with the safe-area inset on a
   * notched phone, and a hard-coded 64px leaves the last row half-covered
   * there and floating here.
   */
  useEffect(() => {
    if (placement !== "fixed") return;
    const root = document.documentElement;
    const publish = () => {
      const height = barRef.current?.getBoundingClientRect().height ?? 0;
      root.style.setProperty("--bottom-nav-offset", `${Math.round(height)}px`);
    };
    publish();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(publish);
    if (barRef.current) observer?.observe(barRef.current);
    window.addEventListener("resize", publish);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", publish);
      root.style.removeProperty("--bottom-nav-offset");
    };
  }, [placement]);

  // Focus into the sheet, Escape and Tab out, focus back on the control.
  useEffect(() => {
    if (!isOpen) return;
    const sheet = sheetRef.current;
    const focusables = () => [...(sheet?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
    focusables()[0]?.focus();
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); return; }
      if (event.key !== "Tab" || !sheet) return;
      const current = focusables();
      if (!current.length) return;
      const first = current[0], last = current[current.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); moreRef.current?.focus(); };
  }, [isOpen, setOpen]);

  /* Selecting anything collapses the sheet, so no row has to know it is inside
     one. Bound on click rather than mousedown: unmounting the anchor before
     its own click had been dispatched would stop every row navigating. */
  const collapseOnSelect = useCallback((event: { target: EventTarget | null }) => {
    if (event.target instanceof Element && event.target.closest("a,button")) setOpen(false);
  }, [setOpen]);

  /* `max` counts DESTINATIONS, and the bar counts SLOTS — More takes one of
     them when there is an overflow. So a bar that fits everything may draw
     five, and a bar that does not draws four and the control. Either way it is
     five slots, which is the ceiling. */
  const overflowed = items.length > Math.min(max, CEILING);
  const room = Math.min(max, overflowed ? CEILING - 1 : CEILING);
  const onBar = items.slice(0, room);
  const rest = items.slice(room);

  const body = (item: BottomNavItem) => (
    <>
      <span className="td-react-bottomnav-icon" aria-hidden="true">
        {item.icon}
        {item.badge !== undefined && item.badge !== null
          ? <span className="td-react-bottomnav-badge">{item.badge}</span>
          : null}
      </span>
      <span className="td-react-bottomnav-label">{item.label}</span>
    </>
  );

  const tab = (item: BottomNavItem) => {
    const cls = cx("td-bottomnav-item", "td-react-bottomnav-item");
    if (item.href) {
      return (
        <span className="td-react-bottomnav-slot" key={item.id}>
          {(item.renderLink ?? renderLink)
            ? (item.renderLink ?? renderLink)!({ className: cls, href: item.href, children: body(item) })
            : (
              <a className={cls} href={item.href} aria-current={item.current ? "page" : undefined} onClick={item.onSelect}>
                {body(item)}
              </a>
            )}
        </span>
      );
    }
    return (
      <button key={item.id} type="button" className={cls} aria-current={item.current ? "page" : undefined} onClick={item.onSelect}>
        {body(item)}
      </button>
    );
  };

  const row = (item: BottomNavItem) => {
    const cls = "td-react-bottomnav-row";
    const inner = (
      <>
        <span className="td-react-bottomnav-rowicon" aria-hidden="true">{item.icon}</span>
        <span className="td-react-bottomnav-rowlabel">{item.label}</span>
        {item.badge !== undefined && item.badge !== null
          ? <span className="td-react-bottomnav-rowbadge">{item.badge}</span>
          : null}
      </>
    );
    if (item.href) {
      return (
        <li key={item.id}>
          {(item.renderLink ?? renderLink)
            ? (item.renderLink ?? renderLink)!({ className: cls, href: item.href, children: inner })
            : <a className={cls} href={item.href} aria-current={item.current ? "page" : undefined} onClick={item.onSelect}>{inner}</a>}
        </li>
      );
    }
    return (
      <li key={item.id}>
        <button type="button" className={cls} aria-current={item.current ? "page" : undefined} onClick={item.onSelect}>{inner}</button>
      </li>
    );
  };

  const bar = (
    <nav
      {...props}
      ref={setBarRef}
      aria-label={label}
      className={cx("td-bottomnav", "td-react-bottomnav", className)}
    >
      {onBar.map(tab)}
      {overflowed || children ? (
        <button
          ref={moreRef}
          type="button"
          className={cx("td-bottomnav-item", "td-react-bottomnav-item", "td-react-bottomnav-more")}
          aria-expanded={isOpen}
          aria-controls={`${base}-sheet`}
          onClick={() => setOpen(!isOpen)}
        >
          <span className="td-react-bottomnav-icon" aria-hidden="true">
            {isOpen ? <CloseIcon weight={LAMP_WEIGHT} /> : <MoreIcon weight={LAMP_WEIGHT} />}
          </span>
          <span className="td-react-bottomnav-label">{moreLabel}</span>
        </button>
      ) : null}
    </nav>
  );

  const sheet = isOpen ? (
    <>
      <div className="td-react-bottomnav-scrim" aria-hidden="true" onClick={close} />
      <div
        ref={sheetRef}
        id={`${base}-sheet`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof moreTitle === "string" ? moreTitle : moreLabel}
        className="td-react-bottomnav-sheet"
        onClick={collapseOnSelect}
      >
        <div className="td-react-bottomnav-grip" aria-hidden="true" />
        <div className="td-react-bottomnav-sheethead">
          <h2 className="td-react-bottomnav-sheettitle">{moreTitle}</h2>
          <button type="button" className="td-alert-close td-react-bottomnav-close" aria-label={closeLabel} onClick={close}>
            <CloseIcon weight={LAMP_WEIGHT} aria-hidden="true" />
          </button>
        </div>
        {rest.length ? <ul className="td-react-bottomnav-rows">{rest.map(row)}</ul> : null}
        {children ? <div className="td-react-bottomnav-extra">{children}</div> : null}
      </div>
    </>
  ) : null;

  if (placement === "inline") {
    return (
      <div className="td-react-bottomnav-root" data-placement="inline">
        {bar}
        {typeof document === "undefined" ? null : createPortal(sheet, document.body)}
      </div>
    );
  }

  /* Fixed AND portalled. `position: fixed` resolves against the nearest
     transformed ancestor rather than the viewport, so a bar rendered inside a
     page that animates anything pins itself to that box — the defect the mega
     sheet's scrim shipped with in 0.1.0-alpha.26. The body is the only place
     the viewport is reliably the viewport. */
  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      <div className="td-react-bottomnav-root" data-placement="fixed">{bar}</div>
      {sheet}
    </>,
    document.body,
  );
});
