"use client";

import { forwardRef, useState, type KeyboardEvent, type SVGProps } from "react";
import "./tonaldepth-rating.css";

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

/* A rating star. Phosphor has one, but the set needs it filled and solid at
   14px, where Phosphor's reads as an outline with a pinched centre. */
const STAR = "M239.2 97.4A16.4 16.4 0 0 0 224.6 86l-59.5-4.3l-22.9-55.5a16.4 16.4 0 0 0-30.4 0L88.9 81.7L29.4 86a16.4 16.4 0 0 0-9.3 28.8l45.5 39.4l-13.9 58.1a16.4 16.4 0 0 0 24.5 17.8l51-31.1l51 31.1a16.4 16.4 0 0 0 24.5-17.8l-13.9-58.1l45.5-39.4a16.4 16.4 0 0 0 4.9-17.4Z";

/** The accept mark. A bare fat tick — Phosphor's circled check read as a badge. */
function TdStar(props: TdIconProps) {
  return <TdGlyph viewBox="0 0 256 256" d={STAR} {...props} />;
}

const StarIcon = TdStar;

export interface TonalDepthRatingProps {
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
const TonalDepthStar = () => <StarIcon weight={LAMP_WEIGHT}

export const TonalDepthRating = forwardRef<HTMLDivElement, TonalDepthRatingProps>(function TonalDepthRating(
  {
    value, defaultValue, onValueChange, max = 5, showValue = false, count,
    readOnly = false, size = "md", inset = false, label = "TonalDepthRating", disabled, className, name,
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
              <TonalDepthStar />
              {state === "half" ? <TonalDepthStar /> : null}
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
              <TonalDepthStar />
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
