"use client";

import { forwardRef, useEffect, useRef, useState, type HTMLAttributes } from "react";
import "./tonaldepth-reading-progress.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthReadingProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * What is being read. A CSS selector for the article element, or nothing to
   * measure the whole document.
   *
   * Measuring the article rather than the page is the difference between "you
   * are 90% down this page" and "you have read 90% of the piece" — a long
   * footer makes those two very different numbers, and only the second is what
   * the reader is asking.
   */
  target?: string;
  /** Which category the filled length carries. Default `brand`. */
  tone?: ProgressTone;
  /** Track thickness in pixels. Default 2 — this is chrome, not a meter. */
  height?: number;
  /** Accessible name. Default "Reading progress". */
  label?: string;
}

/**
 * The bar across the top of the viewport that reports how far into a piece the
 * reader has come.
 *
 * It is `Progress` with three things taken away and one added: no label, no
 * percentage, no track — and a scroll position it works out for itself. That
 * last part is why it is its own module rather than a `Progress` variant:
 * `Progress` is server-renderable and is used on dashboard pages by the dozen,
 * and putting a scroll listener in it would push a client boundary onto every
 * one of them ([[L22]]).
 *
 * Reach for `Progress` when a number is the point — a migration, an upload, a
 * quota. Reach for this when the reader should be able to feel their position
 * without looking at it.
 */
export const TonalDepthReadingProgress = forwardRef<HTMLDivElement, TonalDepthReadingProgressProps>(function TonalDepthReadingProgress(
  { target, tone = "brand", height = 2, label = "Reading progress", className, ...props },
  ref,
) {
  const [pct, setPct] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    const measure = () => {
      const element = target ? document.querySelector(target) : null;
      if (target && !element) {
        // A selector that matches nothing would otherwise report a confident 0%
        // for the life of the page, which reads as "you have read none of this"
        // rather than as the wiring fault it is.
        console.warn(`TonalDepthReadingProgress: no element matches \`${target}\`; falling back to the document.`);
      }
      const box = element?.getBoundingClientRect();
      // Distance scrolled into the piece, over the distance there is to scroll.
      // Both are clamped because over-scroll (rubber-banding on iOS, an anchor
      // jump past the end) reports positions outside the piece.
      const travelled = box ? -box.top : window.scrollY;
      const distance = box
        ? box.height - window.innerHeight
        : document.documentElement.scrollHeight - window.innerHeight;
      // Nothing to scroll means there is nothing left to read, so the honest
      // answer is 100 rather than 0 — a short piece is not one you have read
      // none of. It shows as a full bar, which is what "you are at the end"
      // looks like everywhere else.
      setPct(distance <= 0 ? 100 : Math.max(0, Math.min(100, (travelled / distance) * 100)));
    };

    // Scroll fires far faster than the screen repaints. Coalescing to one frame
    // keeps a long article from spending its scroll budget on this bar.
    const onScroll = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(measure);
    };

    measure();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame.current);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
    };
  }, [target]);

  return (
    <div
      {...props}
      ref={ref}
      className={cx("td-registry-readingprogress", `td-registry-readingprogress--${tone}`, className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      style={{ ...props.style, ["--td-readingprogress-h" as string]: `${height}px`, ["--td-readingprogress-pct" as string]: `${pct}%` }}
    >
      <div className="td-registry-readingprogress-bar" />
    </div>
  );
});
