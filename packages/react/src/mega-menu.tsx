"use client";

// Two of the three carry selection state, so the module is a client boundary.
import { forwardRef, useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "./utils";
import "./mega-menu.css";

/** How a panel hands an anchor to the consumer's router. */
export type MegaLinkRenderer = (props: { className?: string; href: string; children: ReactNode }) => ReactNode;

const anchor = (render: MegaLinkRenderer | undefined, href: string, children: ReactNode, className?: string) =>
  render ? render({ className, href, children }) : <a className={className} href={href}>{children}</a>;

/**
 * The rail number.
 *
 * "Comparisons 46" tells a reader whether the click is worth a page load;
 * "Comparisons" does not. Only ever a real, resolved number — never an estimate
 * and never a placeholder, because a wrong count is worse than none.
 */
function Count({ n }: { n: number | null | undefined }) {
  if (typeof n !== "number") return null;
  return <span aria-hidden="true" className="td-chip-count">{n}</span>;
}

// ── The cascade ────────────────────────────────────────────────────────────

/** A leaf: something you can click and land on. */
export interface MegaCascadeItem {
  href: string;
  title: string;
  /** A second, dimmer line after the title — the platform, the format, the year. */
  detail?: ReactNode;
}

/** Level 2: a subcategory, which owns the level-3 items. */
export interface MegaCascadeBranch {
  id: string;
  title: string;
  /** One line on what this slice is for. Shown under the title in column 2. */
  hint?: string;
  /** Makes the branch itself navigable — rendered as "See all" under its items. */
  href?: string;
  /** Overrides the rail number. Omit to use `items.length`; pass null to show none. */
  count?: number | null;
  items: MegaCascadeItem[];
}

/** Level 1: a category, which owns the branches. */
export interface MegaCascadeGroup {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Overrides the rail number. Omit to sum the branches; pass null to show none. */
  count?: number | null;
  branches: MegaCascadeBranch[];
}

export interface MegaCascadeProps extends HTMLAttributes<HTMLDivElement> {
  groups: MegaCascadeGroup[];
  renderLink?: MegaLinkRenderer;
  /** Names the first rail for a screen reader. */
  categoriesLabel?: string;
  seeAllLabel?: (branch: MegaCascadeBranch) => ReactNode;
}

/**
 * The three-level cascading panel.
 *
 *     column 1 — categories      (fixed)
 *     column 2 — subcategories   (changes with column 1)
 *     column 3 — items           (changes with column 2)
 *
 * It lays out on the design system's own `.td-mega-inner` grid, which ships
 * exactly those three tracks, so the cascade needs no layout declaration of its
 * own. Every column is a well: chrome is raised and the things you are choosing
 * between are recessed ([[L32]]).
 *
 * **Why three levels and not two.** Two puts the whole leaf set in column 2, so
 * the panel is sized by the biggest category — fourteen topics in one column
 * with no room to say anything about any of them. The third level lets a
 * category be deep without being tall.
 *
 * **Pointer.** Hovering a subcategory switches column 3 at once: a delay on an
 * already-open sheet reads as lag. Column 1 is deliberately click-only —
 * hovering across five rows on the way to column 2 otherwise fires a change on
 * every row the pointer crosses, and the sheet reads as resizing even though
 * its frame never moves.
 *
 * **Selection does not reset on mouse-out.** Snapping back to the first
 * category while the pointer travels toward column 2 is the classic mega-menu
 * bug, and three columns make that journey longer.
 *
 * **Keyboard.** Both rails are roving-tabindex tablists: up and down move
 * within a rail, right steps into the next, left steps back, Home and End jump
 * to the ends, and Tab leaves for the item links.
 */
export const MegaCascade = forwardRef<HTMLDivElement, MegaCascadeProps>(function MegaCascade(
  { groups, renderLink, categoriesLabel = "Categories", seeAllLabel, className, ...props },
  ref,
) {
  const uid = useId();
  const [gi, setGi] = useState(0);
  const [bi, setBi] = useState(0);
  const group = groups[gi] ?? groups[0];
  const branches = group?.branches ?? [];
  const branch = branches[bi] ?? branches[0];
  const groupRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const branchRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Mount is the sheet opening. `preventScroll` because scroll-into-view would
  // nudge the page behind the sheet.
  useEffect(() => { groupRefs.current[0]?.focus({ preventScroll: true }); }, []);

  const pickGroup = (i: number) => { setGi(i); setBi(0); };

  const onRailKey = (event: KeyboardEvent, rail: "group" | "branch", i: number) => {
    const isGroup = rail === "group";
    const count = isGroup ? groups.length : branches.length;
    const go = (next: number) => {
      if (!count) return;
      const n = ((next % count) + count) % count;
      if (isGroup) pickGroup(n); else setBi(n);
      (isGroup ? groupRefs : branchRefs).current[n]?.focus();
    };
    if (event.key === "ArrowDown") { event.preventDefault(); go(i + 1); }
    else if (event.key === "ArrowUp") { event.preventDefault(); go(i - 1); }
    else if (event.key === "Home") { event.preventDefault(); go(0); }
    else if (event.key === "End") { event.preventDefault(); go(count - 1); }
    else if (event.key === "ArrowRight" && isGroup) { event.preventDefault(); branchRefs.current[0]?.focus(); }
    else if (event.key === "ArrowLeft" && !isGroup) { event.preventDefault(); groupRefs.current[gi]?.focus(); }
  };

  const groupCount = (g: MegaCascadeGroup) =>
    g.count === null ? null : g.count ?? g.branches.reduce((n, b) => n + b.items.length, 0);

  return (
    <div {...props} ref={ref} className={cx("td-mega-inner", "td-react-mega-inner", className)}>
      <div role="tablist" aria-label={categoriesLabel} aria-orientation="vertical" className="td-mega-list td-react-mega-list">
        {groups.map((g, i) => (
          <button
            key={g.id}
            ref={el => { groupRefs.current[i] = el; }}
            type="button"
            role="tab"
            id={`${uid}-g-${g.id}`}
            aria-selected={i === gi}
            aria-controls={`${uid}-bp-${g.id}`}
            tabIndex={i === gi ? 0 : -1}
            onClick={() => pickGroup(i)}
            onKeyDown={event => onRailKey(event, "group", i)}
            className="td-mega-option td-react-mega-option"
          >
            {g.icon ? <span className="td-mega-op-icon td-react-mega-op-icon">{g.icon}</span> : null}
            <span className="td-mega-op-copy"><strong>{g.label}</strong></span>
            <Count n={groupCount(g)} />
          </button>
        ))}
      </div>

      <div
        className="td-mega-list td-react-mega-list"
        role="tablist"
        aria-orientation="vertical"
        aria-label={group ? `${group.label} sections` : undefined}
        id={group ? `${uid}-bp-${group.id}` : undefined}
      >
        {branches.map((b, i) => (
          <button
            key={b.id}
            ref={el => { branchRefs.current[i] = el; }}
            type="button"
            role="tab"
            id={`${uid}-b-${b.id}`}
            aria-selected={i === bi}
            aria-controls={`${uid}-ip-${b.id}`}
            tabIndex={i === bi ? 0 : -1}
            onMouseEnter={() => setBi(i)}
            onFocus={() => setBi(i)}
            onKeyDown={event => onRailKey(event, "branch", i)}
            className="td-mega-option td-react-mega-option"
          >
            <span className="td-mega-op-copy">
              <strong>{b.title}</strong>
              {b.hint ? <span>{b.hint}</span> : null}
            </span>
            <Count n={b.count === null ? null : b.count ?? b.items.length} />
          </button>
        ))}
      </div>

      <div className="td-mega-content td-react-mega-content">
        <div
          className="td-mega-pane td-react-mega-pane"
          data-active="true"
          id={branch ? `${uid}-ip-${branch.id}` : undefined}
          aria-labelledby={branch ? `${uid}-b-${branch.id}` : undefined}
        >
          <h4>{branch?.title}</h4>
          <ul className="td-react-mega-items">
            {branch?.items.map(item => (
              <li key={item.href + item.title}>
                {anchor(renderLink, item.href, <>{item.title}{item.detail ? <span className="td-react-mega-detail"> · {item.detail}</span> : null}</>)}
              </li>
            ))}
          </ul>
          {branch?.href
            ? anchor(renderLink, branch.href, seeAllLabel ? seeAllLabel(branch) : `See all ${branch.title}`, "td-mega-cta")
            : null}
        </div>
      </div>
    </div>
  );
});

// ── The two-column tab panel ───────────────────────────────────────────────

export interface MegaTabItem {
  id: string;
  label: string;
  /** The second line in the rail — what this option is, in a few words. */
  hint?: ReactNode;
  icon?: ReactNode;
  /** The pane. Whatever the option is worth saying at length. */
  panel: ReactNode;
}

export interface MegaTabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  items: MegaTabItem[];
  /** Names the rail for a screen reader. */
  label?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
}

