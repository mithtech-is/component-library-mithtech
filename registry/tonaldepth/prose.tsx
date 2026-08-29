import { forwardRef, type HTMLAttributes } from "react";
import "./tonaldepth-prose.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export type TonalDepthProseSize = "sm" | "md" | "lg";

export interface TonalDepthProseProps extends HTMLAttributes<HTMLDivElement> {
  size?: TonalDepthProseSize;
  /** Sets the prose on its own raised panel rather than the page surface. */
  framed?: boolean;
}

export const TonalDepthProse = forwardRef<HTMLDivElement, TonalDepthProseProps>(function TonalDepthProse(
  { size = "md", framed = false, className, ...props }, ref,
) {
  return <div {...props} ref={ref} className={cx("td-mk-prose", `td-mk-prose--${size}`, framed && "td-mk-prose--framed", className)} />;
});
