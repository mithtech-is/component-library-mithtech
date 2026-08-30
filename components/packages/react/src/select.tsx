"use client";

/**
 * The three ways a reader picks from a known set.
 *
 * `Select` is a real `<select>`. `Combobox` is a hand-rolled listbox, and the
 * only reason to hand-roll one is that a native select cannot carry a filter —
 * past roughly twenty options the reader is scanning rather than choosing, and
 * scanning is what typing fixes. `MultiSelect` is not a third component: it is
 * `Combobox multiple`, because the reader does the same thing with it and only
 * the arity differs. Its chips reuse `.td-taginput-tag`, so a multi-select and
 * a TagInput read as the same object — which they are, one closed and one open.
 */

import {
  forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState,
  type InputHTMLAttributes, type KeyboardEvent, type ReactNode, type SelectHTMLAttributes,
} from "react";
import { cx } from "./utils";
import { ChevronDownIcon, CloseIcon, LAMP_WEIGHT } from "./icons";
import "./select.css";

/* ── Select ──────────────────────────────────────────────────────────── */

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  options: SelectOption[];
  /** The unselected row. Rendered as a disabled empty-value option. */
  placeholder?: string;
  invalid?: boolean;
  containerClassName?: string;
}

/**
 * A native `<select>` in the system's housing.
 *
 * Native on purpose: the platform picker, the keyboard, the type-ahead and
 * every assistive technology arrive already correct, and on a phone the reader
 * gets the OS wheel rather than a listbox rebuilt in a page.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, placeholder, invalid = false, disabled, className, containerClassName, "aria-invalid": ariaInvalid, ...props },
  ref,
) {
  const effectiveInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  return (
    <span
      className={cx("td-select-wrap", "td-react-select", containerClassName)}
      data-state={effectiveInvalid ? "error" : undefined}
      data-disabled={disabled || undefined}
    >
      <select
        {...props}
        ref={ref}
        disabled={disabled}
        aria-invalid={effectiveInvalid || undefined}
        className={cx("td-select", className)}
      >
        {placeholder !== undefined ? <option value="" disabled>{placeholder}</option> : null}
        {options.map(option => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {typeof option.label === "string" ? option.label : option.value}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="td-select-chevron" weight={LAMP_WEIGHT} aria-hidden="true" />
    </span>
  );
});

/* ── Combobox ────────────────────────────────────────────────────────── */

export interface ComboboxOption {
  value: string;
  label: string;
  /** The right-hand mono note — a dial code, a count, a shortcut. */
  mark?: string;
  disabled?: boolean;
}

export interface ComboboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "onSelect" | "multiple"> {
  options: ComboboxOption[];
  /** Single: the chosen value. Multiple: the chosen values. */
  value?: string | string[];
  /** Called with a string, or with the full array when `multiple`. */
  onValueChange?: (value: string & string[]) => void;
  /**
   * Pick several. Chips render above the field in `.td-taginput-tag`, the same
   * object TagInput uses — a multi-select is a tag input with a closed set.
   */
  multiple?: boolean;
  /** Shown when the filter matches nothing. */
  emptyText?: string;
  invalid?: boolean;
  containerClassName?: string;
  label?: string;
}

/**
 * A filtered listbox. `multiple` turns it into the multi-select.
 *
 * The ARIA is hand-rolled because the widget is: `aria-expanded` and
 * `aria-controls` on the input, `aria-activedescendant` pointing at the
 * highlighted row rather than moving focus, `role="option"` with
 * `aria-selected` on the rows. Focus never leaves the input, so typing and
 * arrowing are the same gesture.
 */
