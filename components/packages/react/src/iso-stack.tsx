import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./iso-stack.css";

export interface IsoStackCard {
  /** The small line above the title — a quarter, a phase, a status. */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** One line under the title. Keep it short: the cards overlap at rest. */
  description?: ReactNode;
  href?: string;
}

export interface IsoStackProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * The cards, front to back. Three is the design; more than five stops
   * reading as a deck and starts reading as a mess.
   */
  cards: IsoStackCard[];
  /** Accessible name for the group. */
  label?: string;
  renderLink?: (props: { className: string; href: string; children: ReactNode }) => ReactNode;
}

/**
 * A deck of cards seen at an angle, which fans apart when the reader points at
 * it.
 *
 * This is the one component in the system whose subject is *the set* rather
 * than any card in it: three engagements stacked says "there is a body of this
 * work" in a way three cards side by side does not. Use it where the count is
 * the point and the individual entries are secondary.
 *
 * If the reader needs to compare the cards, this is the wrong component —
 * overlapping them hides most of each one. Reach for `CaseCardGrid` or
 * `FeatureGrid` instead.
 */
export const IsoStack = forwardRef<HTMLDivElement, IsoStackProps>(function IsoStack(
  { cards, label, renderLink, className, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} className={cx("td-react-isostack", className)} role="list" aria-label={label}>
      {cards.map((card, index) => {
        const body = (
          <>
            {card.eyebrow !== undefined ? <span className="td-react-isostack-eyebrow">{card.eyebrow}</span> : null}
            <span className="td-react-isostack-title">{card.title}</span>
            {card.description !== undefined ? <span className="td-react-isostack-description">{card.description}</span> : null}
          </>
        );
        const cardClass = "td-react-isostack-card";
        return (
          <div className="td-react-isostack-slot" role="listitem" key={index}>
            {card.href
              ? renderLink
                ? renderLink({ className: cardClass, href: card.href, children: body })
                : <a className={cardClass} href={card.href}>{body}</a>
              : <div className={cardClass}>{body}</div>}
          </div>
        );
      })}
    </div>
  );
});
