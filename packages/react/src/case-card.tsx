import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import { ArrowRightIcon, LAMP_WEIGHT } from "./icons";
import "./case-card.css";

export interface CaseCardMetric {
  label: ReactNode;
  value: ReactNode;
}

export interface CaseCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  eyebrow?: ReactNode;
  title: ReactNode;
  summary?: ReactNode;
  metrics?: CaseCardMetric[];
  visual?: ReactNode;
  href?: string;
  cta?: ReactNode;
}

export const CaseCard = forwardRef<HTMLElement, CaseCardProps>(function CaseCard(
  { eyebrow, title, summary, metrics, visual, href, cta = "Read the case study", className, ...props },
  ref,
) {
  return (
    <article {...props} ref={ref} className={cx("td-mk-case", href && "td-mk-case--link", className)}>
      {visual ? <div className="td-mk-case-visual">{visual}</div> : null}
      {eyebrow ? <p className="td-mk-case-eyebrow">{eyebrow}</p> : null}
      <h3 className="td-mk-case-title">
        {href ? <a className="td-mk-case-titlelink" href={href}>{title}</a> : title}
      </h3>
      {summary ? <p className="td-mk-case-summary">{summary}</p> : null}
      {metrics?.length ? (
        <dl className="td-mk-case-metrics">
          {metrics.map((metric, index) => (
            <div className="td-mk-case-metric" key={index}>
              <dt className="td-mk-case-metric-label">{metric.label}</dt>
              <dd className="td-mk-case-metric-value">{metric.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {href ? (
        <span className="td-mk-case-cta" aria-hidden="true">
          {cta}
          <ArrowRightIcon weight={LAMP_WEIGHT} className="td-mk-case-arrow" aria-hidden="true" />
        </span>
      ) : null}
    </article>
  );
});

export interface CaseCardGridProps extends HTMLAttributes<HTMLDivElement> {}

export const CaseCardGrid = forwardRef<HTMLDivElement, CaseCardGridProps>(function CaseCardGrid(
  { className, ...props }, ref,
) {
  return <div {...props} ref={ref} className={cx("td-mk-case-grid", className)} />;
});
