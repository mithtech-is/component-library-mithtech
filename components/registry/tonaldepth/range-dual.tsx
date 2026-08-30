"use client";

import { forwardRef, useState, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-range-dual.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthRangeProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue"> {
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
export const TonalDepthRange = forwardRef<HTMLInputElement, TonalDepthRangeProps>(function TonalDepthRange(
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
    <div className={cx("td-registry-range-wrap", className)}>
      {label !== undefined || format ? (
        <div className="td-registry-range-head">
          {label !== undefined ? <label className="td-registry-range-label" htmlFor={inputId}>{label}</label> : <span />}
          {format ? <span className="td-registry-range-value">{format(current)}</span> : null}
        </div>
      ) : null}
      <input
        {...props}
        // The fill is a gradient stop, so the track needs the percentage. It is
        // set imperatively rather than through `style`: a style object crossing
        // a server boundary is what took fifty-five pages to a 500 while the
        // types stayed green.
        ref={node => {
          node?.style.setProperty("--pct", `${pct}%`);
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        id={inputId}
        type="range"
        className={cx("td-range", "td-registry-range")}
        min={min}
        max={max}
        step={step}
        value={value ?? uncontrolled}
        onChange={handle}
      />
      {showBounds ? (
        <div className="td-registry-range-bounds" aria-hidden="true">
          <span>{format ? format(min) : min}</span>
          <span>{format ? format(max) : max}</span>
        </div>
      ) : null}
    </div>
  );
});

/* ── Two thumbs ───────────────────────────────────────────────────────── */

export interface TonalDepthRangeDualProps {
  /** `[low, high]`. The pair is always ordered, whichever thumb moved. */
  value?: [number, number];
  defaultValue?: [number, number];
  onValueChange?: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  format?: (value: number) => ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * `TonalDepthRange`'s two-thumb form — a span rather than a point.
 *
 * Two real `input[type=range]` elements stacked, so each thumb keeps its
 * native keyboard and its own accessible name; the track and the fill between
 * them are drawn underneath. The pair is sorted on every change, so dragging
 * the low thumb past the high one swaps them instead of inverting the fill.
 */
export const TonalDepthRangeDual = forwardRef<HTMLInputElement, TonalDepthRangeDualProps>(function TonalDepthRangeDual(
  { value, defaultValue, onValueChange, min = 0, max = 100, step = 1, label = "TonalDepthRange", format, disabled, className },
  ref,
) {
  const [uncontrolled, setUncontrolled] = useState<[number, number]>(defaultValue ?? [min, max]);
  const current = value ?? uncontrolled;
  const [low, high] = current;

  const set = (next: [number, number]) => {
    const ordered: [number, number] = next[0] <= next[1] ? next : [next[1], next[0]];
    if (value === undefined) setUncontrolled(ordered);
    onValueChange?.(ordered);
  };

  const span = max === min ? 1 : max - min;
  const leftPct = ((low - min) / span) * 100;
  const widthPct = ((high - low) / span) * 100;

  return (
    <div className={cx("td-registry-range-wrap", className)} data-disabled={disabled || undefined}>
      <div className="td-registry-range-head">
        <span className="td-registry-range-label">{label}</span>
        <span className="td-registry-range-value">
          {format ? format(low) : low} – {format ? format(high) : high}
        </span>
      </div>
      <div className="td-dualrange">
        <div className="td-dualrange-track" aria-hidden="true" />
        <div
          className="td-dualrange-fill"
          aria-hidden="true"
          ref={node => {
            node?.style.setProperty("left", `${leftPct}%`);
            node?.style.setProperty("width", `${widthPct}%`);
          }}
        />
        <input
          ref={ref}
          type="range"
          aria-label={`${label} minimum`}
          min={min} max={max} step={step} value={low} disabled={disabled}
          onChange={event => set([Number(event.target.value), high])}
        />
        <input
          type="range"
          aria-label={`${label} maximum`}
          min={min} max={max} step={step} value={high} disabled={disabled}
          onChange={event => set([low, Number(event.target.value)])}
        />
      </div>
      <div className="td-dualrange-vals" aria-hidden="true">
        <span>{format ? format(min) : min}</span>
        <span>{format ? format(max) : max}</span>
      </div>
    </div>
  );
});
