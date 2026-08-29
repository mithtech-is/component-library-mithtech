import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./logo-strip.css";

export interface LogoStripItem {
  /** The client's own artwork — an `img` or an inline `svg`. */
  logo: ReactNode;
  /** The organisation's name. Required: it is the alternative text. */
  name: string;
  href?: string;
}

export interface LogoStripProps extends HTMLAttributes<HTMLElement> {
  items: LogoStripItem[];
  /** The line above the wall — "Trusted by", "Selected clients". */
  label?: ReactNode;
  /**
   * Scroll the marks continuously instead of laying them out as a wall.
   *
   * For more logos than fit on one line, where the wall would either wrap into
   * a block or have to be cut down. It pauses whenever a reader is engaging
   * with it — on hover and on keyboard focus — and stops moving entirely under
   * `prefers-reduced-motion`.
   */
  scroll?: boolean;
  /** Seconds for one full pass. Higher is slower. Only used when `scroll` is on. */
  speed?: number;
  /** Run the marks right to left instead of left to right. */
  reverse?: boolean;
  renderLink?: (props: { className: string; href: string; children: ReactNode }) => ReactNode;
}

/**
 * A wall of real client artwork.
 *
 * Monochrome at rest and full colour on hover: eleven marks in eleven palettes
 * is a colour riot, and the wall's job is to be scanned rather than read. The
 * greyscale is a filter, so the artwork itself is untouched and a logo that is
 * already monochrome is unaffected.
 *
 * Pass the real marks. A typeset list of names is a claim; artwork is
 * third-party proof, and that is the whole reason this component exists.
 *
 * **`scroll` turns the wall into a carousel**, for more marks than fit on a
 * line. It is a mode rather than a second component: the same items, the same
 * greyscale-to-colour treatment, presented as a moving track instead of a
 * wrapping block.
 *
 * Three things that mode owes the reader, and does:
 *
 * - **It pauses when engaged with** — on hover and on `focus-within`. A logo
 *   that slides out from under the pointer is a link nobody can click, and one
 *   that slides away from a keyboard focus ring is worse.
 * - **It stops entirely under `prefers-reduced-motion`** and becomes a track
 *   the reader scrolls themselves. Slowing an infinite animation is not
 *   honouring that preference; stopping it is.
 * - **The marks are rendered twice** so the loop has no seam. The second run
 *   is `inert`, which takes it out of the tab order and the accessibility tree
 *   together — otherwise a screen reader reads the client list twice.
 */
export const LogoStrip = forwardRef<HTMLElement, LogoStripProps>(function LogoStrip(
  { items, label, scroll = false, speed = 32, reverse = false, renderLink, className, style, ...props },
  ref,
) {
  const renderItem = (item: LogoStripItem, index: number) => {
    const inner = <span className="td-react-logos-art" aria-hidden="true">{item.logo}</span>;
    const cls = cx("td-logos-item", "td-react-logos-item");
    if (item.href) {
      return (
        <span className="td-react-logos-slot" key={index}>
          {renderLink
            ? renderLink({ className: cls, href: item.href, children: <>{inner}<span className="td-react-logos-name">{item.name}</span></> })
            : <a className={cls} href={item.href}>{inner}<span className="td-react-logos-name">{item.name}</span></a>}
        </span>
      );
    }
    return (
      <span className={cls} key={index}>
        {inner}
        <span className="td-react-logos-name">{item.name}</span>
      </span>
    );
  };

  const heading = label !== undefined && label !== null
    ? <p className="td-logos-label td-react-logos-label">{label}</p>
    : null;

  if (!scroll) {
    return (
      <section {...props} ref={ref} style={style} className={cx("td-logos", "td-react-logos", className)}>
        {heading}
        {items.map(renderItem)}
      </section>
    );
  }

  return (
    <section
      {...props}
      ref={ref}
      style={{ ...style, ["--td-logos-speed" as string]: `${speed}s` }}
      data-reverse={reverse ? "true" : undefined}
      className={cx("td-logos", "td-react-logos", "td-react-logos--scroll", className)}
    >
      {heading}
      <div className="td-react-logos-viewport">
        <div className="td-react-logos-track">
          <span className="td-react-logos-run">{items.map(renderItem)}</span>
          {/* The seam-hider. `inert` takes the copy out of the tab order and
              the accessibility tree at once, so the client list is announced
              once rather than twice. */}
          <span className="td-react-logos-run" aria-hidden="true" inert>{items.map(renderItem)}</span>
        </div>
      </div>
    </section>
  );
});
