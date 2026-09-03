import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-pagination.css";

const LAMP_WEIGHT = "fill" as const;

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * Microsoft's Fluent System Icons, filled weight, copied in because a registry
 * item is one self-contained file. Vendored from `@fluentui/svg-icons` and
 * stripped to `currentColor`, so the component's lamp ladder moves them.
 */
interface FluentIconProps extends SVGProps<SVGSVGElement> {
  /** Edge length. `1em` so the glyph scales with the type it sits beside. */
  size?: number | string;
  /** The fill. `currentColor` so the lamp ramp can move it. */
  color?: string;
  /**
   * Swallowed, not forwarded. Fluent marks are filled by construction, so
   * there is nothing to switch — but call sites pass `weight={LAMP_WEIGHT}`
   * and `weight` is not an SVG attribute, so React would put it on the DOM.
   */
  weight?: string;
  /** Flip horizontally, for a mark that points. */
  mirrored?: boolean;
}

interface FluentGlyphProps extends FluentIconProps {
  viewBox: string;
  d: string;
}

function FluentGlyph({ viewBox, d, size = "1em", color = "currentColor", weight, mirrored, ...props }: FluentGlyphProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      fill={color}
      transform={mirrored ? "scale(-1, 1)" : undefined}
      {...props}
    >
      <path d={d} />
    </svg>
  );
}

/** `chevron_left_24_filled` */
function ChevronLeftIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M15.7 4.3a1 1 0 0 1 0 1.4L9.42 12l6.3 6.3a1 1 0 0 1-1.42 1.4l-7-7a1 1 0 0 1 0-1.4l7-7a1 1 0 0 1 1.42 0" {...props} />;
}

/** `chevron_right_24_filled` */
function ChevronRightIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M8.3 4.3a1 1 0 0 0 0 1.4l6.29 6.3-6.3 6.3a1 1 0 1 0 1.42 1.4l7-7a1 1 0 0 0 0-1.4l-7-7a1 1 0 0 0-1.42 0" {...props} />;
}

/** A gap in the trail, drawn as an ellipsis. */
const TonalDepthGAP = "gap" as const;

const TonalDepthrange = (from: number, to: number): number[] =>
  from > to ? [] : Array.from({ length: to - from + 1 }, (_, index) => from + index);

/**
 * Which page numbers to show, and where the trail is cut.
 *
 * Always: the first and last `boundaries` pages, `siblings` either side of the
 * current one, and the current one itself. A cut is only drawn where it saves
 * more than one number — replacing a single hidden page with an ellipsis costs
 * the same width and takes away a target.
 */
export function TonalDepthpaginationRange(page: number, pageCount: number, siblings: number, boundaries: number): (number | typeof TonalDepthGAP)[] {
  const startPages = TonalDepthrange(1, Math.min(boundaries, pageCount));
  const endPages = TonalDepthrange(Math.max(pageCount - boundaries + 1, boundaries + 1), pageCount);
  const middleStart = Math.max(Math.min(page - siblings, pageCount - boundaries - siblings * 2 - 1), boundaries + 2);
  const middleEnd = Math.min(Math.max(page + siblings, boundaries + siblings * 2 + 2), endPages.length ? endPages[0] - 2 : pageCount - 1);
  const beforeGap = middleStart > boundaries + 2
    ? [TonalDepthGAP]
    : boundaries + 1 < pageCount - boundaries ? [boundaries + 1] : [];
  const afterGap = middleEnd < pageCount - boundaries - 1
    ? [TonalDepthGAP]
    : pageCount - boundaries > boundaries ? [pageCount - boundaries] : [];
  return [...startPages, ...beforeGap, ...TonalDepthrange(middleStart, middleEnd), ...afterGap, ...endPages];
}

