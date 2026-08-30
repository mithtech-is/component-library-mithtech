import { forwardRef, type HTMLAttributes } from "react";
import "./tonaldepth-badge.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export type TonalDepthBadgeVariant = "neutral" | "brand" | "success" | "accent" | "danger";

export interface TonalDepthBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TonalDepthBadgeVariant;
  /**
   * A category dot before the label, lit by `variant`.
   *
   * Off by default: a bare pill is the common badge, and a dot on every one of
   * them stops meaning anything. Turn it on where the pill names a *category*
   * or a *state* the reader is meant to read off the colour — a hero eyebrow,
   * a row of integration pills.
   *
   * It is drawn as a lens seated in a socket ([[L25]]), never as a painted
   * disc, and it carries the same `dot` name and the same `.td-lamp` class
   * `Button` uses, so the two do not diverge into two ways of saying the same
   * thing. `variant="neutral"` shows the unlit lens — grey glass — which is
   * what "no category" looks like rather than no dot at all.
   */
  dot?: boolean;
}

const TonalDepthvariants: Record<TonalDepthBadgeVariant, string> = {
  neutral: "",
  brand: "td-badge--brand",
  success: "td-badge--green",
  accent: "td-badge--accent",
  danger: "td-badge--brand td-registry-badge--danger",
};

export const TonalDepthBadge = forwardRef<HTMLSpanElement, TonalDepthBadgeProps>(function TonalDepthBadge(
  { variant = "neutral", dot = false, className, children, ...props },
  ref,
) {
  return (
    <span {...props} ref={ref} className={cx("td-badge", "td-registry-badge", TonalDepthvariants[variant], className)}>
      {/* `aria-hidden`: the dot repeats the category the label already says. A
          badge whose colour carries meaning the words do not is a badge that
          fails a screen reader whatever this element announces. */}
      {dot ? <span className="td-lamp td-registry-badge-dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
});
