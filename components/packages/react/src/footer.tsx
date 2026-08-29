import { Fragment, forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./footer.css";

/**
 * Renders one anchor.
 *
 * A site footer is where the whole link inventory lives, so this is the prop
 * that decides whether sixty internal links route through the framework or
 * fall back to document loads. The footer owns the markup around the anchor;
 * this owns the anchor.
 */
export type FooterLinkRenderer = (props: { href: string; children: ReactNode }) => ReactNode;

export interface FooterLink {
  href: string;
  label: ReactNode;
}

export interface FooterProps extends HTMLAttributes<HTMLElement> {
  label?: string;
}

/**
 * The site footer.
 *
 * Deliberately server-renderable: on a marketing site the footer is the one
 * surface that renders on every page and passes crawl signal to inner pages,
 * which a client-rendered mega menu does not. Nothing here takes a hook, and
 * nothing should.
 *
 * Composed rather than configured — the parts below are separate exports for
 * the same reason `Table` is, because the order and grouping of a footer's
 * bands is editorial and belongs to the page, not to the component.
 */
export const Footer = forwardRef<HTMLElement, FooterProps>(function Footer(
  { label = "Site footer", className, children, ...props },
  ref,
) {
  return (
    <footer {...props} ref={ref} role="contentinfo" aria-label={label} className={cx("td-footer", "td-react-footer", className)}>
      {children}
    </footer>
  );
});

export interface FooterGridProps extends HTMLAttributes<HTMLDivElement> {}

export const FooterGrid = forwardRef<HTMLDivElement, FooterGridProps>(function FooterGrid(
  { className, children, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} className={cx("td-footer-grid", className)}>
      {children}
    </div>
  );
});

export interface FooterBrandProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** The wordmark. Set in the footer's own treatment, not the navbar's. */
  name: ReactNode;
  href?: string;
  renderLink?: FooterLinkRenderer;
  /** The standing description, set as the band's paragraph. */
  children?: ReactNode;
}

export const FooterBrand = forwardRef<HTMLDivElement, FooterBrandProps>(function FooterBrand(
  { name, href, renderLink, className, children, ...props },
  ref,
) {
  const wordmark = <strong>{name}</strong>;
  return (
    <div {...props} ref={ref} className={cx("td-footer-brand", className)}>
      <div className="td-footer-brand-copy">
        {href
          ? renderLink
            ? renderLink({ href, children: wordmark })
            : <a href={href}>{wordmark}</a>
          : wordmark}
        {children ? <p>{children}</p> : null}
      </div>
    </div>
  );
});

export interface FooterColumnProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  links: FooterLink[];
  renderLink?: FooterLinkRenderer;
}

/**
 * A labelled list of links.
 *
 * The heading is an `h5` because the design system scopes the column's
 * heading styling to that tag. It skips levels under a page's `h2`, which is a
 * heading-order imperfection rather than a conformance failure, and the
 * alternative is authoring CSS the system does not own.
 */
export const FooterColumn = forwardRef<HTMLDivElement, FooterColumnProps>(function FooterColumn(
  { title, links, renderLink, className, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} className={cx("td-footer-col", className)}>
      <h5>{title}</h5>
      <ul>
        {/* Keyed by href AND position: an href is not unique, and two links to
            the same place under different words reconcile into one. */}
        {links.map((link, index) => (
          <li key={`${link.href}-${index}`}>
            {renderLink ? renderLink({ href: link.href, children: link.label }) : <a href={link.href}>{link.label}</a>}
          </li>
        ))}
      </ul>
    </div>
  );
});

export interface FooterContactItem {
  /** The kind of channel — "Email", "Phone". Set as the item's key. */
  key: ReactNode;
  value: ReactNode;
}

export interface FooterContactProps extends HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
  items: FooterContactItem[];
}

export const FooterContact = forwardRef<HTMLDivElement, FooterContactProps>(function FooterContact(
  { label = "Contact", items, className, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} className={cx("td-footer-contactwell", className)}>
      <span className="td-footer-contactwell-label">{label}</span>
      <div className="td-footer-contactwell-grid">
        {items.map((item, index) => (
          <div className="td-footer-contactitem" key={index}>
            <span className="td-footer-contactitem-k">{item.key}</span>
            {item.value}
          </div>
        ))}
      </div>
    </div>
  );
});

export interface FooterSocialProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
}

/**
 * The social row.
 *
 * Pass `.td-glowicon` anchors: each is a lamp whose icon carries the state and
 * whose label, where it has one, holds its ink. The row supplies placement,
 * not the icons' treatment.
 */
export const FooterSocial = forwardRef<HTMLDivElement, FooterSocialProps>(function FooterSocial(
  { label, className, children, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} aria-label={label} className={cx("td-footer-social", className)}>
      {children}
    </div>
  );
});

export interface FooterBottomProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** The standing legal line. */
  note?: ReactNode;
  social?: ReactNode;
  links?: FooterLink[];
  renderLink?: FooterLinkRenderer;
}

export const FooterBottom = forwardRef<HTMLDivElement, FooterBottomProps>(function FooterBottom(
  { note, social, links, renderLink, className, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} className={cx("td-footer-bottom", className)}>
      {note ? <span>{note}</span> : null}
      {social}
      {links?.length ? (
        <div className="td-footer-bottom-links">
          {links.map((link, index) =>
            renderLink
              ? <Fragment key={`${link.href}-${index}`}>{renderLink({ href: link.href, children: link.label })}</Fragment>
              : <a key={`${link.href}-${index}`} href={link.href}>{link.label}</a>,
          )}
        </div>
      ) : null}
    </div>
  );
});
