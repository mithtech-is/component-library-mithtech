"use client";

import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode, type SVGProps } from "react";
import { createPortal } from "react-dom";
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

/** `chevron_down_24_filled` */
function ChevronDownIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M4.3 8.3a1 1 0 0 1 1.4 0l6.3 6.29 6.3-6.3a1 1 0 1 1 1.4 1.42l-7 7a1 1 0 0 1-1.4 0l-7-7a1 1 0 0 1 0-1.42" {...props} />;
}

/** `navigation_24_filled` */
function ListIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M3 17h18a1 1 0 0 1 .12 2H3a1 1 0 0 1-.12-2zh18zm0-6h18a1 1 0 0 1 .12 2H3a1 1 0 0 1-.12-2zh18zm0-6h18a1 1 0 0 1 .12 2H3a1 1 0 0 1-.12-2zh18z" {...props} />;
}

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

/**
 * How wide this menu's sheet is drawn.
 *
 * A NAMED size rather than a number, so a nav cannot accumulate twelve
 * near-identical widths that nobody can tell apart.
 *
 * - `full` — the sheet's own measure, wider than the bar. The default, and
 *   what a three-column cascade needs.
 * - `wide` — the bar's measure. A two-column panel under a bar-width sheet.
 * - `content` — as wide as the content wants, capped at `full`. For a grid of
 *   a known number of cards, where `full` leaves void either side.
 */
export type TonalDepthSiteNavigationMenuWidth = "full" | "wide" | "content";

/**
 * How tall this menu's sheet is drawn.
 *
 * - `tall` — the fixed 608px sheet. The default.
 * - `short` — a fixed 420px sheet, for a panel with one or two rows in it.
 * - `fit` — the height the content actually needs.
 *
 * **`fit` is only for a panel with no internal state**, and that is the whole
 * of the rule. A panel that changes what it shows — a cascade whose first rail
 * repaints the other two — must never be `fit`, because then the sheet resizes
 * under the reader's cursor as they move down a rail, which is the thing
 * `TonalDepthSiteNavigation` exists to prevent. A grid of cards has no states, so it can
 * hug its content and stay one size for as long as it is open.
 */
export type TonalDepthSiteNavigationMenuHeight = "tall" | "short" | "fit";

/**
 * One destination in the drawer — the small form of a link inside a panel.
 *
 * Structurally the same record as `MegaLink`, and deliberately so: a consumer
 * whose panel is `MegaColumns` passes the identical `sections` array to the
 * panel and to the menu, and the navigation is declared once. The type is
 * restated here rather than imported so `TonalDepthSiteNavigation` keeps no dependency
 * on the mega-menu module — TypeScript is structural, so the assignment works
 * either way and the coupling would only cost a registry item its
 * self-containment.
 */
export interface TonalDepthNavDrawerLink {
  href: string;
  title: ReactNode;
  /** A second, dimmer line under the title. */
  detail?: ReactNode;
  /** A filled glyph, in its own tile. */
  icon?: ReactNode;
  current?: boolean;
}

