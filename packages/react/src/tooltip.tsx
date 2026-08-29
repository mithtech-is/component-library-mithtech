import { cloneElement, forwardRef, useId, type HTMLAttributes, type ReactElement, type ReactNode } from "react";
import { cx } from "./utils";

export interface TooltipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "content" | "children"> {
  content: ReactNode;
  children: ReactElement<Record<string, unknown>>;
  open?: boolean;
}

export const Tooltip = forwardRef<HTMLSpanElement, TooltipProps>(function Tooltip(
  { content, children, open, className, ...props }, ref,
) {
  const id = useId();
  return (
    <span {...props} ref={ref} className={cx("td-tooltip-wrap", className)} data-state={open ? "open" : undefined}>
      {cloneElement(children, { "aria-describedby": children.props["aria-describedby"] ?? id })}
      <span id={id} role="tooltip" className="td-tooltip">{content}</span>
    </span>
  );
});
