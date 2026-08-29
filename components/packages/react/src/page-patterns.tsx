import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./page-patterns.css";

interface PatternHeadingProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}
function PatternHeading({ title, description, actions }: PatternHeadingProps) {
  return <header className="td-page-head"><div><h2 className="td-page-title">{title}</h2>{description ? <p className="td-page-sub">{description}</p> : null}</div>{actions ? <div className="td-page-actions">{actions}</div> : null}</header>;
}

export interface DashboardPageProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  filters?: ReactNode;
  metrics?: ReactNode;
  children: ReactNode;
}
export const DashboardPage = forwardRef<HTMLElement, DashboardPageProps>(function DashboardPage(
  { title, description, actions, filters, metrics, children, className, ...props }, ref,
) {
  return <section {...props} ref={ref} className={cx("td-react-page-pattern", className)}>
    <PatternHeading title={title} description={description} actions={actions} />
    {filters ? <div className="td-fbar">{filters}</div> : null}
    {metrics ? <div className="td-react-pattern-metrics">{metrics}</div> : null}
    <div className="td-bento">{children}</div>
  </section>;
});

export interface DashboardPanelProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  meta?: ReactNode;
  span?: 1 | 2 | "full";
}
export const DashboardPanel = forwardRef<HTMLElement, DashboardPanelProps>(function DashboardPanel(
  { title, meta, span = 1, children, className, ...props }, ref,
) {
  const titleId = useId();
  const spanClass = span === 2 ? "td-bento-cell--span2" : span === "full" ? "td-bento-cell--span-full" : undefined;
  return <article {...props} ref={ref} aria-labelledby={title ? titleId : props["aria-labelledby"]} className={cx("td-panel", "td-react-panel", spanClass, className)}>
    {title || meta ? <header className="td-panel-head">{title ? <h3 id={titleId} className="td-panel-title">{title}</h3> : <span />}{meta ? <span className="td-panel-sub">{meta}</span> : null}</header> : null}
    {children}
  </article>;
});

export interface DataManagementPageProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}
export const DataManagementPage = forwardRef<HTMLElement, DataManagementPageProps>(function DataManagementPage(
  { title, description, actions, toolbar, footer, children, className, ...props }, ref,
) {
  return <section {...props} ref={ref} className={cx("td-react-page-pattern", className)}>
    <PatternHeading title={title} description={description} actions={actions} />
    {toolbar ? <div className="td-fbar">{toolbar}</div> : null}
    <div className="td-panel td-react-panel">{children}</div>
    {footer ? <footer className="td-react-pattern-footer">{footer}</footer> : null}
  </section>;
});

export type PageStateVariant = "empty" | "loading" | "error";
export interface PageStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  variant: PageStateVariant;
  title: ReactNode;
  description?: ReactNode;
  illustration?: ReactNode;
  action?: ReactNode;
}
export const PageState = forwardRef<HTMLDivElement, PageStateProps>(function PageState(
  { variant, title, description, illustration, action, className, ...props }, ref,
) {
  const role = variant === "error" ? "alert" : "status";
  return <div {...props} ref={ref} role={role} aria-live={variant === "error" ? "assertive" : "polite"} aria-busy={variant === "loading" || undefined} className={cx("td-empty", `td-react-page-state--${variant}`, className)}>
    {illustration ? <div className="td-empty-art" aria-hidden="true">{illustration}</div> : null}
    {variant === "loading" && !illustration ? <div className="td-loading-dots" aria-hidden="true"><span /><span /><span /></div> : null}
    <strong className="td-empty-title">{title}</strong>
    {description ? <p className="td-empty-text">{description}</p> : null}
    {action ? <div className="td-react-pattern-actions">{action}</div> : null}
  </div>;
});
