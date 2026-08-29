import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "./utils";
import "./badge.css";

export type BadgeVariant = "neutral" | "brand" | "success" | "accent" | "danger";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  neutral: "",
  brand: "td-badge--brand",
  success: "td-badge--green",
  accent: "td-badge--accent",
  danger: "td-badge--brand td-react-badge--danger",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = "neutral", className, ...props },
  ref,
) {
  return <span {...props} ref={ref} className={cx("td-badge", "td-react-badge", variants[variant], className)} />;
});
