"use client";

import { forwardRef, useCallback, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import "./tonaldepth-split-button.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthSplitButtonAction {
  /** Stable key, and what `onAction` reports. */
  id: string;
  label: ReactNode;
  /** A filled glyph, shown in the menu and on the button when chosen. */
  icon?: ReactNode;
  /** A second line in the menu — the number, the address, the handle. */
  detail?: ReactNode;
  /** Renders the primary half as a link when this action is the chosen one. */
  href?: string;
  disabled?: boolean;
}

export interface TonalDepthSplitButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onSelect" | "children" | "type"> {
  actions: TonalDepthSplitButtonAction[];
  /**
   * The action the primary half fires.
   *
   * Omit it and the button is in **forced-select** mode: the primary half is
   * inert until the reader picks a channel, because the author has decided
   * that choosing is part of the act. Give it an id — or `"any"` — and the
   * button acts immediately, with the menu as a way to override.
   */
  defaultAction?: string | "any";
  /** Controlled choice. Omit for uncontrolled. */
  value?: string;
  onValueChange?: (id: string) => void;
  /** Fired when the primary half is pressed, with the action that ran. */
  onAction?: (action: TonalDepthSplitButtonAction) => void;
  /** What the primary half reads before a channel is chosen. */
  placeholder?: ReactNode;
  /** Names the menu trigger for a screen reader. */
  menuLabel?: string;
}

/**
 * One action with its alternatives folded behind a disclosure.
 *
 * Two modes, and the difference is whether `defaultAction` is set:
 *
 * - **Defaulted** — the primary half acts at once and the menu is an
 *   override. `"any"` picks the first enabled action, which is the right
 *   default for a "contact us" where every channel reaches the same desk.
 * - **Forced select** — no default, so the primary half stays disabled until
 *   a channel is chosen. Use it when the choice is load-bearing and a wrong
 *   default costs the reader something.
 *
 * The two halves share one housing and are divided by a carved seam, not a
 * border. Neither half is filled with the brand colour; the chosen channel is
 * reported by its glyph.
 */
export const TonalDepthSplitButton = forwardRef<HTMLButtonElement, TonalDepthSplitButtonProps>(function TonalDepthSplitButton(
  { actions, defaultAction, value, onValueChange, onAction, placeholder = "Choose an option", menuLabel = "More options", className, disabled, ...props },
  ref,
) {
  const base = useId();
  const root = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const firstEnabled = actions.find(action => !action.disabled)?.id;
  const resolvedDefault = defaultAction === "any" ? firstEnabled : defaultAction;
  const [uncontrolled, setUncontrolled] = useState<string | undefined>(resolvedDefault);
  const chosenId = value ?? uncontrolled;
  const chosen = actions.find(action => action.id === chosenId);
  // No default and nothing picked yet is the forced-select state, and it is
  // the only thing that makes the primary half inert on its own.
  const mustChoose = !chosen;

  const choose = useCallback(
    (action: TonalDepthSplitButtonAction) => {
      if (value === undefined) setUncontrolled(action.id);
      onValueChange?.(action.id);
      setOpen(false);
      onAction?.(action);
    },
    [onAction, onValueChange, value],
  );

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    // `click`, not `mousedown` — a mousedown listener unmounts the menu before
    // the click on an item lands, which silently stops every item working.
    document.addEventListener("click", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(root.current?.querySelectorAll<HTMLButtonElement>("[role='menuitem']:not(:disabled)") ?? []);
    if (!items.length) return;
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "ArrowDown") { event.preventDefault(); items[(at + 1) % items.length]?.focus(); }
    else if (event.key === "ArrowUp") { event.preventDefault(); items[(at - 1 + items.length) % items.length]?.focus(); }
    else if (event.key === "Home") { event.preventDefault(); items[0]?.focus(); }
    else if (event.key === "End") { event.preventDefault(); items[items.length - 1]?.focus(); }
  };

  // Every label is rendered, stacked in one grid cell, so the housing is
  // always as wide as its longest option and does not resize on selection.
  const primaryLabel = (
    <>
      <span data-shown={String(!chosen)} aria-hidden={chosen ? "true" : undefined}>{placeholder}</span>
      {actions.map(action => (
        <span key={action.id} data-shown={String(action.id === chosenId)} aria-hidden={action.id === chosenId ? undefined : "true"}>
          {action.label}
        </span>
      ))}
    </>
  );
  const primaryDisabled = disabled || mustChoose || chosen?.disabled;
  const sharedPrimary = {
    className: "td-registry-split-primary",
    onClick: () => { if (chosen) onAction?.(chosen); },
  };

  return (
    <div ref={root} className={cx("td-registry-split", mustChoose && "td-registry-split--unset", className)}>
      {chosen?.href && !primaryDisabled ? (
        <a {...sharedPrimary} href={chosen.href}>
          {actions.some(a => a.icon) ? <span className="td-registry-split-icon" aria-hidden="true">{chosen.icon}</span> : null}
          <span className="td-registry-split-label">{primaryLabel}</span>
        </a>
      ) : (
        <button {...props} ref={ref} type="button" disabled={primaryDisabled} {...sharedPrimary}>
          {actions.some(a => a.icon) ? <span className="td-registry-split-icon" aria-hidden="true">{chosen?.icon}</span> : null}
          <span className="td-registry-split-label">{primaryLabel}</span>
        </button>
      )}
      <button
        type="button"
        disabled={disabled}
        aria-label={menuLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${base}-menu`}
        className="td-registry-split-toggle"
        onClick={() => setOpen(current => !current)}
      >
        <span className="td-registry-split-chevron" aria-hidden="true" />
      </button>
      {open ? (
        <div id={`${base}-menu`} role="menu" aria-label={menuLabel} className="td-registry-split-menu" onKeyDown={onMenuKeyDown}>
          {actions.map(action => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              disabled={action.disabled}
              aria-current={action.id === chosenId || undefined}
              className={cx("td-registry-split-item", action.id === chosenId && "td-registry-split-item--on")}
              onClick={() => choose(action)}
            >
              {action.icon ? <span className="td-registry-split-icon" aria-hidden="true">{action.icon}</span> : null}
              <span className="td-registry-split-item-text">
                <span className="td-registry-split-item-label">{action.label}</span>
                {action.detail ? <span className="td-registry-split-item-detail">{action.detail}</span> : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
});
