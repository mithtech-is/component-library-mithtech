"use client";

import { forwardRef, useCallback, useId, useRef, useState, type ButtonHTMLAttributes, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import "./tonaldepth-side-tabs.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * The filament's colour when lit. These are the system's categories — a
 * filament that took any hex would be a filament that could break the palette
 * ([[L11]]: colour is category).
 */
export type TonalDepthFilamentTone = "green" | "brand" | "accent" | "error";

/** Which edge the filament runs along. */
export type TonalDepthFilamentEdge = "start" | "top";

/** The housing's size. `sm` is the collapsed-rail form. */
export type TonalDepthFilamentSize = "sm" | "md";

export interface TonalDepthFilamentButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** The label. Omit for the icon-only rail form, and pass `aria-label` instead. */
  label?: ReactNode;
  /** A filled glyph. An outline cannot read as lit. */
  icon?: ReactNode;
  /**
   * Lit and held — the tab whose panel is open. This is the fourth state, and
   * it is distinct from hover and from press: the filament stays on when the
   * pointer leaves.
   */
  active?: boolean;
  tone?: TonalDepthFilamentTone;
  /**
   * `start` runs the filament down the inline-start edge — the vertical tab.
   * `top` lays it along the top edge, for a horizontal bar.
   */
  edge?: TonalDepthFilamentEdge;
  size?: TonalDepthFilamentSize;
  /**
   * The colour this filament lights, overriding the tone's own. Any CSS
   * colour — the glow is mixed from it at the strengths in `--td-filament-*`,
   * so a custom colour still rides the same four-state ladder.
   */
  glow?: string;
}

/**
 * A tab that reports its state with a lit filament rather than a fill.
 *
 * The filament is the design system's lamp stretched along one edge: off at
 * rest, dim on hover, full when the tab is active, and brightest for the
 * moment of the press. Four states, one strip.
 *
 * The housing takes the depth ladder and the label holds its ink throughout —
 * only the filament changes colour ([[L15]]). Nothing is ever filled with the
 * tone; the colour arrives as light on the strip and, when active, as ink on
 * the glyph.
 */
export const TonalDepthFilamentButton = forwardRef<HTMLButtonElement, TonalDepthFilamentButtonProps>(function TonalDepthFilamentButton(
  { label, icon, active = false, tone = "green", edge = "start", size = "md", glow, className, type, ...props },
  ref,
) {
  const hasLabel = label !== undefined && label !== null;
  if (!hasLabel && !props["aria-label"] && !props["aria-labelledby"]) {
    // An icon-only rail button has no text node, so without one of these it
    // reaches a screen reader unnamed. Matches IconButton's contract.
    console.warn("TonalDepthFilamentButton: an icon-only button needs `aria-label` (or `aria-labelledby`), or a `label`.");
  }
  return (
    <button
      {...props}
      ref={ref}
      type={type ?? "button"}
      // `aria-pressed` is what makes the held state real for a screen reader;
      // the lit filament is only its visual half.
      aria-pressed={active}
      data-active={active ? "true" : undefined}
      style={glow ? { ...props.style, ["--td-filament-ink" as string]: glow } : props.style}
      className={cx(
        "td-registry-filament",
        `td-registry-filament--${edge}`,
        `td-registry-filament--${size}`,
        `td-registry-filament--${tone}`,
        active && "td-registry-filament--on",
        !hasLabel && "td-registry-filament--bare",
        className,
      )}
    >
      {/* Three parts, and two of them move independently — the anatomy of
          `.td-mega-option`, which is the design this component is a component
          OF ([[L33]]).

          The STRIP is the filament: it never moves or grows, it only lights.
          The ROW is one button: it takes the depth ladder and sinks as it is
          reached for. The TILE is the other: it rides ABOVE the row at rest
          and sinks with it, keeping a shadow in every state so it always reads
          as its own control inside the row — and its glyph is the lamp, which
          lights by COLOUR alone. No glow behind it: the housing never glows
          and the glyph carries no shadow. */}
      <span className="td-registry-filament-strip" aria-hidden="true" />
      {icon ? <span className="td-registry-filament-icon" aria-hidden="true">{icon}</span> : null}
      {hasLabel ? <span className="td-registry-filament-label">{label}</span> : null}
    </button>
  );
});

export interface TonalDepthSideTabItem {
  /** Stable key. Also what `value` / `onValueChange` speak in. */
  id: string;
  label: ReactNode;
  /**
   * The accessible name when `rail` hides the label. Only needed when `label`
   * is not a plain string — a rail tab has no visible text to fall back on.
   */
  ariaLabel?: string;
  /** A filled glyph. Required for `rail`, which has no room for a label. */
  icon?: ReactNode;
  panel?: ReactNode;
  disabled?: boolean;
}

