import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-page-nav.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthPageNavItem {
  label: ReactNode;
  href: string;
  /** The section being read. The router's answer, not the component's. */
  current?: boolean;
  /** A resolved number on the right of the tab — 12, not "12+". */
  count?: number;
  disabled?: boolean;
}

// The DOM `title` attribute is omitted so the prop can carry the page's name,
// which is what a header's title is. A tooltip on a navigation bar is not a
// thing anyone wants.
export interface TonalDepthPageNavProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  items: TonalDepthPageNavItem[];
  /** The page this bar belongs to. Shown at the start, before the tabs. */
  title?: ReactNode;
  /** The section above the title, in small caps. */
  eyebrow?: ReactNode;
  /** Controls at the end — a primary action, a filter, a search. */
  actions?: ReactNode;
  /**
   * Stick under the main header rather than scrolling away.
   *
   * It reads `--nav-offset`, which `SiteNavigation` publishes, so the two stack
   * without either being told the other's height.
   */
  sticky?: boolean;
  /** Names the navigation landmark. Set it — a page has more than one nav. */
  label?: string;
  renderLink?: (props: { className: string; href: string; children: ReactNode; "aria-current"?: "page" }) => ReactNode;
}

/**
 * The secondary header: the bar that sits under the main one and navigates
 * *within* a page's section.
 *
 * **Not `SubNav`, and not `Tabs`.** `SubNav` is the vertical grouped list a
 * product's sidebar draws. `Tabs` switches a panel in place and owns a `value`.
 * This is horizontal, it sits below the site header, and every item goes
 * somewhere — which one is current is the router's answer.
 *
 * The tabs take the design system's segmented-control grammar: the group lifts
 * off the bar as one raised piece and the current tab is a well pressed into
 * it. That is what makes a row of links read as one control with a position in
 * it rather than as five separate buttons.
 *
 * **It stacks with the main header rather than measuring it.**
 * `SiteNavigation` publishes `--nav-offset`; this reads it. Neither has to know
 * the other's height, and a retracting header does not drag this out of place.
 *
 * **On a narrow screen the tabs scroll rather than wrap.** A secondary header
 * that grows to two lines pushes the page down every time the section changes,
 * and the reader loses their place — so the bar keeps its height and the tabs
 * move inside it, with the ends masked so the row reads as cut rather than
 * ended.
 */
export const TonalDepthPageNav = forwardRef<HTMLElement, TonalDepthPageNavProps>(function TonalDepthPageNav(
  { items, title, eyebrow, actions, sticky = true, label = "Section", renderLink, className, ...props },
  ref,
) {
  const hasIdentity = Boolean(title || eyebrow);
  return (
    <div
      {...props}
      ref={ref as never}
      className={cx("td-registry-pagenav", sticky && "td-registry-pagenav--sticky", className)}
    >
      {hasIdentity ? (
        <div className="td-registry-pagenav-identity">
          {eyebrow ? <p className="td-registry-pagenav-eyebrow">{eyebrow}</p> : null}
          {title ? <p className="td-registry-pagenav-title">{title}</p> : null}
        </div>
      ) : null}

      <nav className="td-registry-pagenav-scroll" aria-label={label}>
        <div className="td-registry-pagenav-tabs">
          {items.map((item, index) => {
            const tabClass = cx("td-registry-pagenav-tab");
            /* Keyed by href AND position. An href is not unique — two links to the
               same place under different words is ordinary ("Docs" beside "Read
               the docs"), and React reconciles a duplicate key into ONE element,
               so the second silently stops updating. The position disambiguates
               without inventing an id the consumer would have to supply. */
            const body = (
              <>
                <span className="td-registry-pagenav-tab-label">{item.label}</span>
                {typeof item.count === "number" ? <span className="td-chip-count">{item.count}</span> : null}
              </>
            );
            if (item.disabled) {
              return <span className={tabClass} key={`${item.href}-${index}`} aria-disabled="true">{body}</span>;
            }
            if (renderLink) {
              return (
                <span className="td-registry-pagenav-slot" key={`${item.href}-${index}`}>
                  {renderLink({ className: tabClass, href: item.href, children: body, "aria-current": item.current ? "page" : undefined })}
                </span>
              );
            }
            return (
              <a className={tabClass} href={item.href} key={`${item.href}-${index}`} aria-current={item.current ? "page" : undefined}>
                {body}
              </a>
            );
          })}
        </div>
      </nav>

      {actions ? <div className="td-registry-pagenav-actions">{actions}</div> : null}
    </div>
  );
});
