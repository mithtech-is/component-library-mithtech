import { cloneElement, forwardRef, useId, type HTMLAttributes, type ReactElement, type ReactNode } from "react";
import "./tonaldepth-tooltip.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * How much the hint is.
 *
 * `hint` is the default: a line of text explaining a control. `peek` is the
 * preview card — a record's headline facts, shown so the reader can decide
 * whether the trip is worth taking. Same trigger, same timing, same dismissal;
 * it is wider, it lays out, and it hangs off a dotted reference rather than
 * appearing over a button.
 */
export type TonalDepthTooltipVariant = "hint" | "peek";

export interface TonalDepthTooltipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "content" | "children"> {
  content: ReactNode;
  children: ReactElement<Record<string, unknown>>;
  open?: boolean;
  /** `peek` is the preview-card form. Default `hint`. */
  variant?: TonalDepthTooltipVariant;
}

/**
 * A hint attached to something, shown on hover and on focus.
 *
 * At `variant="peek"` it becomes the preview card: enough of a record —
 * a customer, an invoice, a deploy — for the reader to decide whether to follow
 * the link at all. That is the same mechanism doing a different job, which is
 * why it is a variant rather than its own component; what changes is the width,
 * the padding and the reference's underline.
 *
 * **Not `Dialog`.** Both of these vanish when the pointer leaves, so nothing
 * inside either one can be clicked, selected or copied. If the reader needs to
 * act on what they see, it is a dialog or a popover — a tooltip that contains a
 * button is a button nobody can reach.
 *
 * The trigger must be focusable, or the content exists only for a mouse. Wrap a
 * `button`, an `a`, or an element you have given a `tabIndex`.
 */
export const TonalDepthTooltip = forwardRef<HTMLSpanElement, TonalDepthTooltipProps>(function TonalDepthTooltip(
  { content, children, open, variant = "hint", className, ...props }, ref,
) {
  const id = useId();
  return (
    <span
      {...props}
      ref={ref}
      className={cx("td-tooltip-wrap", variant === "peek" && "td-registry-peek-wrap", className)}
      data-state={open ? "open" : undefined}
    >
      {cloneElement(children, { "aria-describedby": children.props["aria-describedby"] ?? id })}
      <span id={id} role="tooltip" className={cx("td-tooltip", variant === "peek" && "td-registry-peek")}>{content}</span>
    </span>
  );
});
