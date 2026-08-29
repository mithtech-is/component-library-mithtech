"use client";

import { forwardRef, useEffect, useId, useMemo, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./spotlight.css";

export interface SpotlightAction {
  id: string;
  label: ReactNode;
  /** The second line — a path, a description of where this goes. */
  detail?: ReactNode;
  /** A library glyph. */
  icon?: ReactNode;
  /** The shortcut shown on the right, if this action has one. */
  shortcut?: string;
  /** Which heading it sits under. Rows with no group come first, unlabelled. */
  group?: string;
}

export interface SpotlightProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect" | "children"> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * The rows to show, already filtered and ordered.
   *
   * The component does no matching. Ranking a command palette is a judgement —
   * recency, fuzzy scoring, weighting a title over a path — and a library that
   * picks one for you is a library you fight. Hold the query with `query` /
   * `onQueryChange` and pass the results; Fuse.js is what the docs site uses.
   */
  actions: SpotlightAction[];
  query?: string;
  onQueryChange?: (query: string) => void;
  onSelect?: (action: SpotlightAction) => void;
  placeholder?: string;
  /** Shown in place of the list when `actions` is empty. */
  empty?: ReactNode;
  /** Accessible name for the dialog. Default "Search". */
  label?: string;
  /**
   * Bind the keyboard shortcut that opens it.
   *
   * `true` binds Cmd+K on Apple platforms and Ctrl+K everywhere else, at the
   * document, and toggles `onOpenChange`. Pass a string to bind a different
   * key with the same modifier — `"/"`, `"p"`. `false` binds nothing, which is
   * right when the shortcut is already part of a keymap the app owns.
   *
   * The component still does not own *whether* it is open: the shortcut calls
   * `onOpenChange` like any other trigger would.
   */
  shortcut?: boolean | string;
  /**
   * Where it grows from.
   *
   * A palette that fades in at the centre has no relationship to the control
   * that opened it. Growing from the search field in the header is what makes
   * it read as that field expanding rather than as a new window arriving.
   */
  origin?: "top" | "top-start" | "top-end" | "center";
}

/**
 * The command palette: a search field over the whole product, on a scrim.
 *
 * Not `SearchBar`. A search bar is a field on the page that filters what is
 * already in front of the reader, and it stays put. This takes the screen,
 * takes the keyboard, and its results *go somewhere* — pages, records, actions.
 * A reader reaches for one to narrow, and the other to leave.
 *
 * The caller owns matching. This owns the overlay, the roving
 * selection, and returning focus to whatever opened it.
 */
export const Spotlight = forwardRef<HTMLDivElement, SpotlightProps>(function Spotlight(
  { open, onOpenChange, actions, query, onQueryChange, onSelect, placeholder = "Search…", empty = "No matches.", label = "Search", shortcut = true, origin = "top", className, ...props },
  ref,
) {
  const [own, setOwn] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const input = useRef<HTMLInputElement | null>(null);
  const opener = useRef<Element | null>(null);
  const text = query ?? own;

  /*
   * The shortcut. Bound at the document because a palette is reachable from
   * anywhere on the page, not from a field that has to be focused first.
   *
   * `metaKey` on Apple platforms and `ctrlKey` elsewhere, read from the event
   * rather than sniffed from the platform: a Mac keyboard on a Linux box and a
   * PC keyboard on a Mac both work, and neither needs a user-agent test.
   *
   * It toggles rather than opens, so the same keystroke closes it — which is
   * what every palette a reader has met already does.
   */
  useEffect(() => {
    if (!shortcut) return;
    const key = (typeof shortcut === "string" ? shortcut : "k").toLowerCase();
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key) return;
      if (!event.metaKey && !event.ctrlKey) return;
      // The browser's own Ctrl+K focuses the address bar. Ours wins on the page.
      event.preventDefault();
      onOpenChange(!open);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shortcut, open, onOpenChange]);

  // Any change to the result set invalidates the cursor: leaving it where it
  // was means Enter fires whatever happens to have slid into that row.
  useEffect(() => setActive(0), [actions]);

  useEffect(() => {
    if (!open) return;
    // Remember where focus came from BEFORE taking it, so Escape can put it
    // back on the control that opened the palette rather than on the body.
    opener.current = document.activeElement;
    input.current?.focus();
    const previous = document.body.style.overflow;
      // The page behind a scrim must not scroll, or the reader loses their place
    // while looking at something else.
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open]);

  const groups = useMemo(() => {
    const out: { name?: string; rows: SpotlightAction[] }[] = [];
    for (const action of actions) {
      const last = out[out.length - 1];
      if (last && last.name === action.group) last.rows.push(action);
      else out.push({ name: action.group, rows: [action] });
    }
    return out;
  }, [actions]);

  if (!open) return null;

  const choose = (action: SpotlightAction) => {
    onSelect?.(action);
    onOpenChange(false);
  };

  const keys = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") { event.preventDefault(); onOpenChange(false); return; }
    if (event.key === "ArrowDown") { event.preventDefault(); setActive(i => Math.min(actions.length - 1, i + 1)); return; }
    if (event.key === "ArrowUp") { event.preventDefault(); setActive(i => Math.max(0, i - 1)); return; }
    if (event.key === "Enter" && actions[active]) { event.preventDefault(); choose(actions[active]); }
  };

  let row = -1;
  return (
    <div
      className="td-react-spotlight-scrim"
      data-origin={origin}
      // The scrim dismisses, but only when the scrim itself was hit — a drag
      // that starts inside the panel and ends outside must not close it.
      onMouseDown={event => { if (event.target === event.currentTarget) onOpenChange(false); }}
    >
      <div
        {...props}
        ref={ref}
        className={cx("td-react-spotlight", className)}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onKeyDown={keys}
      >
        <div className="td-react-spotlight-field">
          <input
            ref={input}
            className="td-react-spotlight-input"
            type="text"
            value={text}
            placeholder={placeholder}
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={actions[active] ? `${listId}-${actions[active].id}` : undefined}
            onChange={event => { if (query === undefined) setOwn(event.target.value); onQueryChange?.(event.target.value); }}
          />
          <kbd className="td-react-spotlight-esc">esc</kbd>
        </div>
        <div className="td-react-spotlight-results" id={listId} role="listbox" aria-label={label}>
          {actions.length === 0 ? <p className="td-react-spotlight-empty">{empty}</p> : groups.map((group, index) => (
            <div className="td-react-spotlight-group" key={index}>
              {group.name !== undefined ? <p className="td-react-spotlight-grouplabel">{group.name}</p> : null}
              {group.rows.map(action => {
                row += 1;
                const selected = row === active;
                const at = row;
                return (
                  <div
                    className="td-react-spotlight-row"
                    id={`${listId}-${action.id}`}
                    role="option"
                    aria-selected={selected}
                    data-active={selected ? "true" : undefined}
                    key={action.id}
                    onMouseMove={() => setActive(at)}
                    onClick={() => choose(action)}
                  >
                    {action.icon !== undefined ? <span className="td-react-spotlight-icon" aria-hidden="true">{action.icon}</span> : null}
                    <span className="td-react-spotlight-body">
                      <span className="td-react-spotlight-label">{action.label}</span>
                      {action.detail !== undefined ? <span className="td-react-spotlight-detail">{action.detail}</span> : null}
                    </span>
                    {action.shortcut ? <kbd className="td-react-spotlight-kbd">{action.shortcut}</kbd> : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="td-react-spotlight-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
});