/**
 * The two-column panel: a rail of options on the left, one pane on the right.
 *
 * The design system's own mega menu. Reach for it when each option deserves a
 * paragraph — a list of what it includes, a link to the engagement model — and
 * for `MegaCascade` when the options are themselves categories with depth
 * under them.
 *
 * **The pane changes on click, never on hover.** It followed the pointer at
 * first, on the reasoning that one rail has no journey to protect. That is
 * wrong for a different reason: the pane is the panel's whole right-hand side,
 * so a pointer crossing the rail on its way anywhere repaints most of the
 * sheet. A rail that swaps a paragraph under the pointer reads as the menu
 * being unstable, not as it being responsive.
 */
export const MegaTabs = forwardRef<HTMLDivElement, MegaTabsProps>(function MegaTabs(
  { items, label = "Options", value, defaultValue, onValueChange, className, ...props },
  ref,
) {
  const uid = useId();
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? items[0]?.id);
  const current = value ?? uncontrolled;
  const index = Math.max(0, items.findIndex(item => item.id === current));
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const pick = (i: number) => {
    const next = items[i];
    if (!next) return;
    if (value === undefined) setUncontrolled(next.id);
    onValueChange?.(next.id);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const go = (n: number) => {
      const i = ((n % items.length) + items.length) % items.length;
      pick(i); refs.current[i]?.focus();
    };
    if (event.key === "ArrowDown") { event.preventDefault(); go(index + 1); }
    else if (event.key === "ArrowUp") { event.preventDefault(); go(index - 1); }
    else if (event.key === "Home") { event.preventDefault(); go(0); }
    else if (event.key === "End") { event.preventDefault(); go(items.length - 1); }
  };

  return (
    <div {...props} ref={ref} className={cx("td-mega-inner", "td-react-mega-inner", "td-react-mega-inner--two", className)}>
      <div role="tablist" aria-label={label} aria-orientation="vertical" className="td-mega-list td-react-mega-list" onKeyDown={onKeyDown}>
        {items.map((item, i) => (
          <button
            key={item.id}
            ref={el => { refs.current[i] = el; }}
            type="button"
            role="tab"
            id={`${uid}-t-${item.id}`}
            aria-selected={i === index}
            aria-controls={`${uid}-p-${item.id}`}
            tabIndex={i === index ? 0 : -1}
            onClick={() => pick(i)}
            className="td-mega-option td-react-mega-option"
          >
            {item.icon ? <span className="td-mega-op-icon td-react-mega-op-icon">{item.icon}</span> : null}
            <span className="td-mega-op-copy">
              <strong>{item.label}</strong>
              {item.hint ? <span>{item.hint}</span> : null}
            </span>
          </button>
        ))}
      </div>
      <div className="td-mega-content td-react-mega-content">
        {items[index] ? (
          <div
            className="td-mega-pane td-react-mega-pane"
            data-active="true"
            role="tabpanel"
            id={`${uid}-p-${items[index].id}`}
            aria-labelledby={`${uid}-t-${items[index].id}`}
          >
            {items[index].panel}
          </div>
        ) : null}
      </div>
    </div>
  );
});

