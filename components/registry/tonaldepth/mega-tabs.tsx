"use client";

import { forwardRef, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import "./tonaldepth-mega-tabs.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

// ── The two-column tab panel ───────────────────────────────────────────────

export interface TonalDepthMegaTabItem {
  id: string;
  label: string;
  /** The second line in the rail — what this option is, in a few words. */
  hint?: ReactNode;
  icon?: ReactNode;
  /** The pane. Whatever the option is worth saying at length. */
  panel: ReactNode;
}

export interface TonalDepthMegaTabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  items: TonalDepthMegaTabItem[];
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
export const TonalDepthMegaTabs = forwardRef<HTMLDivElement, TonalDepthMegaTabsProps>(function TonalDepthMegaTabs(
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
    /* Stateful for the same reason MegaCascade is: picking a tab repaints the
       pane, which is most of the sheet. See the note there. */
    <div {...props} ref={ref} data-mega-stateful="" className={cx("td-mega-inner", "td-registry-mega-inner", "td-registry-mega-inner--two", className)}>
      <div role="tablist" aria-label={label} aria-orientation="vertical" className="td-mega-list td-registry-mega-list" onKeyDown={onKeyDown}>
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
            className="td-mega-option td-registry-mega-option"
          >
            {item.icon ? <span className="td-mega-op-icon td-registry-mega-op-icon">{item.icon}</span> : null}
            <span className="td-mega-op-copy">
              <strong>{item.label}</strong>
              {item.hint ? <span>{item.hint}</span> : null}
            </span>
          </button>
        ))}
      </div>
      <div className="td-mega-content td-registry-mega-content">
        {items[index] ? (
          <div
            className="td-mega-pane td-registry-mega-pane"
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
