import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./feature-card.css";

export type FeatureCardTone = "neutral" | "brand" | "accent" | "green";

export interface FeatureCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  icon?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  points?: ReactNode[];
  footer?: ReactNode;
  href?: string;
  tone?: FeatureCardTone;
}

export const FeatureCard = forwardRef<HTMLElement, FeatureCardProps>(function FeatureCard(
  { icon, eyebrow, title, children, points, footer, href, tone = "neutral", className, ...props },
  ref,
) {
  return (
    <article {...props} ref={ref} className={cx("td-mk-feature", `td-mk-feature--${tone}`, href && "td-mk-feature--link", className)}>
      {icon ? <span className="td-mk-feature-icon" aria-hidden="true">{icon}</span> : null}
      {eyebrow ? <p className="td-mk-feature-eyebrow">{eyebrow}</p> : null}
      <h3 className="td-mk-feature-title">
        {href ? <a className="td-mk-feature-titlelink" href={href}>{title}</a> : title}
      </h3>
      {children ? <p className="td-mk-feature-body">{children}</p> : null}
      {points?.length ? (
        <ul className="td-mk-feature-points">
          {points.map((point, index) => <li key={index}>{point}</li>)}
        </ul>
      ) : null}
      {footer ? <div className="td-mk-feature-footer">{footer}</div> : null}
    </article>
  );
});

export interface FeatureGridProps extends HTMLAttributes<HTMLDivElement> {
  columns?: 2 | 3 | 4;
}

export const FeatureGrid = forwardRef<HTMLDivElement, FeatureGridProps>(function FeatureGrid(
  { columns = 3, className, ...props }, ref,
) {
  return <div {...props} ref={ref} className={cx("td-mk-feature-grid", `td-mk-feature-grid--${columns}`, className)} />;
});
