import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import "./tonaldepth-skeleton.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/** What the placeholder is standing in for. */
export type TonalDepthSkeletonShape = "text" | "block" | "circle";

export interface TonalDepthSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  shape?: TonalDepthSkeletonShape;
  /** How many lines, for `text`. The last one is drawn short, the way prose ends. */
  lines?: number;
  /** Any CSS length. `text` sets its own height from the line. */
  width?: number | string;
  height?: number | string;
  /**
   * Off for a page that draws many at once.
   *
   * Twenty shimmering rows is a page that looks like it is failing rather than
   * loading, and the animation is the first thing to cost frames on a slow
   * device — which is exactly the device showing the placeholder longest.
   */
  animated?: boolean;
  /**
   * What a screen reader is told while this stands in for content. Announced
   * once for the region, not once per bar.
   */
  label?: string;
}

const TonalDepthsize = (value: number | string | undefined) =>
  value === undefined ? undefined : typeof value === "number" ? `${value}px` : value;

/**
 * The shape of content that has not arrived.
 *
 * **It is a well, not a grey box.** A placeholder is the absence of content,
 * and content in this system is recessed ([[L32]]) — so it is carved into the
 * surface at the same depth the real thing will sit at, and the sweep that
 * crosses it is light moving over a groove rather than a bar sliding along a
 * track. When the content lands, nothing about the depth changes; only what is
 * in the recess does.
 *
 * **It reports itself once.** The wrapper carries `role="status"` and
 * `aria-busy`, and the bars inside are hidden — a reader being told "loading"
 * eleven times for one card is worse than not being told at all.
 *
 * Give it the measure of what is coming. A placeholder that is the wrong TonalDepthsize
 * makes the page jump when the content arrives, which is the whole thing it
 * exists to prevent.
 */
export const TonalDepthSkeleton = forwardRef<HTMLDivElement, TonalDepthSkeletonProps>(function TonalDepthSkeleton(
  { shape = "text", lines = 3, width, height, animated = true, label = "Loading", className, style, ...props },
  ref,
) {
  const bars = shape === "text" ? Math.max(1, lines) : 1;
  return (
    <div
      {...props}
      ref={ref}
      role="status"
      aria-busy="true"
      aria-label={label}
      data-shape={shape}
      data-animated={animated || undefined}
      className={cx("td-registry-skeleton", className)}
      style={{ ...style, width: TonalDepthsize(width), height: shape === "text" ? undefined : TonalDepthsize(height) } as CSSProperties}
    >
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="td-registry-skeleton-bar"
          /* The last line of a paragraph stops short. Every bar the same
             length reads as a table, which is a different promise about what
             is coming. */
          data-last={shape === "text" && bars > 1 && i === bars - 1 ? "" : undefined}
        />
      ))}
    </div>
  );
});
