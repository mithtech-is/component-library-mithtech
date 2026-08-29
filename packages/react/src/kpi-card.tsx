import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./kpi-card.css";

export type KpiTrend = "up" | "down" | "neutral";
export interface KpiCardProps extends HTMLAttributes<HTMLElement> {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  trend?: KpiTrend;
  visualization?: ReactNode;
}

export const KpiCard = forwardRef<HTMLElement, KpiCardProps>(function KpiCard(
  { label, value, delta, trend = "neutral", visualization, className, ...props }, ref,
) {
  return (
    <article {...props} ref={ref} className={cx("td-kpi", "td-react-kpi", className)}>
      <span className="td-kpi-eyebrow">{label}</span>
      <strong className="td-kpi-value">{value}</strong>
      {delta !== undefined ? <span className={cx("td-kpi-delta", `td-kpi-delta--${trend}`)}>{delta}</span> : null}
      {visualization ? <div className="td-kpi-spark" aria-hidden="true">{visualization}</div> : null}
    </article>
  );
});

export interface KpiGridProps extends HTMLAttributes<HTMLDivElement> {}
export const KpiGrid = forwardRef<HTMLDivElement, KpiGridProps>(function KpiGrid({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={cx("td-kpi-grid", className)} />;
});