/** A labelled block of destinations inside one menu's disclosure. */
export interface TonalDepthNavDrawerSection {
  id: string;
  /** A heading in small caps over the rows. Omit for an unlabelled block. */
  label?: ReactNode;
  links: TonalDepthNavDrawerLink[];
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
  /**
   * A control in the panel head, between the title and the CTA — in practice a
   * `SearchBar` scoped to this panel's own corpus.
   *
   * The panel is the right scope for a field: it fronts one section, and a
   * reader who already knows the word they want should not have to walk a
   * three-level rail to reach it. The matching is yours, as it is everywhere
   * `SearchBar` is used; this is the slot and the placement.
   *
   * **Pass `shortcut={false}`.** A field inside a menu that binds a global key
   * collides with the product's own command palette, and the menu's copy wins
   * because it mounted last — so ⌘K opens a palette full of one section's
   * links. A component that binds at `document` has this the moment there are
   * two of it on a page.
   */
  search?: ReactNode;
  /** Pinned strip along the bottom of the sheet, outside the scroll area. */
  footer?: ReactNode;
  content: ReactNode;
  /**
   * The same menu at the drawer's measure, for `NavDrawer`.
   *
   * `content` cannot serve both. It is a `ReactNode` on purpose — the bar owns
   * the sheet and owns nothing about what is inside one — so the library
   * cannot read a menu's destinations out of it, and a three-column
   * `MegaCascade` rendered into a 400px drawer would be a rail with no room
   * to be a rail. This is the same menu said as data, which both breakpoints
   * can project: `MegaColumns` takes this array verbatim as its `sections`,
   * and `megaCascadeSections` derives it from a cascade's own `groups`, so a
   * consumer still declares its navigation ONCE.
   *
   * A menu that omits it is dropped from the drawer, with a warning — see
   * `NavDrawer`.
   */
  sections?: TonalDepthNavDrawerSection[];
  ariaLabel?: string;
  /**
   * The sheet's width for this menu alone. Defaults to `full`, so a menu that
   * says nothing is drawn exactly as it was.
   */
  width?: TonalDepthSiteNavigationMenuWidth;
  /**
   * The sheet's height for this menu alone. Defaults to `tall`, so a menu that
   * says nothing is drawn exactly as it was. Read `TonalDepthSiteNavigationMenuHeight`
   * before reaching for `fit`.
   */
  height?: TonalDepthSiteNavigationMenuHeight;
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
  /**
   * Opens the small-screen drawer, and switches the bar to its compact form.
   *
   * Passing it puts a burger at the end of the bar and, below 900px, hides the
   * row of triggers the burger replaces — the two halves of one decision, so a
   * consumer cannot ship a bar with both or with neither. Omitting it leaves
   * the bar exactly as it was at every width, which is why the responsive rule
   * is gated on this prop rather than applied to every navigation.
   *
   * The burger is a plain control: hand it `NavDrawer`'s setter and nothing
   * else. Where a consumer wants its own trigger instead, leave this off and
   * drive `NavDrawer`'s `open` from wherever it likes.
   */
  onMenuOpen?: () => void;
  /** Screen-reader name for that burger. */
  menuLabel?: string;
  /** Placed between the bar and the panels — the drawer goes here. */
  children?: ReactNode;
}

const TonalDepthCHEVRON = (
  <ChevronDownIcon className="td-navbtn-chevron" weight={LAMP_WEIGHT} aria-hidden="true" />
);

const TonalDepthBURGER = (
  <ListIcon weight={LAMP_WEIGHT} aria-hidden="true" />
);

const TonalDepthCLOSE = (
  <CloseIcon weight={LAMP_WEIGHT} aria-hidden="true" />
);

/**
 * Where the scrim has to be rendered so it lands UNDER the bar and the sheet
 * and OVER the page.
 *
 * `document.body` is the obvious answer and it is wrong on its own, because it
 * only holds while nothing between the header and the body creates a stacking
 * context. The moment something does — `position: relative; z-index: 3` is
 * enough, and that is an ordinary thing for a page to have — the whole
 * component is sealed inside it at that context's z-index, and a body-level
 * scrim at 30 paints over the bar AND the open sheet however high the header's
 * own z-index is. The sheet is then blurred and unclickable, which reads as
 * "the mega menu is broken" and is invisible to any amount of reading of this
 * component. It cost an hour on the docs site, whose specimen well raises
 * itself to `z-index: 3` on `:focus-within` — that is, whenever a trigger is
 * pressed.
 *
 * So the scrim joins the header's own stacking context instead: walk up to the
 * nearest ancestor that creates one and portal into that. There the ordering
 * is decided by z-index between siblings, which is what the numbers in
 * `site-navigation.css` were written to do, and no ancestor can overrule it.
 *
 * Two ancestors are refused on the way up, and both for the same reason the
 * scrim is portalled out of the header at all: `transform`, `filter`,
 * `perspective`, `backdrop-filter`, `contain` and `will-change` make an element
 * the containing block for `position: fixed` descendants — so `inset: 0` would
 * resolve against that box rather than the viewport — and they open a backdrop
 * root, which leaves `backdrop-filter` with nothing painted behind it to sample
 * and computes it to `none`. Neither failure reports. Hitting one of those, the
 * scrim goes to `document.body` to escape it, which is the best available
 * answer: a transformed ancestor breaks viewport-fixed positioning for anything
 * inside it, this component included.
 */
