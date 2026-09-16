import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./uptime.css";

export type UptimeState = "up" | "warn" | "down";

export interface UptimeBar {
  /** The interval's status. Default `"up"`. */
  state?: UptimeState;
  /** Hover detail for this interval — a date and what happened. Shown as a native tooltip. */
  label?: string;
}

export interface UptimeRow {
  /** The service's name. */
  name: ReactNode;
  /** One entry per interval, oldest to newest. A bare state, or `{ state, label }` for hover detail. */
  bars: Array<UptimeState | UptimeBar>;
  /** The period's uptime figure — `"99.97%"`. Optional. */
  pct?: ReactNode;
}

export interface UptimeBarsProps extends HTMLAttributes<HTMLDivElement> {
  /** One row per service. */
  rows: UptimeRow[];
}

/**
 * A status-page uptime strip — one row per service, a bar per interval, and the
 * period's figure at the end.
 *
 * The grid, the bars and the state colours (up green, warn papaya, down deep) are
 * the base `.td-uptime*` in `tonaldepth-core` ([[L16]]); state is a category
 * carried by colour, and the reader takes the shape of an outage in at a glance.
 *
 * The bars are a visual summary and are hidden from assistive tech; the service
 * name and the percentage are the row's readable content, so a screen reader
 * hears "commercely 100%" rather than thirty unlabelled cells. Give a bar a
 * `label` for the sighted hover detail — the date and what happened.
 *
 * **Not `Gauge`** — that is one live level. This is a history of many intervals.
 * **Not a chart** in `ChartContainer`; it is a fixed, class-only sparkline with
 * no plotting to supply.
 */
export const UptimeBars = forwardRef<HTMLDivElement, UptimeBarsProps>(function UptimeBars(
  { rows, className, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} className={cx("td-uptime", "td-react-uptime", className)}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="td-uptime-row">
          <div className="td-uptime-name">{row.name}</div>
          <div className="td-uptime-bars" aria-hidden="true">
            {row.bars.map((bar, barIndex) => {
              const entry = typeof bar === "string" ? { state: bar } : bar;
              const state = entry.state ?? "up";
              return (
                <div
                  key={barIndex}
                  className="td-uptime-bar"
                  data-state={state === "up" ? undefined : state}
                  title={entry.label}
                />
              );
            })}
          </div>
          {row.pct !== undefined ? <div className="td-uptime-pct">{row.pct}</div> : null}
        </div>
      ))}
    </div>
  );
});
