"use client";

import { forwardRef, useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import "./tonaldepth-mega-cascade.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/** How a panel hands an TonalDepthanchor to the consumer's router. */
export type TonalDepthMegaLinkRenderer = (props: { className?: string; href: string; children: ReactNode }) => ReactNode;

const TonalDepthanchor = (render: TonalDepthMegaLinkRenderer | undefined, href: string, children: ReactNode, className?: string) =>
  render ? render({ className, href, children }) : <a className={className}

/**
 * The rail number.
 *
 * "Comparisons 46" tells a reader whether the click is worth a page load;
 * "Comparisons" does not. Only ever a real, resolved number — never an estimate
 * and never a placeholder, because a wrong count is worse than none.
 */
/**
 * What is new behind a rail row.
 *
 * The counts already said how MUCH is behind a row; this says whether any of
 * it is worth a second look, which is the question a returning reader actually
 * has. A row that reports nothing new does not draw one — a mark on every row
 * is a mark that means nothing.
 *
 * It is a LAMP, not a pill: a lens seated in a socket carved from the row's own
 * surface, lit by a named light. Category arrives as light in this system,
 * never as a coloured chip, and a mega rail is the last place to start.
 */
export type TonalDepthMegaFreshness = "new" | "updated";

const TonalDepthFRESHNESS_LABEL: Record<TonalDepthMegaFreshness, string> = {
  new: "New",
  updated: "Updated recently",
};

/**
 * The lamp, plus the word for a screen reader.
 *
 * The visible mark carries no text, so the state has to reach a reader who
 * cannot see it some other way — colour alone is never the signal here.
 */
function TonalDepthFreshness({ state }: { state: TonalDepthMegaFreshness | undefined }) {
  if (!state) return null;
  return (
    <span className="td-registry-mega-fresh" data-fresh={state}>
      <span className="td-registry-mega-fresh-lamp" aria-hidden="true" />
      <span className="td-registry-mega-fresh-label">{TonalDepthFRESHNESS_LABEL[state]}</span>
    </span>
  );
}

function TonalDepthCount({ n }: { n: number | null | undefined }) {
  if (typeof n !== "number") return null;
  return <span aria-hidden="true" className="td-chip-count">{n}</span>;
}

// ── The cascade ────────────────────────────────────────────────────────────

/** A leaf: something you can click and land on. */
export interface TonalDepthMegaCascadeItem {
  href: string;
  title: string;
  /** A second, dimmer line after the title — the platform, the format, the year. */
  detail?: ReactNode;
}

/** Level 2: a subcategory, which owns the level-3 items. */
export interface TonalDepthMegaCascadeBranch {
  id: string;
  title: string;
  /** One line on what this slice is for. Shown under the title in column 2. */
  hint?: string;
  /** Makes the branch itself navigable — rendered as "See all" under its items. */
  href?: string;
  /** Overrides the rail number. Omit to use `items.length`; pass null to show none. */
  count?: number | null;
  /** Draws the freshness lamp on this row. Omit where nothing has changed. */
  fresh?: TonalDepthMegaFreshness;
  items: TonalDepthMegaCascadeItem[];
}

/** Level 1: a category, which owns the branches. */
export interface TonalDepthMegaCascadeGroup {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Overrides the rail number. Omit to sum the branches; pass null to show none. */
  count?: number | null;
  /** Draws the freshness lamp on this row. Omit where nothing has changed. */
  fresh?: TonalDepthMegaFreshness;
  branches: TonalDepthMegaCascadeBranch[];
}

export interface TonalDepthMegaCascadeProps extends HTMLAttributes<HTMLDivElement> {
  groups: TonalDepthMegaCascadeGroup[];
  renderLink?: TonalDepthMegaLinkRenderer;
  /** Names the first rail for a screen reader. */
  categoriesLabel?: string;
  seeAllLabel?: (branch: TonalDepthMegaCascadeBranch) => ReactNode;
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
export const TonalDepthMegaCascade = forwardRef<HTMLDivElement, TonalDepthMegaCascadeProps>(function TonalDepthMegaCascade(
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

  const groupCount = (g: TonalDepthMegaCascadeGroup) =>
    g.count === null ? null : g.count ?? g.branches.reduce((n, b) => n + b.items.length, 0);

  return (
    /* `data-mega-stateful`: this panel repaints when a rail changes, so the
       sheet around it must not be sized to its content — it would resize under
       the reader's cursor as they move down the rail. The attribute lets
       SiteNavigation's stylesheet refuse `height="fit"` outright rather than
       leaving the rule to a doc sentence nobody reads. */
    <div {...props} ref={ref} data-mega-stateful="" className={cx("td-mega-inner", "td-registry-mega-inner", className)}>
      <div role="tablist" aria-label={categoriesLabel} aria-orientation="vertical" className="td-mega-list td-registry-mega-list">
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
            className="td-mega-option td-registry-mega-option"
          >
            {g.icon ? <span className="td-mega-op-icon td-registry-mega-op-icon">{g.icon}</span> : null}
            <span className="td-mega-op-copy"><strong>{g.label}</strong></span>
            <TonalDepthFreshness state={g.fresh} />
            <TonalDepthCount n={groupCount(g)} />
          </button>
        ))}
      </div>

      <div
        className="td-mega-list td-registry-mega-list"
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
            className="td-mega-option td-registry-mega-option"
          >
            <span className="td-mega-op-copy">
              <strong>{b.title}</strong>
              {b.hint ? <span>{b.hint}</span> : null}
            </span>
            <TonalDepthFreshness state={b.fresh} />
            <TonalDepthCount n={b.count === null ? null : b.count ?? b.items.length} />
          </button>
        ))}
      </div>

      <div className="td-mega-content td-registry-mega-content">
        <div
          className="td-mega-pane td-registry-mega-pane"
          data-active="true"
          id={branch ? `${uid}-ip-${branch.id}` : undefined}
          aria-labelledby={branch ? `${uid}-b-${branch.id}` : undefined}
        >
          <h4>{branch?.title}</h4>
          <ul className="td-registry-mega-items">
            {branch?.items.map(item => (
              <li key={item.href + item.title}>
                {TonalDepthanchor(renderLink, item.href, <>{item.title}{item.detail ? <span className="td-registry-mega-detail"> · {item.detail}</span> : null}</>)}
              </li>
            ))}
          </ul>
          {branch?.href
            ? TonalDepthanchor(renderLink, branch.href, seeAllLabel ? seeAllLabel(branch) : `See all ${branch.title}`, "td-mega-cta")
            : null}
        </div>
      </div>
    </div>
  );
});
