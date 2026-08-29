import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "./utils";
import "./card.css";

export type CardDepth = "raised" | "flat" | "inset";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  depth?: CardDepth;
  /** `"none"` gives an unpadded plate whose own children own the padding, so a
   * seam drawn between them runs the full width of the card instead of being
   * inset by the card's gutter. */
  padding?: "default" | "none";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { depth = "raised", padding = "default", className, ...props },
  ref,
) {
  return <div {...props} ref={ref} className={cx("td-panel", `td-react-card--${depth}`, padding === "none" && "td-react-card--flush", className)} />;
});

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardHeader(
  { className, ...props }, ref,
) {
  return <div {...props} ref={ref} className={cx("td-panel-head", className)} />;
});

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(function CardTitle(
  { className, ...props }, ref,
) {
  return <h3 {...props} ref={ref} className={cx("td-panel-title", className)} />;
});

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardContent(
  { className, ...props }, ref,
) {
  return <div {...props} ref={ref} className={cx("td-react-card-content", className)} />;
});
