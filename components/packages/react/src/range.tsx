"use client";

// The track fill is driven from the current value, which means reading it on
// change — so the module is a client boundary.
import { forwardRef, useState, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./range.css";

export interface RangeProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue"> {
  /** Controlled value. Pair it with `onChange`. */
  value?: number;
  /** Uncontrolled starting value. */
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  /** What is being set. Rendered above the track and wired to the input. */
  label?: ReactNode;
  /**
   * The current value in the reader's units — `₹4,50,000`, `12 weeks`. Shown
   * in mono at the end of the label row, because it is a machine value.
   * Given a function it is called with the current number.
   */
  format?: (value: number) => ReactNode;
  /** Show the min and max under the track. */
  showBounds?: boolean;
}

/**
 * A single-value slider on a carved track.
 *
 * It is a real `input[type=range]`, so the keyboard, the pointer and every
 * assistive technology behave natively — the styling reaches the track and the
 * thumb through the vendor pseudo-elements rather than a rebuilt widget.
 *
 * The filled length is the only thing carrying colour, for the same reason
 * `Progress`'s is: it is a measured quantity, not decoration.
 */
export const Range = forwardRef<HTMLInputElement, RangeProps>(function Range(
  { value, defaultValue, min = 0, max = 100, step = 1, label, format, showBounds = false, className, onChange, id, ...props },
  ref,
) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? min);
  const current = value ?? uncontrolled;
  const pct = max === min ? 0 : ((current - min) / (max - min)) * 100;
  const inputId = id ?? `td-range-${String(label ?? "value").replace(/\W+/g, "-").toLowerCase()}`;

  const handle = (event: ChangeEvent<HTMLInputElement>) => {
    if (value === undefined) setUncontrolled(Number(event.target.value));
    onChange?.(event);
  };

  return (
    <div className={cx("td-react-range-wrap", className)}>
      {label !== undefined || format ? (
        <div className="td-react-range-head">
          {label !== undefined ? <label className="td-react-range-label" htmlFor={inputId}>{label}</label> : <span />}
          {format ? <span className="td-react-range-value">{format(current)}</span> : null}
        </div>
      ) : null}
      <input
        {...props}
        ref={ref}
        id={inputId}
        type="range"
        className={cx("td-range", "td-react-range")}
        min={min}
        max={max}
        step={step}
        value={value ?? uncontrolled}
        onChange={handle}
        // The fill is a gradient stop, so the track needs the percentage.
        style={{ ...props.style, ["--pct" as string]: `${pct}%` }}
      />
      {showBounds ? (
        <div className="td-react-range-bounds" aria-hidden="true">
          <span>{format ? format(min) : min}</span>
          <span>{format ? format(max) : max}</span>
        </div>
      ) : null}
    </div>
  );
});