// ── The card grid ──────────────────────────────────────────────────────────

export interface MegaGridProps extends HTMLAttributes<HTMLDivElement> {
  /** Smallest a card may get before the grid drops a column. Default 180. */
  min?: number;
}

/**
 * Cards in a well.
 *
 * The simplest panel: no rail, no selection, just the things on offer. It is a
 * `.td-mega-content` well rather than a bare grid, which is the part that is
 * easy to get wrong — a panel of cards sitting directly on the sheet has the
 * cards and their housing at the same depth, so nothing reads as contained.
 * Chrome is raised and what you are choosing between is recessed ([[L32]]).
 *
 * Give the cards an `href`. A card in a menu that cannot be clicked is a
 * picture of a menu.
 */
export const MegaGrid = forwardRef<HTMLDivElement, MegaGridProps>(function MegaGrid(
  { min = 180, className, style, children, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} className={cx("td-mega-content", "td-react-mega-content", "td-react-mega-grid", className)} style={{ ...style, ["--td-mega-card-min" as string]: `${min}px` }}>
      {children}
    </div>
  );
});

export interface MegaActionsProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * The CTA rail for a panel's `footer` slot.
 *
 * It belongs in the footer rather than in a column: in a column it spends a
 * third of the sheet on links that never change, and it scrolls away with the
 * content. In the footer it sits outside the scroll area, so it stays reachable
 * however far a column grows and all three columns carry navigation.
 */
export const MegaActions = forwardRef<HTMLDivElement, MegaActionsProps>(function MegaActions(
  { className, ...props }, ref,
) {
  return <div {...props} ref={ref} className={cx("td-mega-head-actions", "td-react-mega-actions", className)} />;
});

// ── The linked columns ─────────────────────────────────────────────────────

