import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./toc.css";

export interface TocItem {
  /** The heading's id, without the `#`. */
  id: string;
  label: ReactNode;
  /** A second-level heading, indented under the one above it. */
  sub?: boolean;
}

export interface TableOfContentsProps extends Omit<HTMLAttributes<HTMLElement>, "onSelect"> {
  items: TocItem[];
  /** The id of the section currently being read. Lights that item's filament. */
  current?: string;
  /** The heading above the list. Default "On this page". */
  label?: ReactNode;
  /** Names the navigation landmark for a screen reader. Default "On this page". */
  ariaLabel?: string;
  /**
   * Hand your router the anchor. Given the class and the href, return the
   * element. Without it every entry is a plain in-page anchor, which is
   * usually right for a table of contents and wrong inside a SPA route.
   */
  renderLink?: (props: { className: string; href: string; children: ReactNode; "aria-current"?: "true" }) => ReactNode;
}

/**
 * The on-this-page rail.
 *
 * The seam down the side is the same filament the sideways tab uses: it is
 * always there, off and grey, and the current section lights its own segment.
 * Nothing moves — only colour, so the rail never reflows as the reader scrolls.
 *
 * **It does not track scrolling.** Pass `current` yourself, from an
 * IntersectionObserver or your router. Owning that here would mean guessing at
 * a root margin that suits every page, and it never does.
 */
export const TableOfContents = forwardRef<HTMLElement, TableOfContentsProps>(function TableOfContents(
  { items, current, label = "On this page", ariaLabel = "On this page", renderLink, className, ...props },
  ref,
) {
  return (
    <nav {...props} ref={ref} aria-label={ariaLabel} className={cx("td-toc", "td-react-toc", className)}>
      {label !== undefined && label !== null ? <span className="td-toc-label td-react-toc-label">{label}</span> : null}
      {items.map(item => {
        const isCurrent = item.id === current;
        const linkClass = cx("td-toc-item", "td-react-toc-item", item.sub && "td-react-toc-item--sub");
        const href = `#${item.id}`;
        if (renderLink) {
          return (
            <span className="td-react-toc-slot" key={item.id}>
              {renderLink({ className: linkClass, href, children: item.label, "aria-current": isCurrent ? "true" : undefined })}
            </span>
          );
        }
        return (
          <a className={linkClass} href={href} key={item.id} aria-current={isCurrent ? "true" : undefined}>
            {item.label}
          </a>
        );
      })}
    </nav>
  );
});
