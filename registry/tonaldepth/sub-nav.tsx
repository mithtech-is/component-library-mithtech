import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-sub-nav.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthSubNavItem {
  label: ReactNode;
  href: string;
  /** Marks the page the reader is on. Renders `aria-current="page"`. */
  current?: boolean;
  /** A tally on the right — how many things are behind the link. */
  count?: ReactNode;
  /** A library glyph. Optional: a nav with icons on some rows and not others reads as broken. */
  icon?: ReactNode;
}

export interface TonalDepthSubNavSection {
  /** The heading above a run of links. Omit for an unlabelled first group. */
  label?: ReactNode;
  items: TonalDepthSubNavItem[];
}

export interface TonalDepthSubNavProps extends HTMLAttributes<HTMLElement> {
  sections: TonalDepthSubNavSection[];
  /** Names the navigation landmark. Required in practice — a page may hold several. */
  label?: string;
  /**
   * Draw the raised panel around the links.
   *
   * On by default, which is the standalone form — a settings sidebar beside a
   * page of content. `ApplicationShell` passes `false`, because there the
   * sidebar itself is already the plate and a second one nests chrome in chrome.
   */
  plate?: boolean;
  renderLink?: (props: { className: string; href: string; children: ReactNode; "aria-current"?: "page" }) => ReactNode;
}

/**
 * A grouped list of links with counts — the second-level navigation inside a
 * section of a product.
 *
 * This is not a new design. It is the nav `ApplicationShell` has always drawn,
 * lifted out so a page that is not a shell can use it: the same
 * `.td-sb-section` / `.td-sb-item` markup, one implementation, two entry
 * points. The shell renders this component.
 *
 * Not `Tabs` or `SideTabs`. Those switch a panel in place and own a `value`;
 * every link here goes somewhere, and which one is current is the router's
 * answer, not the component's. If nothing navigates, you want `SideTabs`.
 *
 * Hand your router the anchor with `renderLink` — without it every link is a
 * document load.
 */
export const TonalDepthSubNav = forwardRef<HTMLElement, TonalDepthSubNavProps>(function TonalDepthSubNav(
  { sections, label, plate = true, renderLink, className, ...props },
  ref,
) {
  return (
    <nav
      {...props}
      ref={ref}
      aria-label={label}
      className={cx("td-registry-subnav", plate && "td-registry-subnav--plate", className)}
    >
      {sections.map((section, index) => (
        <div className="td-sb-section td-registry-subnav-section" key={index}>
          {section.label !== undefined ? <div className="td-sb-label">{section.label}</div> : null}
          {section.items.map((item, index) => {
            const body = (
              <>
                {item.icon !== undefined ? <span className="td-registry-subnav-icon" aria-hidden="true">{item.icon}</span> : null}
                <span className="td-registry-subnav-label">{item.label}</span>
                {item.count !== undefined ? <span className="td-sb-item-count">{item.count}</span> : null}
              </>
            );
            /* Keyed by href AND position. An href is not unique — two links to the
               same place under different words is ordinary ("Docs" beside "Read
               the docs"), and React reconciles a duplicate key into ONE element,
               so the second silently stops updating. The position disambiguates
               without inventing an id the consumer would have to supply. */
            const linkProps = {
              className: "td-sb-item td-registry-subnav-item",
              href: item.href,
              children: body,
              ...(item.current ? { "aria-current": "page" as const } : {}),
            };
            return renderLink
              ? <span key={`${item.href}-${index}`} className="td-registry-subnav-slot">{renderLink(linkProps)}</span>
              : <a key={`${item.href}-${index}`} {...linkProps} />;
          })}
        </div>
      ))}
    </nav>
  );
});
