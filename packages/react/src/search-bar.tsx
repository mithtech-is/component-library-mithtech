"use client";

import { forwardRef, useCallback, useId, useRef, useState, type FormEvent, type InputHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "./utils";
import { CloseIcon, LAMP_WEIGHT, SearchIcon } from "./icons";
import "./search-bar.css";

export interface SearchSuggestion {
  id: string;
  label: ReactNode;
  /** A second line — the section, the category, the count. */
  detail?: ReactNode;
}

export type SearchBarSize = "sm" | "md" | "lg";

export interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "onSubmit" | "size" | "value" | "defaultValue"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Enter, or the submit button when `showSubmit`. */
  onSubmit?: (value: string) => void;
  /**
   * Rendered as a listbox under the field, exactly as given.
   *
   * The component does no matching of its own, so the consumer keeps control
   * of ranking: mith.tech drives this from Fuse.js, and a server route or a
   * plain `filter` works the same way. Sort before passing.
   */
  suggestions?: SearchSuggestion[];
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  size?: SearchBarSize;
  /** Fill the container instead of taking the field's own natural width. */
  block?: boolean;
  /** A visible submit button. Enter submits either way. */
  showSubmit?: boolean;
  submitLabel?: string;
  /** The clear button's accessible name. */
  clearLabel?: string;
}

/**
 * A search field: carved into the surface, with an optional suggestion list.
 *
 * A field is a place to put something, so it grooves inward rather than
 * lifting — depth is state, and an input is never raised. The magnifier is a
 * mark, not a control, so it takes no glow.
 *
 * With `suggestions` the field is a combobox and follows the ARIA 1.2 pattern:
 * the field keeps focus, `aria-activedescendant` moves through the list, and
 * Escape closes it without clearing what was typed.
 */
export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(function SearchBar(
  {
    value, defaultValue = "", onValueChange, onSubmit, suggestions, onSuggestionSelect,
    size = "md", block = false, showSubmit = false, submitLabel = "Search", clearLabel = "Clear search",
    placeholder = "Search", className, disabled, ...props
  },
  ref,
) {
  const base = useId();
  const input = useRef<HTMLInputElement | null>(null);
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(-1);
  const current = value ?? uncontrolled;
  const list = suggestions ?? [];
  const hasList = list.length > 0;

  const setRefs = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const change = (next: string) => {
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
    setOpen(true);
    setAt(-1);
  };

  const pick = (suggestion: SearchSuggestion) => {
    onSuggestionSelect?.(suggestion);
    setOpen(false);
    setAt(-1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      // Closes the list, keeps the query. Clearing on Escape loses work the
      // reader did not ask to throw away.
      setOpen(false);
      setAt(-1);
      return;
    }
    if (!hasList || !open) {
      if (event.key === "ArrowDown" && hasList) { event.preventDefault(); setOpen(true); setAt(0); }
      return;
    }
    if (event.key === "ArrowDown") { event.preventDefault(); setAt(i => (i + 1) % list.length); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setAt(i => (i - 1 + list.length) % list.length); }
    else if (event.key === "Enter" && at >= 0) { event.preventDefault(); const item = list[at]; if (item) pick(item); }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (at >= 0 && open) { const item = list[at]; if (item) { pick(item); return; } }
    setOpen(false);
    onSubmit?.(current);
  };

  const showList = open && hasList && !disabled;
  return (
    <form
      role="search"
      className={cx("td-react-search", `td-react-search--${size}`, block && "td-react-search--block", className)}
      onSubmit={submit}
      // A blur that lands inside the component (onto a suggestion) is not a
      // dismissal; only focus leaving the whole thing closes the list.
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) { setOpen(false); setAt(-1); } }}
    >
      <div className="td-react-search-field">
        <span className="td-react-search-mark" aria-hidden="true">
          <SearchIcon weight={LAMP_WEIGHT} aria-hidden="true" />
        </span>
        <input
          {...props}
          ref={setRefs}
          type="search"
          role={hasList ? "combobox" : undefined}
          aria-expanded={hasList ? showList : undefined}
          aria-controls={hasList ? `${base}-list` : undefined}
          aria-autocomplete={hasList ? "list" : undefined}
          aria-activedescendant={showList && at >= 0 ? `${base}-option-${list[at]?.id}` : undefined}
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={current}
          onChange={event => change(event.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => { if (hasList) setOpen(true); }}
          className="td-react-search-input"
        />
        {current ? (
          <button
            type="button"
            aria-label={clearLabel}
            disabled={disabled}
            className="td-react-search-clear"
            onClick={() => { change(""); setOpen(false); input.current?.focus(); }}
          >
            <CloseIcon weight={LAMP_WEIGHT} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {showSubmit ? <button type="submit" disabled={disabled} className="td-react-search-submit">{submitLabel}</button> : null}
      {showList ? (
        <ul id={`${base}-list`} role="listbox" className="td-react-search-list">
          {list.map((suggestion, i) => (
            <li
              key={suggestion.id}
              id={`${base}-option-${suggestion.id}`}
              role="option"
              aria-selected={i === at}
              className={cx("td-react-search-option", i === at && "td-react-search-option--on")}
              // mousedown, not click: a click fires after blur, by which point
              // the list has closed and the option is gone.
              onMouseDown={event => { event.preventDefault(); pick(suggestion); }}
              onMouseEnter={() => setAt(i)}
            >
              <span className="td-react-search-option-label">{suggestion.label}</span>
              {suggestion.detail ? <span className="td-react-search-option-detail">{suggestion.detail}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
});
