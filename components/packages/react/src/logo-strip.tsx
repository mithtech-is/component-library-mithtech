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
  /**
   * Show the marks in their own colour instead of flattening them to the page's
   * ink.
   *
   * The default wall greyscales every mark to one silhouette so a row of client
   * logos reads as one material and a dark logo does not vanish on a dark page.
   * That is right for a *client* wall — third-party proof, where uniformity is
   * the point. It is wrong for a wall of *product* logos the reader is meant to
   * recognise one by one (the stack you implement, the integrations you bind):
   * flattened, a blue app icon and a magenta one become the same grey box. Turn
   * this on there — the artwork shows as drawn, and it is on the caller to pass
   * marks that hold up on the page's ground.
   */
  plain?: boolean;
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
 * - **The marks are rendered twice** so the loop has no seam. The second run is
 *   `aria-hidden` and its links are out of the tab order, so a screen reader
 *   reads the client list once and Tab traverses it once. It is deliberately
 *   NOT `inert`: that also makes the copy non-interactive, and in a moving
 *   track it meant half the marks on screen would not light and could not be
 *   clicked, with which half depending on where the loop had got to.
 */
export const LogoStrip = forwardRef<HTMLElement, LogoStripProps>(function LogoStrip(
  { items, label, scroll = false, speed = 32, reverse = false, plain = false, renderLink, className, style, ...props },
  ref,
) {
  /*
   * `duplicate` is the seam-hiding second run.
   *
   * It used to be `inert`, which takes the copy out of the tab order and the
   * accessibility tree in one attribute — and also makes it non-interactive.
   * In the moving track that meant HALF the marks the reader sees do nothing:
   * a logo slides under the pointer, does not light, and cannot be clicked,
   * and which half depends on where the loop happens to be. The reader has no
   * way of knowing they are looking at the copy.
   *
   * So the copy is hidden from assistive tech with `aria-hidden` and taken out
   * of the tab order one link at a time instead. A screen reader still reads
   * the client list once and Tab still traverses it once; the pointer works on
   * every mark on screen, which is the only thing a reader can actually see.
   */
  const renderItem = (item: LogoStripItem, index: number, duplicate = false) => {
    const inner = <span className="td-react-logos-art" aria-hidden="true">{item.logo}</span>;
    const cls = cx("td-logos-item", "td-react-logos-item");
    const name = <span className="td-react-logos-name">{item.name}</span>;
    if (item.href) {
      return (
        <span className="td-react-logos-slot" key={index}>
          {renderLink
            ? renderLink({ className: cls, href: item.href, children: <>{inner}{name}</> })
            : <a className={cls} href={item.href} tabIndex={duplicate ? -1 : undefined}>{inner}{name}</a>}
        </span>
      );
    }
    return (
      <span className={cls} key={index}>
        {inner}
        {name}
      </span>
    );
  };

  const heading = label !== undefined && label !== null
    ? <p className="td-logos-label td-react-logos-label">{label}</p>
    : null;

  if (!scroll) {
    return (
      <section {...props} ref={ref} style={style} className={cx("td-logos", "td-react-logos", plain && "td-react-logos--plain", className)}>
        {heading}
        {items.map((item, i) => renderItem(item, i))}
      </section>
    );
  }

  return (
    <section
      {...props}
      ref={ref}
      style={{ ...style, ["--td-logos-speed" as string]: `${speed}s` }}
      data-reverse={reverse ? "true" : undefined}
      className={cx("td-logos", "td-react-logos", "td-react-logos--scroll", plain && "td-react-logos--plain", className)}
    >
      {heading}
      <div className="td-react-logos-viewport">
        <div className="td-react-logos-track">
          <span className="td-react-logos-run">{items.map((item, i) => renderItem(item, i))}</span>
          {/* The seam-hider. Hidden from assistive tech so the client list is
              announced once, and its links are taken out of the tab order —
              but NOT `inert`, which would also stop half the marks on screen
              lighting or being clickable. See `renderItem`. */}
          <span className="td-react-logos-run" aria-hidden="true">{items.map((item, i) => renderItem(item, i, true))}</span>
        </div>
      </div>
    </section>
  );
});
