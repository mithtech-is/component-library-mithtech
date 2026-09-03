"use client";

import { forwardRef, useCallback, useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode, type SVGProps } from "react";
import { createPortal } from "react-dom";
import "./tonaldepth-bottom-nav.css";

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
 * Microsoft's Fluent System Icons, filled weight, copied in because a registry
 * item is one self-contained file. Vendored from `@fluentui/svg-icons` and
 * stripped to `currentColor`, so the component's lamp ladder moves them.
 */
interface FluentIconProps extends SVGProps<SVGSVGElement> {
  /** Edge length. `1em` so the glyph scales with the type it sits beside. */
  size?: number | string;
  /** The fill. `currentColor` so the lamp ramp can move it. */
  color?: string;
  /**
   * Swallowed, not forwarded. Fluent marks are filled by construction, so
   * there is nothing to switch — but call sites pass `weight={LAMP_WEIGHT}`
   * and `weight` is not an SVG attribute, so React would put it on the DOM.
   */
  weight?: string;
  /** Flip horizontally, for a mark that points. */
  mirrored?: boolean;
}

interface FluentGlyphProps extends FluentIconProps {
  viewBox: string;
  d: string;
}

function FluentGlyph({ viewBox, d, size = "1em", color = "currentColor", weight, mirrored, ...props }: FluentGlyphProps) {
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
      <path d={d} />
    </svg>
  );
}

/** `more_horizontal_24_filled` */
function MoreIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0m6 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4" {...props} />;
}

