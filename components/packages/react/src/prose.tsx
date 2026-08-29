import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "./utils";
import "./prose.css";

export type ProseSize = "sm" | "md" | "lg";

export interface ProseProps extends HTMLAttributes<HTMLDivElement> {
  size?: ProseSize;
  /** Sets the prose on its own raised panel rather than the page surface. */
  framed?: boolean;
}

export const Prose = forwardRef<HTMLDivElement, ProseProps>(function Prose(
  { size = "md", framed = false, className, ...props }, ref,
) {
  return <div {...props} ref={ref} className={cx("td-mk-prose", `td-mk-prose--${size}`, framed && "td-mk-prose--framed", className)} />;
});
