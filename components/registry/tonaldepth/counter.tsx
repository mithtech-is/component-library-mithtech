"use client";

import { forwardRef, useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-counter.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthCounterProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** The number to arrive at. The count runs from zero to this. */
  value: number;
  /** What the number is. Set in mono caps beneath it. */
  label: ReactNode;
  /**
   * The unit, set smaller and in papaya beside the value — `%`, `ms`, `yr`.
   *
   * It is a separate prop rather than part of `value` because the suffix is not
   * counted: animating "98" up to "98%" would run the percent sign through the
   * digits.
   */
  suffix?: ReactNode;
  /** Decimal places to hold while counting. Default 0. */
  precision?: number;
  /** How long the count takes, in milliseconds. Default 1200. */
  duration?: number;
}

/**
 * A statistic that counts up to itself when it is scrolled into view.
 *
 * This is the marketing form of `KpiCard`: the same label-and-value pair with
 * the plate taken away and the value set at display size, because a hero stat
 * row is read at a glance from across the page rather than scanned in a grid.
 *
 * Reach for `KpiCard` inside a product — it carries a delta, a trend and a
 * sparkline, and it is server-renderable. Reach for this on a marketing page,
 * where the number is the argument. It is a separate module for the same reason
 * `ReadingProgress` is: the count needs an observer and a timer, and `KpiCard`
 * must stay server-renderable ([[L22]]).
 *
 * The count runs once, on the way in. A number that re-animates every time it
 * crosses the viewport reads as a loading state rather than as a fact.
 */
export const TonalDepthCounter = forwardRef<HTMLDivElement, TonalDepthCounterProps>(function TonalDepthCounter(
  { value, label, suffix, precision = 0, duration = 1200, className, ...props },
  ref,
) {
  const [shown, setShown] = useState(0);
  const host = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = host.current;
    if (!element) return;

    // Someone who has asked for less motion is asking not to watch a number
    // spin. They still want the number.
    //
    // Both capability checks are load-bearing rather than defensive noise: an
    // effect that throws takes the component down, and it does so in exactly
    // the environments that are hardest to debug — jsdom has neither of these,
    // and nor does a stale mobile browser. Without them the fallback is a blank
    // stat rather than a still one.
    const still = typeof matchMedia !== "function" || matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still || typeof IntersectionObserver !== "function") {
      setShown(value);
      return;
    }

    let frame = 0;
    let start = 0;
    const step = (now: number) => {
      start ||= now;
      const t = Math.min(1, (now - start) / duration);
      // Ease out: a counter that decelerates reads as landing on a value, while
      // a linear one reads as having been cut off.
      setShown(value * (1 - (1 - t) ** 3));
      if (t < 1) frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      // Once. Disconnecting here rather than on unmount is what makes the count
      // a one-off rather than something that replays on every scroll past.
      observer.disconnect();
      frame = requestAnimationFrame(step);
    }, { threshold: 0.4 });

    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <div
      {...props}
      ref={node => {
        host.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className={cx("td-registry-counter", className)}
    >
      <span className="td-registry-counter-value">
        {/* The rendered number is the accessible one: a screen reader reads the
            text, so there is no second copy to keep in step. `tabular-nums` in
            the stylesheet is what stops the label jittering under it. */}
        {shown.toFixed(precision)}
        {suffix !== undefined ? <span className="td-registry-counter-suffix">{suffix}</span> : null}
      </span>
      <span className="td-registry-counter-label">{label}</span>
    </div>
  );
});

export interface TonalDepthCounterRowProps extends HTMLAttributes<HTMLDivElement> {}

/** A row of counters that wraps. Even gaps, and no plate — the numbers are the row. */
export const TonalDepthCounterRow = forwardRef<HTMLDivElement, TonalDepthCounterRowProps>(function TonalDepthCounterRow(
  { className, ...props },
  ref,
) {
  return <div {...props} ref={ref} className={cx("td-registry-counter-row", className)} />;
});
