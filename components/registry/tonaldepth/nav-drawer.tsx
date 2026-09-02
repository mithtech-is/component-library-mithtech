"use client";

import { forwardRef, useCallback, useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode, type SVGProps } from "react";
import { createPortal } from "react-dom";
import "./tonaldepth-nav-drawer.css";
import { TonalDepthFaq } from "./tonaldepth-faq";

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
 * `SiteNavigation` exists to prevent. A grid of cards has no states, so it can
 * hug its content and stay one size for as long as it is open.
 */
export type TonalDepthSiteNavigationMenuHeight = "tall" | "short" | "fit";

/**
 * One destination in the drawer — the small form of a link inside a panel.
 *
 * Structurally the same record as `MegaLink`, and deliberately so: a consumer
 * whose panel is `MegaColumns` passes the identical `sections` array to the
 * panel and to the menu, and the navigation is declared once. The type is
 * restated here rather than imported so `SiteNavigation` keeps no dependency
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
   * The same menu at the drawer's measure, for `TonalDepthNavDrawer`.
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
   * `TonalDepthNavDrawer`.
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

const TonalDepthCLOSE = (
  <CloseIcon weight={LAMP_WEIGHT} aria-hidden="true" />
);

/* ── The drawer ─────────────────────────────────────────────────────────────
   The other half of the same navigation. Everything below owns its sheet, its
   header, its focus trap, its scroll lock and its dismissal IN REACT: the
   design system's vanilla `tonaldepth.js` supplies all five for a static page
   through `data-overlay-open` / `data-overlay-close`, and a consumer that has
   to ship that runtime to get a working menu has a convention and a
   stylesheet, not a component. Nothing here reads or writes an attribute that
   runtime binds — the same rule the bar follows with `data-nav` and
   `.is-open`. */

/**
 * What Tab may land on inside the sheet. Same selector `Dialog` traps with,
 * because it is the same problem.
 */
const TonalDepthDRAWER_FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export interface TonalDepthNavDrawerProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * The SAME array the bar is given.
   *
   * That is the whole point of the component: a consumer declares its
   * navigation once and both breakpoints read it. A `link` becomes a row; a
   * `menu` becomes a disclosure holding that menu's `sections`.
   */
  items: TonalDepthSiteNavigationItem[];
  /** The sheet's heading. */
  title?: ReactNode;
  closeLabel?: string;
  /** Names the navigation landmark inside the sheet. */
  label?: string;
  /** Between the heading and the sections — a search trigger, a "start here" link. */
  header?: ReactNode;
  /** Pinned under the scroll area — the calls to action, the theme toggle. */
  footer?: ReactNode;
  /** Hand your router the anchor, for every link the drawer draws. */
  renderLink?: TonalDepthSiteNavigationLinkRenderer;
  /** One menu open at a time. */
  single?: boolean;
  /** Menu ids expanded on first render. */
  defaultOpen?: string[];
}

/**
 * The navigation, small: a sheet off the edge holding the same `items` the bar
 * holds.
 *
 * ## What it owns, and what it does not
 *
 * It owns the sheet, its heading, the close control, the scrim, the focus
 * trap, the scroll lock, Escape, outside-press and close-on-navigate. It owns
 * nothing about what a menu contains — that is `sections` on the menu, exactly
 * as the bar owns the sheet and `content` owns the panel. The `header` and
 * `footer` slots are yours; put `Button`s in them, with an `href`, the way the
 * panels' footers hold `MegaActions`. An anchor hand-dressed in `td-primary`
 * with a `td-lamp` span inside it is the primary button reimplemented at the
 * call site, and it is what `href` on Button exists to delete.
 *
 * ## The disclosure is `TonalDepthFaq`
 *
 * Not a second disclosure implementation. `TonalDepthFaq` documents itself as "this
 * component with a single item — which it always was", and it already carries
 * the real `button` with `aria-expanded`, the region it controls, and the
 * `hidden` that keeps a closed panel out of in-page search as well as out of
 * the accessibility tree. What a drawer needs on top of that is a MEASURE, and
 * a measure is a stylesheet's job. Two looks for one list would be two things
 * to keep beautiful.
 *
 * A run of adjacent menus becomes one `TonalDepthFaq`, so the seam between two menus is
 * the plate parting rather than two plates meeting; a flat `link` between them
 * splits the run and is drawn as a row, because a link with nothing under it
 * must not wear a chevron.
 *
 * ## A menu with no `sections` is dropped, loudly
 *
 * The alternative is rendering `content` — the desktop panel — into a 400px
 * sheet, and it is worse than it looks: `MegaCascade` and `MegaTabs` are three
 * and two rails of a fixed-height sheet, and `MegaCascade` moves focus to its
 * first category on mount, so a closed disclosure would steal the caret the
 * moment the drawer opened. Dropping the menu is visible in one console line
 * and fixable in one field. Rendering it is a menu that half-works and a focus
 * bug nobody traces back here.
 *
 * ## It is portalled to `document.body`, and it has to be
 *
 * The natural place to write it is inside `SiteNavigation`'s `children`, and
 * the header carries the retract transform — which makes it the containing
 * block for its `position: fixed` descendants and opens a backdrop root. In
 * place, the sheet's `inset` would resolve against the 86px bar and the
 * scrim's glass would compute to `none`. That is the defect the sheet's own
 * scrim shipped with in `0.1.0-alpha.26`; see `Overlays`. Unlike that scrim
 * this one wants to be ABOVE the bar rather than under it, so it goes to the
 * body outright rather than hunting for the header's stacking context.
 */
