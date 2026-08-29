"use client";

import { forwardRef, useCallback, useEffect, useRef, useState, type HTMLAttributes, type ReactNode, type SVGProps } from "react";
import { CaretDownIcon as ChevronDownIcon } from "@phosphor-icons/react";
import "./tonaldepth-site-navigation.css";

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
 * Renders the anchor for a flat nav link.
 *
 * The navigation owns the class and the aria state; supplying this hands the
 * navigation itself to a framework router (Next's `Link`, React Router's
 * `Link`) so a footer of internal links does not fall back to document loads.
 */
export type TonalDepthSiteNavigationLinkRenderer = (props: { className: string; href: string; children: ReactNode }) => ReactNode;

export interface TonalDepthSiteNavigationLink {
  kind: "link";
  label: ReactNode;
  href: string;
  current?: boolean;
  renderLink?: TonalDepthSiteNavigationLinkRenderer;
}

export interface TonalDepthSiteNavigationMenu {
  kind: "menu";
  id: string;
  /** The trigger's label, in the bar. */
  label: ReactNode;
  /** The panel head's title. */
  title: ReactNode;
  description?: ReactNode;
  /** The head's one link. Supply the element so a router owns it. */
  cta?: ReactNode;
  /** Pinned strip along the bottom of the sheet, outside the scroll area. */
  footer?: ReactNode;
  content: ReactNode;
  ariaLabel?: string;
}

export type TonalDepthSiteNavigationItem = TonalDepthSiteNavigationLink | TonalDepthSiteNavigationMenu;

export interface TonalDepthSiteNavigationProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  label?: string;
  brand: ReactNode;
  items: TonalDepthSiteNavigationItem[];
  actions?: ReactNode;
  /** Retract on the way down, return on the way up. */
  retract?: boolean;
  /** Below this scroll depth the bar is always present. */
  revealFloor?: number;
  closeLabel?: string;
  /** Placed between the bar and the panels — a mobile drawer, say. */
  children?: ReactNode;
}

const TonalDepthCHEVRON = (
  <ChevronDownIcon className="td-navbtn-chevron" weight={LAMP_WEIGHT} aria-hidden="true" />
);

const TonalDepthCLOSE = (
  <CloseIcon weight={LAMP_WEIGHT} aria-hidden="true" />
);

/**
 * The marketing site's primary navigation: a raised pill, sticky, with mega
 * panels beneath it.
 *
 * **There is no separate flat app bar.** This component with link-only items
 * and `retract={false}` IS that bar. `DesktopNavigation` used to be a second
 * component for exactly that shape — the same brand, links and actions with
 * none of the panels, the sticky retract or the router seam — so it was two
 * things to correct whenever the bar changed. Removed 2026-08-29.
 *
 * Three behaviours are structural rather than cosmetic, and changing them
 * changes what the component is for:
 *
 * - **It sticks flush.** `.td-nav-wrap`'s 22px top padding would otherwise
 *   leave a strip for the page to scroll through above the bar. Rather than
 *   collapsing that padding when stuck — which shortens the header's box and
 *   jumps every following element up the page — the sticky `top` is pulled
 *   negative by the same amount, so the padding parks off-screen and the pill
 *   lands against the viewport edge. `top` moves nothing in flow, so there is
 *   no layout shift at the moment it sticks.
 * - **Every panel is one size.** A sheet that resizes as the reader moves
 *   between menus reads as the page twitching. The frame is fixed and the
 *   content scrolls inside it.
 * - **An open panel pins the bar.** Retracting while a menu is open would
 *   take the panel the reader is using with it.
 */
