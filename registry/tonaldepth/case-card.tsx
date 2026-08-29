import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react";
import "./tonaldepth-case-card.css";

const LAMP_WEIGHT = "fill" as const;

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthCaseCardMetric {
  label: ReactNode;
  value: ReactNode;
}

export interface TonalDepthCaseCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  eyebrow?: ReactNode;
  title: ReactNode;
  summary?: ReactNode;
  metrics?: TonalDepthCaseCardMetric[];
  visual?: ReactNode;
  href?: string;
  cta?: ReactNode;
}

export const TonalDepthCaseCard = forwardRef<HTMLElement, TonalDepthCaseCardProps>(function TonalDepthCaseCard(
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

export interface TonalDepthCaseCardGridProps extends HTMLAttributes<HTMLDivElement> {}

export const TonalDepthCaseCardGrid = forwardRef<HTMLDivElement, TonalDepthCaseCardGridProps>(function TonalDepthCaseCardGrid(
  { className, ...props }, ref,
) {
  return <div {...props} ref={ref} className={cx("td-mk-case-grid", className)} />;
});
