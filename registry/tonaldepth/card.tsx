import { forwardRef, type HTMLAttributes } from "react";
import "./tonaldepth-card.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export type TonalDepthCardDepth = "raised" | "flat" | "inset";

export interface TonalDepthCardProps extends HTMLAttributes<HTMLDivElement> {
  depth?: TonalDepthCardDepth;
  /** `"none"` gives an unpadded plate whose own children own the padding, so a
   * seam drawn between them runs the full width of the card instead of being
   * inset by the card's gutter. */
  padding?: "default" | "none";
}

export const TonalDepthCard = forwardRef<HTMLDivElement, TonalDepthCardProps>(function TonalDepthCard(
  { depth = "raised", padding = "default", className, ...props },
  ref,
) {
  return <div {...props} ref={ref} className={cx("td-panel", `td-registry-card--${depth}`, padding === "none" && "td-registry-card--flush", className)} />;
});

export const TonalDepthCardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function TonalDepthCardHeader(
  { className, ...props }, ref,
) {
  return <div {...props} ref={ref} className={cx("td-panel-head", className)} />;
});

export const TonalDepthCardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(function TonalDepthCardTitle(
  { className, ...props }, ref,
) {
  return <h3 {...props} ref={ref} className={cx("td-panel-title", className)} />;
});

export const TonalDepthCardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function TonalDepthCardContent(
  { className, ...props }, ref,
) {
  return <div {...props} ref={ref} className={cx("td-registry-card-content", className)} />;
});