/** One destination on the bar. */
export interface TonalDepthBottomNavItem {
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

export interface TonalDepthBottomNavProps extends Omit<HTMLAttributes<HTMLElement>, "onSelect"> {
  items: TonalDepthBottomNavItem[];
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
   * `bar` is the navigation as furniture: always there, always readable.
   *
   * `dial` is the navigation as an ACTION. It rests as a single circular
   * button and the bar grows out of it when pressed — the same width, the same
   * corner radius, arriving from the circle rather than sliding in behind it.
   *
   * Reach for `dial` when the screen is somebody else's — a map, a photograph,
   * a document being read — and a permanent bar would be spending the bottom
   * of it on chrome. Reach for `bar` when the destinations are the point,
   * because a navigation you have to open is a navigation people forget.
   *
   * The collapsed circle is a real control with a real name; `dialLabel` is
   * what it announces.
   */
  form?: "bar" | "dial";
  /** The collapsed dial's accessible name. */
  dialLabel?: string;
  /** The control that puts the bar back into the dial. */
  collapseLabel?: string;
  /** The dial starts open. Ignored by `bar`, which has no closed state. */
  defaultOpen?: boolean;
  /**
   * Hand your router the anchor, for every destination the bar draws. An
   * item's own `renderLink` wins where it has one, so a consumer supplies its
   * router once.
   */
  renderLink?: (props: { className: string; href: string; children: ReactNode }) => ReactNode;
}

const TonalDepthFOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** The most destinations the bar will draw beside More, whatever `max` says. */
const TonalDepthCEILING = 5;

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
export const TonalDepthBottomNav = forwardRef<HTMLElement, TonalDepthBottomNavProps>(function TonalDepthBottomNav(
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
    form = "bar",
    dialLabel = "Open navigation",
    collapseLabel = "Close",
    defaultOpen = false,
    renderLink,
    className,
    ...props
  },
  ref,
) {
  const base = useId();
  /* The dial's own open/closed, which is a different question to whether the
     More sheet is up: a dial can be open with the sheet shut. `bar` has no
     closed state, so it is always open. */
  const [dialOpen, setDialOpen] = useState(defaultOpen);
  const open = form === "bar" || dialOpen;
  const dialRef = useRef<HTMLButtonElement | null>(null);
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
    const focusables = () => [...(sheet?.querySelectorAll<HTMLElement>(TonalDepthFOCUSABLE) ?? [])];
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

  /* Escape closes the dial, and focus goes back to the circle it came out of.
     A bar that opened on a press has to close on the key that means "undo the
     thing I just opened", or it is a trap.

     Escape is the keyboard's answer and it is NOT the whole answer: the device
     this form is for has no Escape key, which is why the bar also carries a
     visible collapse control and why a press outside it puts the bar away. */
  useEffect(() => {
    if (form !== "dial" || !dialOpen) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape" || isOpen) return;
      setDialOpen(false);
      dialRef.current?.focus();
    };
    const onPointerDown = (event: MouseEvent) => {
      if (isOpen) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (barRef.current?.contains(target) || dialRef.current?.contains(target)) return;
      setDialOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [form, dialOpen, isOpen]);

  /* `max` counts DESTINATIONS, and the bar counts SLOTS — More takes one of
     them when there is an overflow. So a bar that fits everything may draw
     five, and a bar that does not draws four and the control. Either way it is
     five slots, which is the ceiling. */
  /* `dial` spends one slot on the control that puts the bar away again, so the
     ceiling is one lower there. A bar you can open and cannot close is not a
     smaller navigation, it is a navigation with a trapdoor. */
  const ceiling = form === "dial" ? TonalDepthCEILING - 1 : TonalDepthCEILING;
  const overflowed = items.length > Math.min(max, ceiling);
  const room = Math.min(max, overflowed ? ceiling - 1 : ceiling);
  const onBar = items.slice(0, room);
  const rest = items.slice(room);

  const body = (item: TonalDepthBottomNavItem) => (
    <>
      <span className="td-registry-bottomnav-icon" aria-hidden="true">
        {item.icon}
        {item.badge !== undefined && item.badge !== null
          ? <span className="td-registry-bottomnav-badge">{item.badge}</span>
          : null}
      </span>
      <span className="td-registry-bottomnav-label">{item.label}</span>
    </>
  );

  const tab = (item: TonalDepthBottomNavItem) => {
    const cls = cx("td-bottomnav-item", "td-registry-bottomnav-item");
    if (item.href) {
      return (
        <span className="td-registry-bottomnav-slot" key={item.id}>
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

  const row = (item: TonalDepthBottomNavItem) => {
    const cls = "td-registry-bottomnav-row";
    const inner = (
      <>
        <span className="td-registry-bottomnav-rowicon" aria-hidden="true">{item.icon}</span>
        <span className="td-registry-bottomnav-rowlabel">{item.label}</span>
        {item.badge !== undefined && item.badge !== null
          ? <span className="td-registry-bottomnav-rowbadge">{item.badge}</span>
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
      id={`${base}-bar`}
      aria-label={label}
      data-form={form}
      data-open={open ? "" : undefined}
      /* Hidden from the tree AND from tab order while the dial is shut, so a
         keyboard does not walk into destinations nobody can see. `inert` is
         the honest tool; `hidden` would kill the grow animation. */
      inert={!open || undefined}
      className={cx("td-bottomnav", "td-registry-bottomnav", className)}
    >
      {onBar.map(tab)}
      {form === "dial" ? (
        <button
          type="button"
          className={cx("td-bottomnav-item", "td-registry-bottomnav-item", "td-registry-bottomnav-collapse")}
          aria-label={collapseLabel}
          onClick={() => { setDialOpen(false); setOpen(false); dialRef.current?.focus(); }}
        >
          <span className="td-registry-bottomnav-icon" aria-hidden="true"><CloseIcon weight={LAMP_WEIGHT} /></span>
          <span className="td-registry-bottomnav-label">{collapseLabel}</span>
        </button>
      ) : null}
      {overflowed || children ? (
        <button
          ref={moreRef}
          type="button"
          className={cx("td-bottomnav-item", "td-registry-bottomnav-item", "td-registry-bottomnav-more")}
          aria-expanded={isOpen}
          aria-controls={`${base}-sheet`}
          onClick={() => setOpen(!isOpen)}
        >
          <span className="td-registry-bottomnav-icon" aria-hidden="true">
            {isOpen ? <CloseIcon weight={LAMP_WEIGHT} /> : <MoreIcon weight={LAMP_WEIGHT} />}
          </span>
          <span className="td-registry-bottomnav-label">{moreLabel}</span>
        </button>
      ) : null}
    </nav>
  );

  const sheet = isOpen ? (
    <>
      <div className="td-registry-bottomnav-scrim" aria-hidden="true" onClick={close} />
      <div
        ref={sheetRef}
        id={`${base}-sheet`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof moreTitle === "string" ? moreTitle : moreLabel}
        className="td-registry-bottomnav-sheet"
        onClick={collapseOnSelect}
      >
        <div className="td-registry-bottomnav-grip" aria-hidden="true" />
        <div className="td-registry-bottomnav-sheethead">
          <h2 className="td-registry-bottomnav-sheettitle">{moreTitle}</h2>
          <button type="button" className="td-alert-close td-registry-bottomnav-close" aria-label={closeLabel} onClick={close}>
            <CloseIcon weight={LAMP_WEIGHT} aria-hidden="true" />
          </button>
        </div>
        {rest.length ? <ul className="td-registry-bottomnav-rows">{rest.map(row)}</ul> : null}
        {children ? <div className="td-registry-bottomnav-extra">{children}</div> : null}
      </div>
    </>
  ) : null;

  /* The circle the bar grows out of. It is the SAME box as the bar — same
     corner radius resolved to a circle, same plate, same shadow — so the two
     are one object at two sizes rather than a button that reveals a bar. The
     morph is the bar's own width and radius animating; nothing cross-fades. */
  const dial = form === "dial" ? (
    <button
      ref={dialRef}
      type="button"
      className="td-registry-bottomnav-dial"
      aria-label={dialLabel}
      aria-expanded={dialOpen}
      aria-controls={`${base}-bar`}
      data-open={dialOpen ? "" : undefined}
      onClick={() => {
        const next = !dialOpen;
        setDialOpen(next);
        if (!next) setOpen(false);
      }}
    >
      <span className="td-registry-bottomnav-dial-mark" aria-hidden="true">
        {dialOpen ? <CloseIcon weight={LAMP_WEIGHT} /> : <MoreIcon weight={LAMP_WEIGHT} />}
      </span>
    </button>
  ) : null;

  const cluster = (
    <>
      {dial}
      {bar}
    </>
  );

  if (placement === "inline") {
    return (
      <div className="td-registry-bottomnav-root" data-placement="inline" data-form={form}>
        {cluster}
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
      <div className="td-registry-bottomnav-root" data-placement="fixed" data-form={form}>{cluster}</div>
      {sheet}
    </>,
    document.body,
  );
});