export const TonalDepthNavDrawer = forwardRef<HTMLDivElement, TonalDepthNavDrawerProps>(function TonalDepthNavDrawer(
  {
    open,
    onOpenChange,
    items,
    title = "Menu",
    closeLabel = "Close menu",
    label = "Site navigation",
    header,
    footer,
    renderLink,
    single = true,
    defaultOpen = [],
    className,
    ...props
  },
  forwardedRef,
) {
  const titleId = useId();
  const [expanded, setExpanded] = useState<string[]>(defaultOpen);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  /* Read through a ref rather than named as a dependency. Named, the effect
     tore down and re-ran on every render where the caller passed a fresh
     arrow — which is the normal way to pass it — and the cleanup restores
     focus. Dialog carries the same note and the same fix. */
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const setSheetRef = useCallback(
    (node: HTMLDivElement | null) => {
      sheetRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  // Focus in, Escape and Tab out, focus back where it came from.
  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement;
    const sheet = sheetRef.current;
    const focusables = () => [...(sheet?.querySelectorAll<HTMLElement>(TonalDepthDRAWER_FOCUSABLE) ?? [])];
    /* Land on the first real control, not on the close button: dismiss is the
       one thing a reader can always reach, and opening a menu with the caret
       on "close" asks them to tab past the exit to reach the first section. */
    const nodes = focusables();
    (nodes.find(node => !node.hasAttribute("data-drawer-close")) ?? nodes[0] ?? sheet)?.focus();

    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onOpenChangeRef.current(false); return; }
      if (event.key !== "Tab" || !sheet) return;
      const current = focusables();
      if (!current.length) { event.preventDefault(); sheet.focus(); return; }
      const first = current[0], last = current[current.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); previousFocus.current?.focus(); };
  }, [open]);

  /*
   * The scroll lock.
   *
   * `overflow: hidden` on the body alone reclaims the scrollbar's gutter,
   * which slides the whole page — and this component's own bar with it — a
   * scrollbar's width sideways at the moment the drawer opens. The gutter is
   * paid back as padding so nothing moves. Both are restored to whatever the
   * page had rather than to a literal, because a consumer may be running a
   * smooth-scroll library that owns `overflow` itself.
   */
  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (gutter > 0) body.style.paddingRight = `${gutter}px`;
    return () => { body.style.overflow = previousOverflow; body.style.paddingRight = previousPadding; };
  }, [open]);

  const close = useCallback(() => onOpenChangeRef.current(false), []);

  /* Following a link closes the drawer, so no row has to know it is inside
     one. Bound on click rather than mousedown for the reason the sheet binds
     it there: unmounting the anchor before its own click had been dispatched
     would stop every link in the drawer navigating. */
  const closeOnNavigate = useCallback((event: { target: EventTarget | null }) => {
    if (event.target instanceof Element && event.target.closest("a")) onOpenChangeRef.current(false);
  }, []);

  if (!open || typeof document === "undefined") return null;

  const row = (link: TonalDepthNavDrawerLink, key: string) => {
    const children = (
      <>
        {link.icon ? <span className="td-registry-navdrawer-icon">{link.icon}</span> : null}
        <span className="td-registry-navdrawer-copy">
          <strong>{link.title}</strong>
          {link.detail ? <span>{link.detail}</span> : null}
        </span>
      </>
    );
    return (
      <li key={key}>
        {renderLink
          ? renderLink({ className: "td-registry-navdrawer-link", href: link.href, children })
          : (
            <a className="td-registry-navdrawer-link" href={link.href} aria-current={link.current ? "page" : undefined}>
              {children}
            </a>
          )}
      </li>
    );
  };

  const body = (menu: TonalDepthSiteNavigationMenu) => (
    <div className="td-registry-navdrawer-panel">
      {(menu.sections ?? []).map(section => (
        <section className="td-registry-navdrawer-section" key={section.id}>
          {section.label ? <h4 className="td-registry-navdrawer-section-label">{section.label}</h4> : null}
          <ul className="td-registry-navdrawer-links">
            {/* Keyed by href AND position, for the reason the bar keys its flat
                links that way: two rows to the same page under different words
                is ordinary in a menu, and React reconciles the pair into one. */}
            {section.links.map((link, index) => row(link, `${link.href}-${index}`))}
          </ul>
        </section>
      ))}
    </div>
  );

  /*
   * Split into runs so DOM order matches `items` order.
   *
   * Adjacent menus share one `TonalDepthFaq` — the plate parting between two disclosures
   * is the grammar, and one plate per menu would put N raised objects inside
   * an already raised sheet. A flat link ends the run: it opens nothing, so it
   * is a row, and a row inside a disclosure list would wear a chevron it
   * cannot honour.
   */
  const runs: Array<{ menus: TonalDepthSiteNavigationMenu[] } | { link: TonalDepthSiteNavigationLink; key: string }> = [];
  items.forEach((item, index) => {
    if (item.kind === "link") { runs.push({ link: item, key: `${item.href}-${index}` }); return; }
    if (!item.sections?.length) {
      // Unconditional rather than dev-only, like IconButton's: it fires only on
      // a real defect, and the package carries no build-time environment flag.
      console.warn(`TonalDepthNavDrawer: menu "${item.id}" has no \`sections\`, so it cannot be drawn at this measure and is omitted.`);
      return;
    }
    const last = runs[runs.length - 1];
    if (last && "menus" in last) last.menus.push(item);
    else runs.push({ menus: [item] });
  });

  return createPortal(
    <>
      <div className="td-registry-navdrawer-scrim" aria-hidden="true" onClick={close} />
      <div
        {...props}
        ref={setSheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        /* No `data-overlay` and no `data-state`. Those are what the vanilla
           runtime hunts for, and its close-all is unscoped — the sheet is
           invisible to it rather than merely resistant to it. `display: flex`
           comes from `.td-registry-navdrawer`, at a specificity that beats
           `.td-drawer`'s `display: none` outright. */
        className={cx("td-drawer", "td-registry-navdrawer", className)}
        onClick={closeOnNavigate}
      >
        <div className="td-registry-navdrawer-head">
          <h2 id={titleId} className="td-registry-navdrawer-title">{title}</h2>
          <button
            type="button"
            data-drawer-close
            className="td-alert-close td-registry-navdrawer-close"
            aria-label={closeLabel}
            onClick={close}
          >
            {TonalDepthCLOSE}
          </button>
        </div>

        {header ? <div className="td-registry-navdrawer-header">{header}</div> : null}

        <nav className="td-registry-navdrawer-body" aria-label={label} data-lenis-prevent>
          {runs.map((run, index) =>
            "menus" in run ? (
              <TonalDepthFaq
                key={`menus-${index}`}
                single={single}
                /* Controlled from here, and every run is handed the SAME array.
                   `TonalDepthFaq` computes the next set from the array it was given, so
                   `single` closes a menu in one run when a menu in another
                   opens — which is what a reader means by "one at a time". */
                value={expanded}
                onValueChange={setExpanded}
                items={run.menus.map(menu => ({ id: menu.id, question: menu.label, answer: body(menu) }))}
              />
            ) : (
              <div className="td-registry-navdrawer-rowslot" key={run.key}>
                {run.link.renderLink
                  ? run.link.renderLink({ className: "td-registry-navdrawer-row", href: run.link.href, children: run.link.label })
                  : renderLink
                    ? renderLink({ className: "td-registry-navdrawer-row", href: run.link.href, children: run.link.label })
                    : (
                      <a
                        className="td-registry-navdrawer-row"
                        href={run.link.href}
                        aria-current={run.link.current ? "page" : undefined}
                      >
                        {run.link.label}
                      </a>
                    )}
              </div>
            ),
          )}
        </nav>

        {footer ? <div className="td-registry-navdrawer-foot">{footer}</div> : null}
      </div>
    </>,
    document.body,
  );
});
