import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import { AcceptIcon, LAMP_WEIGHT } from "./icons";
import "./pricing-table.css";

export interface PricingPlan {
  /** Stable key. */
  id: string;
  name: ReactNode;
  /** The price, already formatted. The component does no currency work. */
  price: ReactNode;
  /** What the price buys — "/ month", "/ 2 weeks". Set in mono beside the amount. */
  period?: ReactNode;
  /** One line under the price: who the plan is for, or what it assumes. */
  description?: ReactNode;
  /** What the plan includes. Every entry is an inclusion — see the note on exclusions. */
  features: ReactNode[];
  /** The plan's own call to action. You supply the control. */
  action?: ReactNode;
  /** Marks the plan the page is arguing for. */
  featured?: boolean;
  /** What the mark on a featured plan reads. Default "Most picked". */
  featuredLabel?: ReactNode;
}

export interface PricingTableProps extends HTMLAttributes<HTMLElement> {
  plans: PricingPlan[];
  /** Names the group of plans for a screen reader. */
  label?: string;
  /** Smallest a plan may get before the grid drops a column. */
  min?: number;
}

/**
 * The plan grid: a price, what it includes, and the way to take it.
 *
 * **This is not `ComparisonTable`, and the two are not interchangeable.** A
 * pricing table is an *offer* — one card per plan, each carrying its own call
 * to action, so the reader chooses and acts in the same place. A comparison
 * table is an *argument* — one matrix of criteria against options, with no way
 * to act on any of them. A page that needs both uses both: the grid to decide,
 * the matrix to justify. Building this out of `ComparisonTable` with a price
 * row would give you a price in a cell and nothing to press.
 *
 * The design system's own card fills the "most picked" mark with papaya and
 * rings the plan in 2px of brand. Filling with the brand colour is the one move
 * the system forbids ([[L11]]), so the mark is a carved chip with papaya ink
 * and the featured plan says so with **depth**: it sits further out of the page
 * than its neighbours, and its edge ring — which every raised object carries
 * anyway ([[L27]]) — resolves to papaya instead of the neutral edge.
 */
export const PricingTable = forwardRef<HTMLElement, PricingTableProps>(function PricingTable(
  { plans, label, min = 260, className, style, ...props },
  ref,
) {
  const base = useId();
  return (
    <section
      {...props}
      ref={ref}
      aria-label={label}
      style={{ ...style, ["--td-price-min" as string]: `${min}px` }}
      className={cx("td-react-pricing", className)}
    >
      {plans.map(plan => {
        const nameId = `${base}-${plan.id}`;
        return (
          <article
            key={plan.id}
            className={cx("td-price", "td-react-price")}
            data-featured={plan.featured ? "true" : undefined}
            aria-labelledby={nameId}
          >
            {plan.featured ? (
              <p className="td-price-badge td-react-price-badge">{plan.featuredLabel ?? "Most picked"}</p>
            ) : null}
            <h3 id={nameId} className="td-price-name td-react-price-name">{plan.name}</h3>
            <p className="td-price-tag td-react-price-tag">
              <span className="td-price-amt td-react-price-amt">{plan.price}</span>
              {plan.period ? <span className="td-price-per td-react-price-per">{plan.period}</span> : null}
            </p>
            {plan.description ? <p className="td-react-price-description">{plan.description}</p> : null}
            <ul className="td-price-features td-react-price-features">
              {plan.features.map((feature, index) => (
                <li className="td-price-feature td-react-price-feature" key={index}>
                  <AcceptIcon className="td-react-price-mark" weight={LAMP_WEIGHT} aria-hidden="true" />
                  <span className="td-react-price-feature-text">{feature}</span>
                </li>
              ))}
            </ul>
            {plan.action ? <div className="td-price-cta td-react-price-cta">{plan.action}</div> : null}
          </article>
        );
      })}
    </section>
  );
});
