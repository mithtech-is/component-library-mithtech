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
}

/**
 * A grid of onward links — the "where to next" block at the foot of a page.
 *
 * Each cell is the whole target, so there is no separate "read more": the
 * title is the link and the arrow is a direction mark, not a second control.
 */
export const TonalDepthLinkCells = forwardRef<HTMLElement, TonalDepthLinkCellsProps>(function TonalDepthLinkCells(
  { items, label, renderLink, className, ...props },
  ref,
) {
  return (
    <nav {...props} ref={ref} aria-label={label} className={cx("td-linkcells", "td-registry-linkcells", className)}>
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