export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(
  {
    options, value, onValueChange, multiple = false, emptyText = "No matches",
    invalid = false, disabled, placeholder, className, containerClassName, label,
    "aria-invalid": ariaInvalid, id, onKeyDown, ...props
  },
  ref,
) {
  const generatedId = useId();
  const rootId = id ?? generatedId;
  const listId = `${rootId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const effectiveInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  const selected = useMemo(
    () => (multiple ? (Array.isArray(value) ? value : []) : typeof value === "string" && value ? [value] : []),
    [multiple, value],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    // The mark is searchable too: somebody who knows "+971" should not have to
    // remember which country that is.
    return options.filter(o =>
      o.label.toLowerCase().includes(q)
      || o.value.toLowerCase().includes(q)
      || (o.mark?.toLowerCase().includes(q) ?? false));
  }, [options, query]);

  // The highlight is an index into a list that shrinks as the reader types, so
  // it has to be pulled back in range rather than left pointing past the end.
  useEffect(() => { setActive(a => Math.min(a, Math.max(0, matches.length - 1))); }, [matches.length]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Keep the highlighted row in view while arrowing past the visible window.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const emit = useCallback((next: string[]) => {
    onValueChange?.((multiple ? next : (next[0] ?? "")) as string & string[]);
  }, [multiple, onValueChange]);

  const pick = useCallback((option: ComboboxOption) => {
    if (option.disabled) return;
    if (multiple) {
      const next = selected.includes(option.value)
        ? selected.filter(v => v !== option.value)
        : [...selected, option.value];
      emit(next);
      setQuery("");
    } else {
      emit([option.value]);
      setOpen(false);
      setQuery("");
    }
  }, [emit, multiple, selected]);

  const remove = (target: string) => emit(selected.filter(v => v !== target));

  const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); return; }
    if (event.key === "Enter") {
      if (!open) { event.preventDefault(); setOpen(true); return; }
      event.preventDefault();
      const option = matches[active];
      if (option) pick(option);
      return;
    }
    if (event.key === "Backspace" && multiple && !query && selected.length) {
      event.preventDefault();
      remove(selected[selected.length - 1]!);
      return;
    }
    const step = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (step) {
      event.preventDefault();
      if (!open) { setOpen(true); return; }
      setActive(i => Math.min(matches.length - 1, Math.max(0, i + step)));
      return;
    }
    if (event.key === "Home" && open) { event.preventDefault(); setActive(0); }
    if (event.key === "End" && open) { event.preventDefault(); setActive(Math.max(0, matches.length - 1)); }
  };

  const single = !multiple ? options.find(o => o.value === selected[0]) : undefined;
  const shown = open || multiple ? query : (query || single?.label || "");

  return (
    <div
      ref={rootRef}
      className={cx("td-combobox", "td-react-combobox", containerClassName)}
      data-state={open ? "open" : undefined}
      data-disabled={disabled || undefined}
    >
      {multiple && selected.length ? (
        <div className="td-react-combobox-chips">
          {selected.map(v => {
            const option = options.find(o => o.value === v);
            return (
              <span className="td-taginput-tag" key={v}>
                {option?.label ?? v}
                <button
                  type="button"
                  className="td-taginput-x"
                  aria-label={`Remove ${option?.label ?? v}`}
                  disabled={disabled}
                  onClick={() => remove(v)}
                >
                  <CloseIcon weight={LAMP_WEIGHT} aria-hidden="true" />
                </button>
              </span>
            );
          })}
        </div>
      ) : null}

      <span
        className={cx("td-input-wrap", "td-react-combobox-slot")}
        data-state={effectiveInvalid ? "error" : undefined}
        data-disabled={disabled || undefined}
      >
        <input
          {...props}
          ref={node => {
            inputRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          id={rootId}
          role="combobox"
          type="text"
          autoComplete="off"
          className={cx("td-input", "td-combobox-input", className)}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={label}
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={open && matches[active] ? `${rootId}-o${active}` : undefined}
          aria-invalid={effectiveInvalid || undefined}
          value={shown}
          onChange={event => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
        />
        <ChevronDownIcon className="td-select-chevron" weight={LAMP_WEIGHT} aria-hidden="true" />
      </span>

      <div className="td-combobox-list" id={listId} role="listbox" aria-label={label} ref={listRef} aria-multiselectable={multiple || undefined}>
        {matches.length === 0 ? (
          <div className="td-combobox-empty">{emptyText}</div>
        ) : matches.map((option, index) => (
          <div
            key={option.value}
            id={`${rootId}-o${index}`}
            data-index={index}
            role="option"
            className="td-combobox-option"
            aria-selected={selected.includes(option.value)}
            aria-disabled={option.disabled || undefined}
            data-active={index === active || undefined}
            onPointerDown={event => { event.preventDefault(); pick(option); }}
          >
            <span>{option.label}</span>
            {option.mark ? <span className="td-combobox-option-mark">{option.mark}</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
});
