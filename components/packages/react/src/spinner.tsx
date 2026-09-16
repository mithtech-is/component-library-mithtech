import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "./utils";
import "./spinner.css";

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  /** Diameter in px. Default 18. */
  size?: number;
  /**
   * Ring thickness in px. Defaults to roughly a ninth of the size, so the ring
   * stays proportional as it scales — a fixed 2px ring reads as a hairline at
   * 32px and as a doughnut at 12px.
   */
  thickness?: number;
  /**
   * What assistive tech announces. Default `"Loading"`.
   *
   * The spinner carries `role="status"`, so this is a live-region label, not
   * decoration — name the thing that is loading where you can (`"Loading
   * invoices"`), because "Loading" on its own tells a screen-reader user only
   * that something, somewhere, is.
   */
  label?: string;
}

/**
 * An indeterminate busy indicator — the ring that turns while something is on
 * its way and no progress figure exists to show.
 *
 * The ring, the papaya arc that reads as the moving light, and the spin are the
 * base `.td-spinner` in `tonaldepth-core` ([[L16]]); this component sizes it and
 * carries the accessible name. It respects `prefers-reduced-motion` by slowing
 * rather than stopping — a reader who asks for less motion still needs to know
 * something is working.
 *
 * **Not `Progress` / `Ring`.** Reach for those the moment a *determinate* figure
 * exists — a percentage, a step count. A spinner says "working"; a progress bar
 * or ring says "this far". **Not `Skeleton`**, which stands in for content whose
 * shape is known while it loads; a spinner is for a wait with no shape to show.
 */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = 18, thickness, label = "Loading", className, style, ...props },
  ref,
) {
  return (
    <span
      {...props}
      ref={ref}
      role="status"
      aria-label={label}
      className={cx("td-spinner", "td-react-spinner", className)}
      style={{ width: size, height: size, borderWidth: thickness ?? Math.max(1.5, Math.round(size / 9)), ...style }}
    />
  );
});
