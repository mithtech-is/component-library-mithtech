import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./progress.css";

export type ProgressTone = "brand" | "accent" | "green" | "error";

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * How far along, 0–100. Values outside the range are clamped.
   *
   * Required unless `indeterminate` is set — a determinate meter with no value
   * is a meter reporting zero, which is a worse answer than not rendering one.
   * The component warns in development if it is left off.
   */
  value?: number;
  /** What is progressing — "Deployment", "Migration". Rendered above the track. */
  label?: ReactNode;
  /**
   * The machine face of the count, set in mono beside the label — `4 of 12`.
   * Omit it and only the percentage is reported.
   */
  detail?: ReactNode;
  /** Show the percentage at the end of the meter line. Default true. */
  showValue?: boolean;
  /**
   * A verdict on the number, at the end of the meter line — a `Badge` reading
   * "On track", "12d", "Overdue".
   *
   * This is what turns a meter into an obligation. 78% of a compliance window
   * elapsed is not good or bad on its own; the badge is where the caller says
   * which, because only the caller knows the deadline. It replaces the
   * percentage when both would otherwise sit in the same place.
   */
  status?: ReactNode;
  /** Which category the filled length carries. */
  tone?: ProgressTone;
  /**
   * A determinate bar reports a real fraction. Leave `indeterminate` off unless
   * the total genuinely is not known — a bar that animates forever while a
   * number is available is a worse answer than the number.
   */
  indeterminate?: boolean;
}

/**
 * A determinate progress meter.
 *
 * The track is carved into the surface and the filled length is the one thing
 * that carries colour — a measured quantity, like a chart series, rather than
 * decoration. Everything else is depth.
 *
 * Give it a name: with no `label`, pass `aria-label`, or the meter reaches a
 * screen reader as an unnamed number.
 */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { value, label, detail, showValue = true, status, tone = "brand", indeterminate = false, className, ...props },
  ref,
) {
  if (value === undefined && !indeterminate) {
    // Silently reporting 0% is indistinguishable from a meter saying nothing
    // has happened yet, which is the wrong thing to say when the value is
    // simply absent.
    console.warn("Progress: pass `value`, or set `indeterminate` when the total is genuinely unknown.");
  }
  const pct = Math.max(0, Math.min(100, Math.round(value ?? 0)));
  const hasHead = label !== undefined || detail !== undefined || status !== undefined || showValue;
  return (
    <div {...props} ref={ref} className={cx("td-react-progress-wrap", className)}>
      {hasHead ? (
        <p className="td-react-progress-head">
          <span className="td-react-progress-name">
            {label}
            {label !== undefined && detail !== undefined ? <span className="td-react-progress-sep"> · </span> : null}
            {detail !== undefined ? <span className="td-react-progress-detail">{detail}</span> : null}
          </span>
          {status !== undefined
            ? <span className="td-react-progress-status">{status}</span>
            : showValue && !indeterminate ? <span className="td-react-progress-value">{pct}%</span> : null}
        </p>
      ) : null}
      <div
        className={cx("td-progress", "td-react-progress", `td-react-progress--${tone}`, indeterminate && "td-react-progress--indeterminate")}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : pct}
        aria-valuemin={indeterminate ? undefined : 0}
        aria-valuemax={indeterminate ? undefined : 100}
        aria-label={props["aria-label"] ?? (typeof label === "string" ? label : undefined)}
      >
        <div className="td-progress-bar td-react-progress-bar" style={indeterminate ? undefined : { width: `${pct}%` }} />
      </div>
    </div>
  );
});
