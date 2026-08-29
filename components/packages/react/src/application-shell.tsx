import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { SubNav, type SubNavItem, type SubNavSection } from "./sub-nav";
import { cx } from "./utils";

/**
 * The shell's sidebar links ARE `SubNav`'s — one implementation, two entry
 * points. The aliases are kept so a consumer that already imports
 * `ApplicationShellItem` does not have to be rewritten.
 */
export type ApplicationShellItem = SubNavItem;
export type ApplicationShellSection = SubNavSection;
export interface ApplicationShellProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  sidebarLabel?: string;
  identity: ReactNode;
  sections: ApplicationShellSection[];
  sidebarFooter?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}
export const ApplicationShell = forwardRef<HTMLDivElement, ApplicationShellProps>(function ApplicationShell(
  { sidebarLabel = "Application navigation", identity, sections, sidebarFooter, title, description, actions, children, className, ...props }, ref,
) {
  return (
    <div {...props} ref={ref} className={cx("td-shell", className)}>
      <aside className="td-sidebar">
        <div className="td-sb-head">{identity}</div>
        {/* `plate={false}`: the sidebar is already the raised surface, and a
            second plate inside it nests chrome in chrome ([[L32]]). */}
        <SubNav sections={sections} label={sidebarLabel} plate={false} />
        {sidebarFooter ? <div className="td-sb-foot">{sidebarFooter}</div> : null}
      </aside>
      <main className="td-main">
        <header className="td-page-head"><div><h1 className="td-page-title">{title}</h1>{description ? <p className="td-page-sub">{description}</p> : null}</div>{actions ? <div className="td-page-actions">{actions}</div> : null}</header>
        {children}
      </main>
    </div>
  );
});
