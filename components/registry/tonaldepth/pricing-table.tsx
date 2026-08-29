import { forwardRef, useId, type HTMLAttributes, type ReactNode, type SVGProps } from "react";
import "./tonaldepth-pricing-table.css";

const LAMP_WEIGHT = "fill" as const;

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * TonalDepth's own glyphs, copied in because a registry item is one
 * self-contained file. Filled and colour-neutral by construction, so the
 * component's lamp ladder moves them through `currentColor`.
 */
interface TdIconProps extends SVGProps<SVGSVGElement> {
  /** Edge length. `1em` so the glyph scales with the type it sits beside. */
  size?: number | string;
  /** The fill. `currentColor` so the lamp ramp can move it. */
  color?: string;
  /**
   * Accepted so a TD glyph is a drop-in at a call site passing
   * `weight={LAMP_WEIGHT}`. TD glyphs are filled by construction, so there is
   * nothing to switch — the prop is swallowed rather than forwarded, because
   * `weight` is not an SVG attribute and React would put it on the DOM.
   */
  weight?: string;
  /** Flip horizontally, matching Phosphor's prop of the same name. */
  mirrored?: boolean;
}

/** `fillRule` comes from `SVGProps`; pass `evenodd` where the artwork knocks a
 *  hole out of its own outline. */
interface TdGlyphProps extends TdIconProps {
  viewBox: string;
  d: string;
}

function TdGlyph({ viewBox, d, fillRule, size = "1em", color = "currentColor", weight, mirrored, ...props }: TdGlyphProps) {
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
      <path d={d} fillRule={fillRule} />
    </svg>
  );
}

const CHECK_FAT = "M243.31,90.91l-128.4,128.4a16,16,0,0,1-22.62,0l-71.62-72a16,16,0,0,1,0-22.61l20-20a16,16,0,0,1,22.58,0L104,144.22l96.76-95.57a16,16,0,0,1,22.59,0l19.95,19.54A16,16,0,0,1,243.31,90.91Z";

/** The accept mark. A bare fat tick — Phosphor's circled check read as a badge. */
function TdCheckFat(props: TdIconProps) {
  return <TdGlyph viewBox="0 0 256 256" d={CHECK_FAT} {...props} />;
}

const AcceptIcon = TdCheckFat;

export interface TonalDepthPricingPlan {
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

export interface TonalDepthPricingTableProps extends HTMLAttributes<HTMLElement> {
  plans: TonalDepthPricingPlan[];
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
export const TonalDepthPricingTable = forwardRef<HTMLElement, TonalDepthPricingTableProps>(function TonalDepthPricingTable(
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
      className={cx("td-registry-pricing", className)}
    >
      {plans.map(plan => {
        const nameId = `${base}-${plan.id}`;
        return (
          <article
            key={plan.id}
            className={cx("td-price", "td-registry-price")}
            data-featured={plan.featured ? "true" : undefined}
            aria-labelledby={nameId}
          >
            {plan.featured ? (
              <p className="td-price-badge td-registry-price-badge">{plan.featuredLabel ?? "Most picked"}</p>
            ) : null}
            <h3 id={nameId} className="td-price-name td-registry-price-name">{plan.name}</h3>
            <p className="td-price-tag td-registry-price-tag">
              <span className="td-price-amt td-registry-price-amt">{plan.price}</span>
              {plan.period ? <span className="td-price-per td-registry-price-per">{plan.period}</span> : null}
            </p>
            {plan.description ? <p className="td-registry-price-description">{plan.description}</p> : null}
            <ul className="td-price-features td-registry-price-features">
              {plan.features.map((feature, index) => (
                <li className="td-price-feature td-registry-price-feature" key={index}>
                  <AcceptIcon className="td-registry-price-mark" weight={LAMP_WEIGHT} aria-hidden="true" />
                  <span className="td-registry-price-feature-text">{feature}</span>
                </li>
              ))}
            </ul>
            {plan.action ? <div className="td-price-cta td-registry-price-cta">{plan.action}</div> : null}
          </article>
        );
      })}
    </section>
  );
});
