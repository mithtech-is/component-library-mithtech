"use client";

import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState, type InputHTMLAttributes, type KeyboardEvent, type SVGProps } from "react";
import { CaretDownIcon as ChevronDownIcon } from "@phosphor-icons/react";
import "./tonaldepth-combobox.css";

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

/* ── TonalDepthCombobox ────────────────────────────────────────────────────────── */

export interface TonalDepthComboboxOption {
  value: string;
  label: string;
  /** The right-hand mono note — a dial code, a count, a shortcut. */
  mark?: string;
  disabled?: boolean;
}

export interface TonalDepthComboboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "onSelect" | "multiple"> {
  options: TonalDepthComboboxOption[];
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
export const TonalDepthCombobox = forwardRef<HTMLInputElement, TonalDepthComboboxProps>(function TonalDepthCombobox(
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

  const pick = useCallback((option: TonalDepthComboboxOption) => {
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
      className={cx("td-combobox", "td-registry-combobox", containerClassName)}
      data-state={open ? "open" : undefined}
      data-disabled={disabled || undefined}
    >
      {multiple && selected.length ? (
        <div className="td-registry-combobox-chips">
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
        className={cx("td-input-wrap", "td-registry-combobox-slot")}
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
