import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-feature-card.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export type TonalDepthFeatureCardTone = "neutral" | "brand" | "accent" | "green";

export interface TonalDepthFeatureCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  icon?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  points?: ReactNode[];
  footer?: ReactNode;
  href?: string;
  tone?: TonalDepthFeatureCardTone;
}

export const TonalDepthFeatureCard = forwardRef<HTMLElement, TonalDepthFeatureCardProps>(function TonalDepthFeatureCard(
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

export interface TonalDepthFeatureGridProps extends HTMLAttributes<HTMLDivElement> {
  columns?: 2 | 3 | 4;
}

export const TonalDepthFeatureGrid = forwardRef<HTMLDivElement, TonalDepthFeatureGridProps>(function TonalDepthFeatureGrid(
  { columns = 3, className, ...props }, ref,
) {
  return <div {...props} ref={ref} className={cx("td-mk-feature-grid", `td-mk-feature-grid--${columns}`, className)} />;
});