export interface MegaLink {
  href: string;
  title: ReactNode;
  /** The line under the title. What the reader gets for the click. */
  detail?: ReactNode;
  /** A filled glyph, in its own tile. */
  icon?: ReactNode;
}

export interface MegaSection {
  id: string;
  /** The column heading — a category in small caps, not a sentence. */
  label: ReactNode;
  links: MegaLink[];
}

export interface MegaColumnsProps extends HTMLAttributes<HTMLDivElement> {
  sections: MegaSection[];
  /**
   * The panel's argument, in the first column — a `MegaFeature`, or anything
   * else that earns the width. Omit it and the sections take the whole sheet.
   */
  feature?: ReactNode;
  /** A rail across the foot: app badges, a standing offer, a last link. */
  footer?: ReactNode;
  renderLink?: MegaLinkRenderer;
}

/**
 * A feature beside titled columns of links — the widest panel, and the one for
 * a menu that has to teach as well as navigate.
 *
 * `MegaCascade` is for depth and `MegaTabs` is for options that need a
 * paragraph each. This is for **breadth**: two or three columns of destinations
 * a reader scans rather than drills into, with one panel on the left making the
 * case for the section as a whole.
 *
 * Every column is a well, and each link is a row that presses. The section
 * headings are marked with a short papaya rule rather than a rule across the
 * column — a full-width line is a divider, and these are labels.
 */
export const MegaColumns = forwardRef<HTMLDivElement, MegaColumnsProps>(function MegaColumns(
  { sections, feature, footer, renderLink, className, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} className={cx("td-react-mega-columns", Boolean(feature) && "td-react-mega-columns--featured", className)}>
      {feature ? <div className="td-react-mega-feature-slot">{feature}</div> : null}
      <div className="td-react-mega-cols">
        {sections.map(section => (
          <section className="td-react-mega-col" key={section.id}>
            <h4 className="td-react-mega-col-label">{section.label}</h4>
            <ul className="td-react-mega-links">
              {section.links.map(link => (
                <li key={link.href + String(link.title)}>
                  {anchor(renderLink, link.href, (
                    <>
                      {link.icon ? <span className="td-mega-op-icon td-react-mega-op-icon">{link.icon}</span> : null}
                      <span className="td-react-mega-link-copy">
                        <strong>{link.title}</strong>
                        {link.detail ? <span>{link.detail}</span> : null}
                      </span>
                    </>
                  ), "td-react-mega-link")}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {footer ? <div className="td-react-mega-footer">{footer}</div> : null}
    </div>
  );
});

// ── The feature panel ──────────────────────────────────────────────────────

export interface MegaFeatureProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Small caps above the title — the question the panel answers. */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** A filled glyph in a tile above the eyebrow. */
  icon?: ReactNode;
  children?: ReactNode;
  /**
   * A numbered sequence, threaded on a rail. For the "here is how this works"
   * a menu sometimes has to carry before anything else makes sense.
   */
  steps?: ReactNode[];
  /** The way in. One control — a panel with two calls to action has none. */
  action?: ReactNode;
}

/**
 * The panel that makes the case, for `MegaColumns`' first column.
 *
 * **It is not a coloured card.** The shape this is drawn from fills the panel
 * with a brand green and sets white on it; filling with the brand colour is the
 * one move this system forbids ([[L11]]). It is a well instead — the argument
 * is content, and content is recessed ([[L32]]) — with papaya arriving as ink
 * on the eyebrow and the step numbers, which is where the emphasis was doing
 * real work in the original.
 *
 * The steps are lamps in sockets on a rail, the same anatomy `Timeline` uses,
 * because a numbered sequence and a phase sequence are the same object read at
 * different scales.
 */
export const MegaFeature = forwardRef<HTMLDivElement, MegaFeatureProps>(function MegaFeature(
  { eyebrow, title, icon, children, steps, action, className, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} className={cx("td-react-mega-feature", className)}>
      {icon ? <span className="td-react-mega-feature-icon">{icon}</span> : null}
      {eyebrow ? <p className="td-react-mega-feature-eyebrow">{eyebrow}</p> : null}
      <h4 className="td-react-mega-feature-title">{title}</h4>
      {children ? <p className="td-react-mega-feature-body">{children}</p> : null}
      {steps?.length ? (
        <ol className="td-react-mega-steps">
          {steps.map((step, index) => (
            <li className="td-react-mega-step" key={index}>
              <span className="td-react-mega-step-n" aria-hidden="true">{index + 1}</span>
              <span className="td-react-mega-step-copy">{step}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {action ? <div className="td-react-mega-feature-action">{action}</div> : null}
    </div>
  );
});
