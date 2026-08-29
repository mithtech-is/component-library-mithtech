import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-application-shell.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthApplicationShellItem { label: ReactNode; href: string; current?: boolean; count?: ReactNode }

export interface TonalDepthApplicationShellSection { label?: ReactNode; items: TonalDepthApplicationShellItem[] }

export interface TonalDepthApplicationShellProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  sidebarLabel?: string;
  identity: ReactNode;
  sections: TonalDepthApplicationShellSection[];
  sidebarFooter?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export const TonalDepthApplicationShell = forwardRef<HTMLDivElement, TonalDepthApplicationShellProps>(function TonalDepthApplicationShell(
  { sidebarLabel = "Application navigation", identity, sections, sidebarFooter, title, description, actions, children, className, ...props }, ref,
) {
  return (
    <div {...props} ref={ref} className={cx("td-shell", className)}>
      <aside className="td-sidebar">
        <div className="td-sb-head">{identity}</div>
        <nav aria-label={sidebarLabel}>
          {sections.map((section, index) => <div className="td-sb-section" key={index}>
            {section.label ? <div className="td-sb-label">{section.label}</div> : null}
            {section.items.map(item => <a key={item.href} href={item.href} className="td-sb-item" aria-current={item.current ? "page" : undefined}>{item.label}{item.count !== undefined ? <span className="td-sb-item-count">{item.count}</span> : null}</a>)}
          </div>)}
        </nav>
        {sidebarFooter ? <div className="td-sb-foot">{sidebarFooter}</div> : null}
      </aside>
      <main className="td-main">
        <header className="td-page-head"><div><h1 className="td-page-title">{title}</h1>{description ? <p className="td-page-sub">{description}</p> : null}</div>{actions ? <div className="td-page-actions">{actions}</div> : null}</header>
        {children}
      </main>
    </div>
  );
});
