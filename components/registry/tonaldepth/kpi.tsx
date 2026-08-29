import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-kpi.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export type TonalDepthKpiTrend = "up" | "down" | "neutral";

export interface TonalDepthKpiCardProps extends HTMLAttributes<HTMLElement> {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  trend?: TonalDepthKpiTrend;
  visualization?: ReactNode;
}

export const TonalDepthKpiCard = forwardRef<HTMLElement, TonalDepthKpiCardProps>(function TonalDepthKpiCard(
  { label, value, delta, trend = "neutral", visualization, className, ...props }, ref,
) {
  return (
    <article {...props} ref={ref} className={cx("td-kpi", "td-registry-kpi", className)}>
      <span className="td-kpi-eyebrow">{label}</span>
      <strong className="td-kpi-value">{value}</strong>
      {delta !== undefined ? <span className={cx("td-kpi-delta", `td-kpi-delta--${trend}`)}>{delta}</span> : null}
      {visualization ? <div className="td-kpi-spark" aria-hidden="true">{visualization}</div> : null}
    </article>
  );
});

export interface TonalDepthKpiGridProps extends HTMLAttributes<HTMLDivElement> {}

export const TonalDepthKpiGrid = forwardRef<HTMLDivElement, TonalDepthKpiGridProps>(function TonalDepthKpiGrid({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={cx("td-kpi-grid", className)} />;
});