function TonalDepthscrimHostFor(header: HTMLElement | null): HTMLElement | null {
  if (typeof document === "undefined") return null;
  /* Engines that do not implement a property return "" for it rather than its
     initial value — jsdom returns nothing for `filter` and `backdrop-filter` —
     so an empty string has to read as UNSET. Comparing against "none" alone
     would make every ancestor look transformed and stop the walk at the first
     one. */
  const set = (value: string | null | undefined) =>
    Boolean(value) && value !== "none" && value !== "normal" && value !== "auto";

  for (let node = header?.parentElement ?? null; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    // Containing block for fixed descendants, and a new backdrop root. Escape it.
    if (set(style.transform) || set(style.translate) || set(style.rotate) || set(style.scale)) return document.body;
    if (set(style.perspective) || set(style.filter) || set(style.backdropFilter)) return document.body;
    if (set(style.containerType) || set(style.willChange)) return document.body;
    if (/\b(paint|layout|strict|content)\b/.test(style.contain ?? "")) return document.body;
    // A stacking context the header is sealed inside. Join it.
    if (style.position !== "static" && set(style.zIndex)) return node;
    if (style.isolation === "isolate" || set(style.mixBlendMode)) return node;
    if (style.opacity !== "" && Number(style.opacity) < 1) return node;
  }
  return document.body;
}

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
    onMenuOpen,
    menuLabel = "Open navigation menu",
    children,
    className,
    ...props
  },
  ref,
) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [scrimHost, setScrimHost] = useState<HTMLElement | null>(null);

  const headerRef = useRef<HTMLElement | null>(null);
  const barRef = useRef<HTMLElement | null>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  // The scroll and key handlers bind once, so they would close over the first
  // `openMenu`. A ref lets them read the live value without re-binding.
  const openRef = useRef<string | null>(null);

  useEffect(() => {
    openRef.current = openMenu;
  }, [openMenu]);

  /* Resolved per open rather than once on mount: a page can gain a stacking
     context between two openings, and the docs' own specimen well does exactly
     that — it raises itself on `:focus-within`, which is the press that opens
     the sheet. Layout effect so the host is known before the browser paints
     the sheet, or the scrim's fade-in starts a frame late. */
  useLayoutEffect(() => {
    setScrimHost(openMenu ? TonalDepthscrimHostFor(headerRef.current) : null);
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
      /* The bar has a small form only once it has somewhere to send a reader
         at that size. Without it the trigger row keeps its old behaviour at
         every width, so an existing consumer renders unchanged. */
      data-nav-compact={onMenuOpen ? "" : undefined}
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

        {actions || onMenuOpen ? (
          <div className="td-nav-right">
            {actions}
            {/* Last in the rail, and the bar's own rather than the consumer's:
                the burger and the hidden trigger row are one decision, and a
                consumer that has to place it also has to know which class
                hides what — which is how `.td-nav-burger` came to be invented
                downstream in the first place. */}
            {onMenuOpen ? (
              <button
                type="button"
                className="td-iconbtn td-registry-sitenav-burger"
                aria-label={menuLabel}
                aria-haspopup="dialog"
                onClick={onMenuOpen}
              >
                {TonalDepthBURGER}
              </button>
            ) : null}
          </div>
        ) : null}
      </nav>

      {children}

      {/* The scrim. An open sheet is a modal moment: the page behind it is out
          of reach, and saying so with glass rather than a flat black wash keeps
          the page legible underneath while making it plainly inactive. It
          closes the sheet on click, like an outside press.

          **It is portalled out of the header, and that is load-bearing.** The
          header takes a `transform` for the retract, and a transformed element
          becomes the containing block for its `position: fixed` descendants —
          so rendered in place the scrim's `inset: 0` resolved against the 86px
          bar instead of the viewport and covered only the bar. The same
          transform opens a new backdrop root, which left `backdrop-filter`
          with nothing painted behind it to sample, so it computed to `none`
          and there was no glass at all. Both symptoms, one cause; see the
          overlay rule in the docs. Where it lands is `TonalDepthscrimHostFor`'s answer:
          the header's own stacking context where the page has given it one, so
          the z-index ordering in the stylesheet cannot be overruled from
          outside, and `document.body` otherwise. */}
      {openMenu && scrimHost
        ? createPortal(<div className="td-registry-sitenav-scrim" aria-hidden="true" onClick={close} />, scrimHost)
        : null}

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
              /* Per-menu sizing. Written as data attributes rather than inline
                 custom properties so the sizes are a closed set the stylesheet
                 owns: a consumer picks one of three, and cannot invent a
                 fourth by passing a number. */
              data-mega-width={menu.width ?? "full"}
              data-mega-height={menu.height ?? "tall"}
              data-lenis-prevent
              onClick={closeOnNavigate}
            >
              <div className="td-mega-head">
                <div className="td-mega-head-text">
                  <strong>{menu.title}</strong>
                  {menu.description ? <p>{menu.description}</p> : null}
                </div>
                {menu.search ? <div className="td-registry-sitenav-search">{menu.search}</div> : null}
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
