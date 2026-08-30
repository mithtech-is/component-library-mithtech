"use client";

/**
 * A number, with the two buttons that make it a number.
 *
 * There is no `CurrencyField` and no `PercentField`. Both are this component
 * with a symbol in one of `Input`'s existing slots — `prefix="₹"` puts it in
 * the leading slot, `suffix="%"` in the trailing one — because the reader is
 * doing the same thing in all three cases and only the unit differs. Writing
 * CSS for a `₹` would have produced a third housing to keep in step with this
 * one for no gain the reader could see.
 */

import {
  forwardRef, useRef, useState,
  type InputHTMLAttributes, type KeyboardEvent, type ReactNode,
} from "react";
import { cx } from "./utils";
import { Input } from "./input";
import "./number-field.css";

export interface NumberFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "onChange" | "prefix"> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Goes in `Input`'s leading slot — `₹`, `$`, `kg`. */
  prefix?: ReactNode;
  /** Goes in `Input`'s trailing slot — `%`, `hrs`, `/mo`. */
  suffix?: ReactNode;
  /** Decimal places to show when the field is not being typed in. */
  precision?: number;
  invalid?: boolean;
  label?: string;
  containerClassName?: string;
}

const clamp = (n: number, min?: number, max?: number) =>
  Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, n));

export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(
  {
    value, defaultValue, onValueChange, min, max, step = 1, prefix, suffix, precision,
    invalid = false, disabled, label, className, containerClassName, onKeyDown, ...props
  },
  ref,
) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? 0);
  // What the reader is mid-way through typing. "-" and "1." are not numbers
  // yet, so the field cannot round-trip them through `Number` on every stroke.
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const current = value ?? uncontrolled;

  const set = (next: number) => {
    const bounded = clamp(next, min, max);
    if (value === undefined) setUncontrolled(bounded);
    onValueChange?.(bounded);
  };

  const nudge = (by: number) => { set(current + by); setDraft(null); };

  const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === "ArrowUp") { event.preventDefault(); nudge(step); return; }
    if (event.key === "ArrowDown") { event.preventDefault(); nudge(-step); return; }
    if (event.key === "PageUp") { event.preventDefault(); nudge(step * 10); return; }
    if (event.key === "PageDown") { event.preventDefault(); nudge(-step * 10); return; }
    if (event.key === "Home" && min !== undefined) { event.preventDefault(); set(min); setDraft(null); }
    if (event.key === "End" && max !== undefined) { event.preventDefault(); set(max); setDraft(null); }
  };

  const shown = draft ?? (precision !== undefined ? current.toFixed(precision) : String(current));
  const atMin = min !== undefined && current <= min;
  const atMax = max !== undefined && current >= max;

  return (
    <div className={cx("td-stepper", "td-react-numfield", containerClassName)} data-disabled={disabled || undefined}>
      <button
        type="button"
        className="td-react-numfield-btn"
        aria-label={`Decrease${label ? ` ${label}` : ""}`}
        disabled={disabled || atMin}
        onClick={() => nudge(-step)}
      >
        −
      </button>
      <Input
        {...props}
        ref={node => {
          inputRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        type="text"
        inputMode="decimal"
        className={cx("td-react-numfield-input", className)}
        containerClassName="td-react-numfield-slot"
        disabled={disabled}
        invalid={invalid}
        leading={prefix}
        trailing={suffix}
        aria-label={label}
        // The input is the spinbutton, so assistive technology reads the value
        // and the bounds rather than the two buttons either side of it.
        role="spinbutton"
        aria-valuenow={current}
        aria-valuemin={min}
        aria-valuemax={max}
        value={shown}
        onKeyDown={handleKey}
        onChange={event => {
          const raw = event.target.value;
          setDraft(raw);
          const parsed = Number(raw);
          if (raw !== "" && raw !== "-" && Number.isFinite(parsed)) set(parsed);
        }}
        onBlur={event => { setDraft(null); props.onBlur?.(event); }}
      />
      <button
        type="button"
        className="td-react-numfield-btn"
        aria-label={`Increase${label ? ` ${label}` : ""}`}
        disabled={disabled || atMax}
        onClick={() => nudge(step)}
      >
        +
      </button>
    </div>
  );
});
