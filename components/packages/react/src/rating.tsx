"use client";

/**
 * A rating, read or set.
 *
 * One component rather than two, because `readOnly` is not a different control
 * — it is the same five stars with the input taken away, and a page usually
 * shows both forms within a few hundred pixels of each other (the average at
 * the top, the reader's own at the bottom). Two components would let those two
 * drift into different star shapes.
 */

import { forwardRef, useState, type KeyboardEvent } from "react";
import { cx } from "./utils";
import { LAMP_WEIGHT, StarIcon } from "./icons";
import "./rating.css";

export interface RatingProps {
  /** 0 to `max`. Halves are honoured when `readOnly`. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  max?: number;
  /** Show the number beside the stars. */
  showValue?: boolean;
  /** "128 reviews" — the sample size behind the number. */
  count?: number;
  /** No input. The stars become an image with a label. */
  readOnly?: boolean;
  size?: "md" | "lg";
  /** Seat the whole thing in a carved pill. */
  inset?: boolean;
  label?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
}

/* The set's star, at lamp weight. A half star clips a second copy of it, which
   only reads if the mark is solid. */
const Star = () => <StarIcon weight={LAMP_WEIGHT} aria-hidden="true" />;

export const Rating = forwardRef<HTMLDivElement, RatingProps>(function Rating(
  {
    value, defaultValue, onValueChange, max = 5, showValue = false, count,
    readOnly = false, size = "md", inset = false, label = "Rating", disabled, className, name,
  },
  ref,
) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? 0);
  const current = value ?? uncontrolled;

  const set = (next: number) => {
    if (readOnly || disabled) return;
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  const handleKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (readOnly || disabled) return;
    const step = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1
      : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 0;
    if (step) { event.preventDefault(); set(Math.min(max, Math.max(0, current + step))); return; }
    if (event.key === "Home") { event.preventDefault(); set(0); }
    if (event.key === "End") { event.preventDefault(); set(max); }
  };

  const stars = Array.from({ length: max }, (_, index) => {
    const position = index + 1;
    if (current >= position) return "full" as const;
    if (current >= position - 0.5) return "half" as const;
    return "empty" as const;
  });

  const rootClass = cx("td-rating", size === "lg" && "td-rating--lg", inset && "td-rating--inset", className);

  if (readOnly) {
    return (
      <div ref={ref} className={rootClass} role="img" aria-label={`${label}: ${current} out of ${max}`}>
        <span className="td-rating-stars" aria-hidden="true">
          {stars.map((state, index) => (
            <span key={index} className={cx("td-rating-star", state === "empty" && "td-rating-star--empty", state === "half" && "td-rating-star--half")}>
              <Star />
              {state === "half" ? <Star /> : null}
            </span>
          ))}
        </span>
        {showValue ? <span className="td-rating-value">{current.toFixed(1)}</span> : null}
        {count !== undefined ? <span className="td-rating-count">{count} {count === 1 ? "review" : "reviews"}</span> : null}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={rootClass}
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      data-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKey}
    >
      {/* Reversed in the DOM so the CSS `~` sibling rule can light every star
          to the LEFT of the hovered one, which is the direction a rating fills. */}
      <span className="td-rating-input">
        {Array.from({ length: max }, (_, index) => {
          const position = max - index;
          return (
            <button
              key={position}
              type="button"
              className="td-rating-btn"
              role="radio"
              aria-checked={current === position}
              aria-label={`${position} of ${max}`}
              disabled={disabled}
              tabIndex={-1}
              onClick={() => set(position)}
            >
              <Star />
            </button>
          );
        })}
      </span>
      {name ? <input type="hidden" name={name} value={current} /> : null}
      {showValue ? <span className="td-rating-value">{current.toFixed(1)}</span> : null}
      {count !== undefined ? <span className="td-rating-count">{count} {count === 1 ? "review" : "reviews"}</span> : null}
    </div>
  );
});
