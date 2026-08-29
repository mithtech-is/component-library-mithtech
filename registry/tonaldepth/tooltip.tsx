import { cloneElement, forwardRef, useId, type HTMLAttributes, type ReactElement, type ReactNode } from "react";
import "./tonaldepth-tooltip.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthTooltipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "content" | "children"> {
  content: ReactNode;
  children: ReactElement<Record<string, unknown>>;
  open?: boolean;
}

export const TonalDepthTooltip = forwardRef<HTMLSpanElement, TonalDepthTooltipProps>(function TonalDepthTooltip(
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