export const TonalDepthSiteNavigation = forwardRef<HTMLElement, TonalDepthSiteNavigationProps>(function TonalDepthSiteNavigation(
  {
    label = "Primary navigation",
    brand,
    items,
    actions,
    retract = true,
    revealFloor = 140,
    closeLabel = "Close menu",
    children,
    className,
    ...props
  },
  ref,
) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [stuck, setStuck] = useState(false);

  const headerRef = useRef<HTMLElement | null>(null);
  const barRef = useRef<HTMLElement | null>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  // The scroll and key handlers bind once, so they would close over the first
  // `openMenu`. A ref lets them read the live value without re-binding.
  const openRef = useRef<string | null>(null);

  useEffect(() => {
    openRef.current = openMenu;
  }, [openMenu]);

  const close = useCallback(() => setOpenMenu(null), []);

  /*
   * Following a link closes the sheet, so panel content never has to know it
   * is inside one.
   *
   * Bound on click rather than mousedown: mousedown would unmount the anchor
   * before its own click had been dispatched, and every link in the panel
   * would silently stop navigating. By the time a click reaches here the
   * anchor has already handled it, so a router's navigation is under way and
   * closing is safe. Buttons are left alone — a panel's own controls, like a
   * column that swaps the pane beside it, are not navigation.
   */
  // Typed by what it reads rather than as React's MouseEvent: importing that
  // name shadows the DOM global the document listeners below are typed with.
  const closeOnNavigate = useCallback((event: { target: EventTarget | null }) => {
    if (event.target instanceof Element && event.target.closest("a")) setOpenMenu(null);
  }, []);

  const setHeaderRef = useCallback(
    (node: HTMLElement | null) => {
      headerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  /*
   * Retract on the way down, return on the way up, and publish --nav-offset.
   *
   * The offset is the contract in-page sticky toolbars position themselves
   * against: it is the bar's live height while the bar is showing and 0 while
   * it is retracted, so a toolbar sits under the chrome rather than under a
   * guess at where the chrome might be.
   */
  useEffect(() => {
    const root = document.documentElement;
    const publish = (isHidden: boolean) => {
      const height = barRef.current?.getBoundingClientRect().height ?? 0;
      root.style.setProperty("--nav-offset", isHidden ? "0px" : `${Math.round(height)}px`);
    };
    publish(false);

    // Trackpads emit long tails of 1-2px events; reacting to those makes the
    // bar flicker between states within a single gesture.
    const JITTER = 6;
    let lastY = window.scrollY;
    let frame = 0;

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = Math.max(0, window.scrollY);
        // Tracked every frame rather than behind the jitter gate: the bar has
        // left the top the moment the page moves at all.
        setStuck(y > 4);
        const delta = y - lastY;
        if (Math.abs(delta) < JITTER) return;
        lastY = y;
        const next = retract && delta > 0 && y > revealFloor && !openRef.current;
        setHidden(next);
        publish(next);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      root.style.removeProperty("--nav-offset");
    };
  }, [retract, revealFloor]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const current = openRef.current;
      if (event.key !== "Escape" || !current) return;
      setOpenMenu(null);
      // Closing without this strands keyboard users wherever they were inside
      // the panel.
      triggerRefs.current.get(current)?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      // mousedown inside the panel must not close it: unmounting the anchor
      // before its click lands stops every link in the sheet navigating.
      if (target instanceof Element && target.closest("[data-mega-panel]")) return;
      if (headerRef.current && !headerRef.current.contains(target)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const menus = items.filter((item): item is TonalDepthSiteNavigationMenu => item.kind === "menu");

  return (
    <header
      {...props}
      ref={setHeaderRef}
      role="banner"
      className={cx("td-nav-wrap", "td-registry-sitenav", className)}
      data-nav-hidden={hidden || undefined}
      data-stuck={stuck || undefined}
      /*
       * The bar is `position: sticky`, which only creates a stacking context
       * once it is actually stuck — so on an unstuck page the scrim painted
       * over it however low its own z-index was. This gives the header a
       * context of its own for as long as a sheet is open, which is what keeps
       * the navigation lit: a menu whose own trigger goes dark is a modal.
       */
      data-nav-open={openMenu || undefined}
    >
      <nav className="td-navbar" aria-label={label} ref={barRef}>
        <div className="td-registry-sitenav-brand">{brand}</div>

        <div className="td-navlinks">
          {items.map((item, index) => {
            if (item.kind === "link") {
              const linkClass = cx("td-navbtn", "td-registry-sitenav-link");
              return (
                /* Keyed by href AND position. An href is not unique — two links
                   to the same place under different words is ordinary in a nav
                   ("Docs" beside "Read the docs"), and React silently
                   reconciles the pair into one, so the second stops updating.
                   The position disambiguates without inventing an id the
                   consumer would have to supply. */
                <span className="td-registry-sitenav-slot" key={`${item.href}-${index}`}>
                  {item.renderLink
                    ? item.renderLink({ className: linkClass, href: item.href, children: item.label })
                    : (
                      <a className={linkClass} href={item.href} aria-current={item.current ? "page" : undefined}>
                        {item.label}
                      </a>
                    )}
                </span>
              );
            }
            const isOpen = openMenu === item.id;
            return (
              <button
                key={item.id}
                type="button"
                /*
                 * No `data-nav`. That is the attribute the design system's
                 * vanilla runtime binds its own static-HTML navbar to
                 * (`.td-navbtn[data-nav]`), and its close-all forces
                 * aria-expanded="false" on every match — so a trigger
                 * announced "collapsed" while this component held the panel
                 * open. React drives this bar end to end and nothing reads
                 * `data-nav`.
                 */
                ref={(node) => {
                  if (node) triggerRefs.current.set(item.id, node);
                  else triggerRefs.current.delete(item.id);
                }}
                onClick={() => setOpenMenu((cur) => (cur === item.id ? null : item.id))}
                aria-expanded={isOpen}
                aria-haspopup="true"
                aria-controls={`${item.id}-mega-panel`}
                className={cx("td-navbtn", "td-registry-sitenav-trigger")}
              >
                {item.label}
                {TonalDepthCHEVRON}
              </button>
            );
          })}
        </div>

        {actions ? <div className="td-nav-right">{actions}</div> : null}
      </nav>

      {children}

      {/* The scrim. An open sheet is a modal moment: the page behind it is out
          of reach, and saying so with glass rather than a flat black wash keeps
          the page legible underneath while making it plainly inactive. It is
          before the panels in the DOM so it paints under them, and it closes
          the sheet on click like an outside press. */}
      {openMenu ? <div className="td-registry-sitenav-scrim" aria-hidden="true" onClick={close} /> : null}

      <div className="td-mega">
        {menus.map((menu) =>
          openMenu === menu.id ? (
            <nav
              key={menu.id}
              id={`${menu.id}-mega-panel`}
              aria-label={menu.ariaLabel ?? `${menu.id} navigation`}
              /*
               * Deliberately no `.is-open`.
               *
               * That class is what the design system's vanilla runtime hunts
               * for: its close-all strips it from every `.td-mega-panel` on any
               * outside click, and its Escape handler only acts when it finds
               * one. It buys nothing here — the only rule behind it is
               * `display: flex`, which `.td-registry-sitenav-panel` already
               * supplies at a specificity that beats `.td-mega-panel`'s
               * `display: none` outright. Leaving it off makes this sheet
               * invisible to that runtime rather than merely resistant to it.
               */
              className="td-mega-panel td-registry-sitenav-panel"
              data-mega-panel=""
              data-lenis-prevent
              onClick={closeOnNavigate}
            >
              <div className="td-mega-head">
                <div className="td-mega-head-text">
                  <strong>{menu.title}</strong>
                  {menu.description ? <p>{menu.description}</p> : null}
                </div>
                {menu.cta}
                <button type="button" onClick={close} aria-label={closeLabel} className="td-mega-close">
                  {TonalDepthCLOSE}
                </button>
              </div>
              <div className="td-registry-sitenav-panelbody">{menu.content}</div>
              {menu.footer}
            </nav>
          ) : null,
        )}
      </div>
    </header>
  );
});
