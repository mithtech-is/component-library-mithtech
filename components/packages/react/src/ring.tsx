import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./ring.css";

export type RingTone = "brand" | "accent" | "green" | "error";

export interface RingProps extends HTMLAttributes<HTMLDivElement> {
  /** How far along, read against `max`. */
  value: number;
  /** The value that counts as full. Default 100. */
  max?: number;
  /** Diameter in px. Default 72. */
  size?: number;
  /** The colour of the fill arc. Default `"brand"`. */
  tone?: RingTone;
  /**
   * What sits in the centre. Defaults to the rounded percentage; pass a node of
   * your own (a fraction, an icon) or `null` for an empty ring.
   */
  children?: ReactNode;
  /**
   * Accessible name — `"Disk used"`, `"Goal"`. Set it, or pass `aria-label`:
   * the ring is a `progressbar`, and one with no name reaches a screen reader as
   * an unlabelled meter.
   */
  label?: string;
}

/**
 * A determinate figure drawn as a circle — the round sibling of `Progress`.
 *
 * The track, the papaya fill arc and the centred value are the base `.td-ring`
 * in `tonaldepth-core` ([[L16]]); the arc is a stroked circle whose dash offset
 * is driven by `--pct`, so the fill is the light travelling the edge, not a
 * wedge of brand colour ([[L11]]). Reach for it where a compact percentage reads
 * better as a ring than a bar — a KPI tile, a quota, a goal.
 *
 * **Not `Spinner`** — that is for an *indeterminate* wait with no figure. **Not
 * `Progress`** unless you want the same figure as a horizontal bar. **Not
 * `Gauge`**, which is the open arc for a value in a range with a scale, rather
 * than a closed ring reading 0–100%.
 */
export const Ring = forwardRef<HTMLDivElement, RingProps>(function Ring(
  { value, max = 100, size = 72, tone = "brand", children, label, className, style, ...props },
  ref,
) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const radius = size * 0.4;
  const circumference = 2 * Math.PI * radius;
  const centre = size / 2;

  return (
    <div
      {...props}
      ref={ref}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      data-tone={tone}
      className={cx("td-ring", "td-react-ring", className)}
      style={{ ["--size"]: `${size}px`, ["--pct"]: pct, ["--circ"]: circumference, ...style } as CSSProperties}
    >
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="td-ring-track" cx={centre} cy={centre} r={radius} />
        <circle className="td-ring-fill" cx={centre} cy={centre} r={radius} />
      </svg>
      {children === undefined ? (
        <span className="td-ring-value">{Math.round(pct * 100)}%</span>
      ) : children === null ? null : (
        <span className="td-ring-value">{children}</span>
      )}
    </div>
  );
});