/**
 * `sidebar` is the desktop rail with labels. `rail` collapses to glyphs only.
 * `bar` lays the tabs horizontally with the filament along the top — the
 * mobile form, and the one to use when vertical space is the scarce axis.
 */
export type TonalDepthSideTabsLayout = "sidebar" | "rail" | "bar";

export interface TonalDepthSideTabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  items: TonalDepthSideTabItem[];
  /** Controlled selection. Omit for uncontrolled. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  layout?: TonalDepthSideTabsLayout;
  tone?: TonalDepthFilamentTone;
  /** Names the tab list for a screen reader. */
  label?: string;
}

/** The next enabled index in `step` direction, wrapping. */
function TonalDepthnextEnabled(items: TonalDepthSideTabItem[], from: number, step: number): number {
  const n = items.length;
  for (let i = 1; i <= n; i++) {
    const candidate = (from + step * i + n * i) % n;
    if (!items[candidate]?.disabled) return candidate;
  }
  return from;
}

/**
 * Tabs whose selection is reported by a lit filament rather than a fill.
 *
 * The tab list is vertical by default — the sideways tab — and horizontal in
 * `bar`. Selection lights the filament and holds it lit; hover only dims it
 * on. Keyboard follows the WAI-ARIA tabs pattern: arrows move, Home and End
 * jump, and the panel is reachable by Tab because the list is a roving
 * tabstop.
 */
export const TonalDepthSideTabs = forwardRef<HTMLDivElement, TonalDepthSideTabsProps>(function TonalDepthSideTabs(
  { items, value, defaultValue, onValueChange, layout = "sidebar", tone = "green", label, className, ...props },
  ref,
) {
  const base = useId();
  const listRef = useRef<HTMLDivElement | null>(null);
  const [uncontrolled, setUncontrolled] = useState(() => defaultValue ?? items.find(item => !item.disabled)?.id ?? "");
  const selected = value ?? uncontrolled;
  const activeIndex = Math.max(0, items.findIndex(item => item.id === selected));

  const select = useCallback(
    (id: string) => {
      if (value === undefined) setUncontrolled(id);
      onValueChange?.(id);
    },
    [onValueChange, value],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const vertical = layout !== "bar";
    const prev = vertical ? "ArrowUp" : "ArrowLeft";
    const next = vertical ? "ArrowDown" : "ArrowRight";
    let target: number | null = null;
    if (event.key === next) target = TonalDepthnextEnabled(items, activeIndex, 1);
    else if (event.key === prev) target = TonalDepthnextEnabled(items, activeIndex, -1);
    else if (event.key === "Home") target = TonalDepthnextEnabled(items, -1, 1);
    else if (event.key === "End") target = TonalDepthnextEnabled(items, items.length, -1);
    if (target === null) return;
    event.preventDefault();
    const item = items[target];
    if (!item) return;
    select(item.id);
    // Selection follows focus, so the moved-to tab has to take focus with it.
    listRef.current?.querySelectorAll<HTMLButtonElement>("[role='tab']")[target]?.focus();
  };

  const active = items[activeIndex];
  return (
    <div {...props} ref={ref} className={cx("td-registry-sidetabs", `td-registry-sidetabs--${layout}`, className)}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        aria-orientation={layout === "bar" ? "horizontal" : "vertical"}
        className="td-registry-sidetabs-list"
        onKeyDown={onKeyDown}
      >
        {items.map((item, i) => (
          <TonalDepthFilamentButton
            key={item.id}
            id={`${base}-tab-${item.id}`}
            role="tab"
            aria-selected={item.id === selected}
            aria-controls={item.panel ? `${base}-panel-${item.id}` : undefined}
            // Roving tabstop: one tab in the list is reachable by Tab, and the
            // arrows move within it. Every tab being tabbable would make a
            // long rail a long detour.
            tabIndex={i === activeIndex ? 0 : -1}
            disabled={item.disabled}
            active={item.id === selected}
            tone={tone}
            edge={layout === "bar" ? "top" : "start"}
            size={layout === "rail" ? "sm" : "md"}
            icon={item.icon}
            label={layout === "rail" ? undefined : item.label}
            // A rail tab hides its label, so the name has to come from an
            // attribute. A string label is the name; anything else needs
            // `ariaLabel`, and TonalDepthFilamentButton warns if neither arrives.
            aria-label={
              layout === "rail"
                ? item.ariaLabel ?? (typeof item.label === "string" ? item.label : undefined)
                : undefined
            }
            onClick={() => select(item.id)}
          />
        ))}
      </div>
      {active?.panel ? (
        <div
          role="tabpanel"
          id={`${base}-panel-${active.id}`}
          aria-labelledby={`${base}-tab-${active.id}`}
          tabIndex={0}
          className="td-registry-sidetabs-panel"
        >
          {active.panel}
        </div>
      ) : null}
    </div>
  );
});