export interface TonalDepthPaginationProps extends Omit<HTMLAttributes<HTMLElement>, "onChange"> {
  /** The page being read, 1-based. */
  page: number;
  pageCount: number;
  onPageChange?: (page: number) => void;
  /** How many pages either side of the current one stay visible. */
  siblings?: number;
  /** How many pages stay visible at each end of the trail. */
  boundaries?: number;
  /** Names the navigation landmark. Default "TonalDepthPagination". */
  label?: string;
  previousLabel?: string;
  nextLabel?: string;
  /** The accessible name of a page target. Default `Page {n}`. */
  pageLabel?: (page: number) => string;
  /** Give it a href builder and every target renders as a real link. */
  href?: (page: number) => string;
  /**
   * Hand your router the anchor. Given the class, the href and the children,
   * return the element. Only used when `href` is set.
   */
  renderLink?: (props: { className: string; href: string; children: ReactNode; "aria-label"?: string }) => ReactNode;
}

/**
 * The page trail.
 *
 * **The page you are on is not a target.** It renders as plain text carrying
 * `aria-current="page"` and rests recessed — a button that reloads where you
 * already are is a control that appears to do nothing, and the recess is how
 * this system already says "this one is selected".
 *
 * The design system's own trail filled the current page with solid papaya and
 * white text, and washed a hovered page in 8% brand. Filling with the brand
 * colour is the one move the system forbids ([[L11]]), and a page being pointed
 * at is not a category — so both are depth here ([[L34]]) and papaya arrives as
 * ink.
 *
 * The previous and next marks are direction marks rather than lamps: they point,
 * and they never glow.
 */
export const TonalDepthPagination = forwardRef<HTMLElement, TonalDepthPaginationProps>(function TonalDepthPagination(
  { page, pageCount, onPageChange, siblings = 1, boundaries = 1, label = "TonalDepthPagination", previousLabel = "Previous page", nextLabel = "Next page", pageLabel = n => `Page ${n}`, href, renderLink, className, ...props },
  ref,
) {
  const items = TonalDepthpaginationRange(page, pageCount, siblings, boundaries);
  const targetClass = cx("td-registry-pagination-item");

  const target = (n: number, children: ReactNode, ariaLabel: string, extraClass?: string) => {
    const itemClass = cx(targetClass, extraClass);
    if (href && renderLink) return renderLink({ className: itemClass, href: href(n), children, "aria-label": ariaLabel });
    if (href) return <a className={itemClass} href={href(n)} aria-label={ariaLabel}>{children}</a>;
    return <button type="button" className={itemClass} aria-label={ariaLabel} onClick={() => onPageChange?.(n)}>{children}</button>;
  };

  const edge = (n: number, enabled: boolean, ariaLabel: string, mark: ReactNode) => (
    <li className="td-registry-pagination-slot">
      {enabled
        ? target(n, mark, ariaLabel, "td-registry-pagination-item--edge")
        : (
          // Out of reach, not removed: the row must not change width as the
          // reader walks it. The role follows the mode it would have had.
          <span className={cx(targetClass, "td-registry-pagination-item--edge")} role={href ? "link" : "button"} aria-label={ariaLabel} aria-disabled="true" data-disabled="true">
            {mark}
          </span>
        )}
    </li>
  );

  return (
    <nav {...props} ref={ref} aria-label={label} className={cx("td-pagination", "td-registry-pagination", className)}>
      <ul className="td-registry-pagination-list">
        {edge(page - 1, page > 1, previousLabel, <ChevronLeftIcon className="td-registry-pagination-mark" weight={LAMP_WEIGHT} aria-hidden="true" />)}
        {items.map((item, index) => (
          <li className="td-registry-pagination-slot" key={item === TonalDepthGAP ? `gap-${index}` : item}>
            {item === TonalDepthGAP
              ? <span className="td-registry-pagination-gap" aria-hidden="true">…</span>
              : item === page
                ? <span className={cx(targetClass, "td-registry-pagination-item--current")} aria-current="page">{item}</span>
                : target(item, item, pageLabel(item))}
          </li>
        ))}
        {edge(page + 1, page < pageCount, nextLabel, <ChevronRightIcon className="td-registry-pagination-mark" weight={LAMP_WEIGHT} aria-hidden="true" />)}
      </ul>
    </nav>
  );
});
