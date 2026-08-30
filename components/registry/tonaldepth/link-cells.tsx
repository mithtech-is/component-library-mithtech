import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react";
import "./tonaldepth-link-cells.css";

const LAMP_WEIGHT = "fill" as const;

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthLinkCellItem {
  href: string;
  /** The category above the title — small caps, a word or two. */
  kicker?: ReactNode;
  title: ReactNode;
  /** One line under the title, where the destination needs explaining. */
  detail?: ReactNode;
}

export interface TonalDepthLinkCellsProps extends HTMLAttributes<HTMLElement> {
  items: TonalDepthLinkCellItem[];
  /** Names the group for a screen reader. */
  label?: string;
  /**
   * Hand your router the anchor. Given the class and the href, return the
   * element. Without it every cell is a document load.
   */
  renderLink?: (props: { className: string; href: string; children: ReactNode }) => ReactNode;
  /**
   * **How many columns to draw** — a count, not a hint.
   *
   * Omit it and the grid is the uncapped `auto-fit` it has always been, which
   * breaks six cells 5 + 1 at a page measure and orphans the sixth. That is
   * how a set of six onward links lost the job to `FeatureGrid` and a
   * hand-narrowed container: the container was the only way to decide the
   * count. It still reflows below the floor at every count.
   */
  columns?: 2 | 3 | 4;
  /**
   * The reflow floor, in pixels: how narrow a cell may get before the grid
   * drops a column. 230 by default, at every column count.
   */
  min?: number;
}

/**
 * A grid of onward links — the "where to next" block at the foot of a page.
 *
 * Each cell is the whole target, so there is no separate "read more": the
 * title is the link and the arrow is a direction mark, not a second control.
 */
export const TonalDepthLinkCells = forwardRef<HTMLElement, TonalDepthLinkCellsProps>(function TonalDepthLinkCells(
  { items, label, renderLink, columns, min, className, style, ...props },
  ref,
) {
  return (
    <nav
      {...props}
      ref={ref}
      aria-label={label}
      style={min === undefined ? style : { ...style, ["--td-grid-min" as string]: `${min}px` }}
      className={cx("td-linkcells", "td-registry-linkcells", columns && `td-registry-linkcells--${columns}`, className)}
    >
      {items.map((item, index) => {
        const body = (
          <>
            <span className="td-registry-linkcell-copy">
              {item.kicker !== undefined ? <span className="td-linkcell-kicker td-registry-linkcell-kicker">{item.kicker}</span> : null}
              <span className="td-linkcell-title td-registry-linkcell-title">{item.title}</span>
              {item.detail !== undefined ? <span className="td-registry-linkcell-detail">{item.detail}</span> : null}
            </span>
            <ArrowRightIcon className="td-linkcell-arrow td-registry-linkcell-arrow" weight={LAMP_WEIGHT} aria-hidden="true" />
          </>
        );
        const cellClass = cx("td-linkcell", "td-registry-linkcell");
        return renderLink
          ? <span className="td-registry-linkcell-slot" key={index}>{renderLink({ className: cellClass, href: item.href, children: body })}</span>
          : <a className={cellClass} href={item.href} key={index}>{body}</a>;
      })}
    </nav>
  );
});
