import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-application-shell.css";
import { TonalDepthSubNav } from "./tonaldepth-sub-nav";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export type TonalDepthApplicationShellSection = SubNavSection;

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
        {/* `plate={false}`: the sidebar is already the raised surface, and a
            second plate inside it nests chrome in chrome ([[L32]]). */}
        <TonalDepthSubNav sections={sections} label={sidebarLabel} plate={false} />
        {sidebarFooter ? <div className="td-sb-foot">{sidebarFooter}</div> : null}
      </aside>
      <main className="td-main">
        <header className="td-page-head"><div><h1 className="td-page-title">{title}</h1>{description ? <p className="td-page-sub">{description}</p> : null}</div>{actions ? <div className="td-page-actions">{actions}</div> : null}</header>
        {children}
      </main>
    </div>
  );
});
