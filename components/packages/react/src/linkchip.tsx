import { forwardRef, type AnchorHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import { cx } from "./utils";
import "./linkchip.css";

export interface LinkChipProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  /** Where the pill goes. A LinkChip without a destination is a `Chip`. */
  href: string;
  /**
   * Hand your router the anchor. Given the class and the href, return the link
   * element — the same escape hatch `Button` carries, so a Next/Remix app keeps
   * client navigation without the component importing a router.
   *
   * Only `className`, `href`, `style` and `children` reach it, the same four
   * `Button` passes. Render a plain `<a>` if you omit it.
   */
  renderLink?: (props: { className: string; href: string; style?: CSSProperties; children: ReactNode }) => ReactNode;
  /** A leading glyph — a category lamp or a source mark, drawn before the label. */
  leading?: ReactNode;
}

/**
 * A navigable pill — one tag or topic the reader can follow.
 *
 * **Not `Chip`.** `Chip` is a filter token: a value the reader is *shown*, whose
 * body stays a `<span>` so a screen reader is never told the pill is pressable
 * when only its × does anything ([[L12]]). `LinkChip` is the opposite case — a
 * navigation control whose whole pill *is* the target, so it is legitimately
 * pressable end to end. A component is defined by what it refuses to be ([[L46]]):
 * `Chip` refuses to navigate, and this one refuses to be a passive value.
 *
 * It wears the same base `.td-chip` recipe from `tonaldepth-core` ([[L16]]) — the
 * quiet pill and its hover/press well already fire on the element itself, so the
 * anchor deepens on hover with nothing added here. What it adds is what an anchor
 * needs and a span did not: the keyboard focus ring.
 *
 * **Not `Button`.** `Button variant="link"` is an action styled as a link inside
 * prose; `LinkChip` is a pill in a row of pills — a tag rail under an article, an
 * "explore" strip, a set of related topics. Reach for this where the design shows
 * a *pill* that navigates, and for `Button` where it shows a *button* or a CTA.
 */
export const LinkChip = forwardRef<HTMLAnchorElement, LinkChipProps>(function LinkChip(
  { href, renderLink, leading, className, children, style, ...props },
  ref,
) {
  const classes = cx("td-chip", "td-react-linkchip", className);
  const content = (
    <>
      {leading != null ? (
        <span className="td-react-linkchip-lead" aria-hidden>
          {leading}
        </span>
      ) : null}
      {children}
    </>
  );

  if (renderLink) return <>{renderLink({ className: classes, href, style, children: content })}</>;

  return (
    <a {...props} ref={ref} href={href} className={classes} style={style}>
      {content}
    </a>
  );
});
