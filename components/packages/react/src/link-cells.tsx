import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import { ArrowRightIcon, LAMP_WEIGHT } from "./icons";
import "./link-cells.css";

export interface LinkCellItem {
  href: string;
  /** The category above the title — small caps, a word or two. */
  kicker?: ReactNode;
  title: ReactNode;
  /** One line under the title, where the destination needs explaining. */
  detail?: ReactNode;
}

export interface LinkCellsProps extends HTMLAttributes<HTMLElement> {
  items: LinkCellItem[];
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
export const LinkCells = forwardRef<HTMLElement, LinkCellsProps>(function LinkCells(
  { items, label, renderLink, columns, min, className, style, ...props },
  ref,
) {
  return (
    <nav
      {...props}
      ref={ref}
      aria-label={label}
      style={min === undefined ? style : { ...style, ["--td-grid-min" as string]: `${min}px` }}
      className={cx("td-linkcells", "td-react-linkcells", columns && `td-react-linkcells--${columns}`, className)}
    >
      {items.map((item, index) => {
        const body = (
          <>
            <span className="td-react-linkcell-copy">
              {item.kicker !== undefined ? <span className="td-linkcell-kicker td-react-linkcell-kicker">{item.kicker}</span> : null}
              <span className="td-linkcell-title td-react-linkcell-title">{item.title}</span>
              {item.detail !== undefined ? <span className="td-react-linkcell-detail">{item.detail}</span> : null}
            </span>
            <ArrowRightIcon className="td-linkcell-arrow td-react-linkcell-arrow" weight={LAMP_WEIGHT} aria-hidden="true" />
          </>
        );
        const cellClass = cx("td-linkcell", "td-react-linkcell");
        return renderLink
          ? <span className="td-react-linkcell-slot" key={index}>{renderLink({ className: cellClass, href: item.href, children: body })}</span>
          : <a className={cellClass} href={item.href} key={index}>{body}</a>;
      })}
    </nav>
  );
});
