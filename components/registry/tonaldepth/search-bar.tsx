"use client";

import { forwardRef, useCallback, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type FormEvent, type InputHTMLAttributes, type KeyboardEvent, type ReactNode, type SVGProps } from "react";
import { MagnifyingGlassIcon as SearchIcon } from "@phosphor-icons/react";
import "./tonaldepth-search-bar.css";

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

export interface TonalDepthSearchSuggestion {
  id: string;
  label: ReactNode;
  /** A second line — the section, the category, the count. */
  detail?: ReactNode;
}

export type TonalDepthSearchBarSize = "sm" | "md" | "lg";

export interface TonalDepthSearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "onSubmit" | "size" | "value" | "defaultValue"> {
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
  suggestions?: TonalDepthSearchSuggestion[];
  onSuggestionSelect?: (suggestion: TonalDepthSearchSuggestion) => void;
  size?: TonalDepthSearchBarSize;
  /** Fill the container instead of taking the field's own natural width. */
  block?: boolean;
  /** A visible submit button. Enter submits either way. */
  showSubmit?: boolean;
  submitLabel?: string;
  /** The clear button's accessible name. */
  clearLabel?: string;
  /**
   * Renders the field as a BUTTON that opens a search somewhere else, rather
   * than as a place to type.
   *
   * A product with a command palette wants both halves of this: the palette is
   * where searching happens, and the header needs something that looks like
   * the way in. Two chrome fields — one that types and one that opens a
   * console — is the failure mode; a reader has to learn which is which and
   * the narrower-looking one seems to search less. So this is the same carved
   * field with the same mark, drawn at the same heights, that does not accept
   * typing and says out loud what opens the real thing.
   *
   * `placeholder` becomes the visible label. `onClick` is yours.
   */
  trigger?: boolean;
  /**
   * The field grows when it is focused, and settles back when it is left.
   *
   * For a field that lives in chrome, where it has to be small until somebody
   * means to use it — a header, a toolbar, a table's filter row. The panel
   * drops from the grown field, so the two read as one movement rather than as
   * a box appearing beside a box that just changed size.
   *
   * `--td-search-expanded` is the width it grows to; the default is
   * `min(100%, 620px)`, which is wide enough for a result and its reason.
   */
  expand?: boolean;
  /**
   * The shortcut hint on a `trigger`.
   *
   * Defaults to the platform's own — `⌘K` on a Mac, `Ctrl K` everywhere else —
   * resolved after mount, because the server has no idea what the reader is
   * typing on. `false` drops it. It is a hint, not a binding: the shortcut
   * itself is the consumer's to wire, because only they know what it opens.
   */
  shortcut?: ReactNode | false;
}

/** `⌘K` on a Mac, `Ctrl K` everywhere else. */
function useTonalDepthShortcutHint(): string {
  // Mac is assumed for the first paint and corrected in an effect: reading
  // `navigator` during render is a hydration mismatch waiting to happen, and
  // the correction lands before anyone has read the chip.
  const [hint, setHint] = useState("\u2318K");
  useEffect(() => {
    const platform = navigator.userAgent;
    if (!/Mac|iPhone|iPad/i.test(platform)) setHint("Ctrl K");
  }, []);
  return hint;
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
export const TonalDepthSearchBar = forwardRef<HTMLInputElement, TonalDepthSearchBarProps>(function TonalDepthSearchBar(
  {
    value, defaultValue = "", onValueChange, onSubmit, suggestions, onSuggestionSelect,
    size = "md", block = false, showSubmit = false, submitLabel = "Search", clearLabel = "Clear search",
    placeholder = "Search", trigger = false, expand = false, shortcut, className, disabled, ...props
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

  const pick = (suggestion: TonalDepthSearchSuggestion) => {
    onSuggestionSelect?.(suggestion);
    setOpen(false);
    setAt(-1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // The caller's handler runs FIRST and may take the key.
    //
    // `{...props}` is spread onto the input and this handler is bound after it,
    // so without calling through, a caller's `onKeyDown` is silently discarded
    // — the field looks wired and the arrows do nothing. That matters most for
    // the case this component is built for: the caller owns the matching, so
    // the caller often owns the result list and needs the arrows too.
    props.onKeyDown?.(event);
    if (event.defaultPrevented) return;
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
  // Called unconditionally, above the early return: a hook behind a branch is
  // a hook that runs a different number of times between renders.
  const platformHint = useTonalDepthShortcutHint();
  const hint = shortcut === undefined ? platformHint : shortcut;

  /* The trigger form. Same housing, same mark, same heights — nothing here is
     a second look at a search field, only the same one with a button inside it
     instead of an input. It is a real `button`, so it is reached by Tab and
     fired by Enter and Space without any of that being reimplemented. */
  if (trigger) {
    const button = props as unknown as ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <div className={cx("td-registry-search", `td-registry-search--${size}`, "td-registry-search--trigger", block && "td-registry-search--block", className)}>
        <button
          {...button}
          type="button"
          disabled={disabled}
          className="td-registry-search-field td-registry-search-trigger"
        >
          <span className="td-registry-search-mark" aria-hidden="true">
            <SearchIcon weight={LAMP_WEIGHT} aria-hidden="true" />
          </span>
          <span className="td-registry-search-triggerlabel">{placeholder}</span>
          {hint === false ? null : <kbd className="td-registry-search-kbd">{hint}</kbd>}
        </button>
      </div>
    );
  }

  return (
    <form
      role="search"
      className={cx("td-registry-search", `td-registry-search--${size}`, block && "td-registry-search--block", expand && "td-registry-search--expand", className)}
      /* The field squares its bottom corners while the list is down, so the
         two read as one plate parting rather than a card floating under a
         pill. The stylesheet needs to know, and only the component does. */
      data-open={showList || undefined}
      onSubmit={submit}
      // A blur that lands inside the component (onto a suggestion) is not a
      // dismissal; only focus leaving the whole thing closes the list.
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) { setOpen(false); setAt(-1); } }}
    >
      <div className="td-registry-search-field">
        <span className="td-registry-search-mark" aria-hidden="true">
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
          className="td-registry-search-input"
        />
        {current ? (
          <button
            type="button"
            aria-label={clearLabel}
            disabled={disabled}
            className="td-registry-search-clear"
            onClick={() => { change(""); setOpen(false); input.current?.focus(); }}
          >
            <CloseIcon weight={LAMP_WEIGHT} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {showSubmit ? <button type="submit" disabled={disabled} className="td-registry-search-submit">{submitLabel}</button> : null}
      {showList ? (
        <ul id={`${base}-list`} role="listbox" className="td-registry-search-list">
          {list.map((suggestion, i) => (
            <li
              key={suggestion.id}
              id={`${base}-option-${suggestion.id}`}
              role="option"
              aria-selected={i === at}
              className={cx("td-registry-search-option", i === at && "td-registry-search-option--on")}
              // mousedown, not click: a click fires after blur, by which point
              // the list has closed and the option is gone.
              onMouseDown={event => { event.preventDefault(); pick(suggestion); }}
              onMouseEnter={() => setAt(i)}
            >
              <span className="td-registry-search-option-label">{suggestion.label}</span>
              {suggestion.detail ? <span className="td-registry-search-option-detail">{suggestion.detail}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
});
