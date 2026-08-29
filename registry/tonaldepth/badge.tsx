import { forwardRef, type HTMLAttributes } from "react";
import "./tonaldepth-badge.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export type TonalDepthBadgeVariant = "neutral" | "brand" | "success" | "accent" | "danger";

export interface TonalDepthBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TonalDepthBadgeVariant;
}

const TonalDepthvariants: Record<TonalDepthBadgeVariant, string> = {
  neutral: "",
  brand: "td-badge--brand",
  success: "td-badge--green",
  accent: "td-badge--accent",
  danger: "td-badge--brand td-registry-badge--danger",
};

export const TonalDepthBadge = forwardRef<HTMLSpanElement, TonalDepthBadgeProps>(function TonalDepthBadge(
  { variant = "neutral", className, ...props },
  ref,
) {
  return <span {...props} ref={ref} className={cx("td-badge", "td-registry-badge", TonalDepthvariants[variant], className)} />;
});
