import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-page-patterns.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

interface TonalDepthPatternHeadingProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

function TonalDepthPatternHeading({ title, description, actions }: TonalDepthPatternHeadingProps) {
  return <header className="td-page-head"><div><h2 className="td-page-title">{title}</h2>{description ? <p className="td-page-sub">{description}</p> : null}</div>{actions ? <div className="td-page-actions">{actions}</div> : null}</header>;
}

export interface TonalDepthDashboardPageProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  filters?: ReactNode;
  metrics?: ReactNode;
  children: ReactNode;
}

export const TonalDepthDashboardPage = forwardRef<HTMLElement, TonalDepthDashboardPageProps>(function TonalDepthDashboardPage(
  { title, description, actions, filters, metrics, children, className, ...props }, ref,
) {
  return <section {...props} ref={ref} className={cx("td-registry-page-pattern", className)}>
    <TonalDepthPatternHeading title={title} description={description} actions={actions} />
    {filters ? <div className="td-fbar">{filters}</div> : null}
    {metrics ? <div className="td-registry-pattern-metrics">{metrics}</div> : null}
    <div className="td-bento">{children}</div>
  </section>;
});

export interface TonalDepthDashboardPanelProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  meta?: ReactNode;
  span?: 1 | 2 | "full";
}

export const TonalDepthDashboardPanel = forwardRef<HTMLElement, TonalDepthDashboardPanelProps>(function TonalDepthDashboardPanel(
  { title, meta, span = 1, children, className, ...props }, ref,
) {
  const titleId = useId();
  const spanClass = span === 2 ? "td-bento-cell--span2" : span === "full" ? "td-bento-cell--span-full" : undefined;
  return <article {...props} ref={ref} aria-labelledby={title ? titleId : props["aria-labelledby"]} className={cx("td-panel", "td-registry-panel", spanClass, className)}>
    {title || meta ? <header className="td-panel-head">{title ? <h3 id={titleId} className="td-panel-title">{title}</h3> : <span />}{meta ? <span className="td-panel-sub">{meta}</span> : null}</header> : null}
    {children}
  </article>;
});

export interface TonalDepthDataManagementPageProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export const TonalDepthDataManagementPage = forwardRef<HTMLElement, TonalDepthDataManagementPageProps>(function TonalDepthDataManagementPage(
  { title, description, actions, toolbar, footer, children, className, ...props }, ref,
) {
  return <section {...props} ref={ref} className={cx("td-registry-page-pattern", className)}>
    <TonalDepthPatternHeading title={title} description={description} actions={actions} />
    {toolbar ? <div className="td-fbar">{toolbar}</div> : null}
    <div className="td-panel td-registry-panel">{children}</div>
    {footer ? <footer className="td-registry-pattern-footer">{footer}</footer> : null}
  </section>;
});

export type TonalDepthPageStateVariant = "empty" | "loading" | "error";

export interface TonalDepthPageStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  variant: TonalDepthPageStateVariant;
  title: ReactNode;
  description?: ReactNode;
  illustration?: ReactNode;
  action?: ReactNode;
}

export const TonalDepthPageState = forwardRef<HTMLDivElement, TonalDepthPageStateProps>(function TonalDepthPageState(
  { variant, title, description, illustration, action, className, ...props }, ref,
) {
  const role = variant === "error" ? "alert" : "status";
  return <div {...props} ref={ref} role={role} aria-live={variant === "error" ? "assertive" : "polite"} aria-busy={variant === "loading" || undefined} className={cx("td-empty", `td-registry-page-state--${variant}`, className)}>
    {illustration ? <div className="td-empty-art" aria-hidden="true">{illustration}</div> : null}
    {variant === "loading" && !illustration ? <div className="td-loading-dots" aria-hidden="true"><span /><span /><span /></div> : null}
    <strong className="td-empty-title">{title}</strong>
    {description ? <p className="td-empty-text">{description}</p> : null}
    {action ? <div className="td-registry-pattern-actions">{action}</div> : null}
  </div>;
});
