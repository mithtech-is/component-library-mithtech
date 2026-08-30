import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./feature-card.css";

export type FeatureCardTone = "neutral" | "brand" | "accent" | "green";

export interface FeatureCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  icon?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  points?: ReactNode[];
  footer?: ReactNode;
  href?: string;
  tone?: FeatureCardTone;
  /**
   * Hand your router the anchor. Given the class and the href, return the
   * element. Without it every card is a document load.
   */
  renderLink?: (props: { className: string; href: string; children: ReactNode }) => ReactNode;
}

export const FeatureCard = forwardRef<HTMLElement, FeatureCardProps>(function FeatureCard(
  { icon, eyebrow, title, children, points, footer, href, renderLink, tone = "neutral", className, ...props },
  ref,
) {
  return (
    <article {...props} ref={ref} className={cx("td-mk-feature", `td-mk-feature--${tone}`, href && "td-mk-feature--link", className)}>
      {icon ? <span className="td-mk-feature-icon" aria-hidden="true">{icon}</span> : null}
      {eyebrow ? <p className="td-mk-feature-eyebrow">{eyebrow}</p> : null}
      <h3 className="td-mk-feature-title">
        {!href
          ? title
          : renderLink
            ? renderLink({ className: "td-mk-feature-titlelink", href, children: title })
            : <a className="td-mk-feature-titlelink" href={href}>{title}</a>}
      </h3>
      {children ? <p className="td-mk-feature-body">{children}</p> : null}
      {points?.length ? (
        <ul className="td-mk-feature-points">
          {points.map((point, index) => <li key={index}>{point}</li>)}
        </ul>
      ) : null}
      {footer ? <div className="td-mk-feature-footer">{footer}</div> : null}
    </article>
  );
});

export interface FeatureGridProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * **How many columns to draw** — a count, not a hint.
   *
   * It used to be a min-width hint with no cap on it, so `columns={3}` drew
   * FOUR tracks at a 1216px measure and getting a clean 3 x 2 meant narrowing
   * the container instead. The container, not the prop, decided the count. A
   * variant's name is a promise about what appears on screen.
   */
  columns?: 2 | 3 | 4;
  /**
   * The reflow floor, in pixels: how narrow a column may get before the grid
   * drops one. Defaults to what each column count has always implied — 300 at
   * two, 260 at three, 216 at four — so passing only `columns` reflows exactly
   * as it did.
   *
   * This is the half of the old `columns` that was doing real work. It now has
   * its own name, and `columns` means what it says.
   */
  min?: number;
}

export const FeatureGrid = forwardRef<HTMLDivElement, FeatureGridProps>(function FeatureGrid(
  { columns = 3, min, className, style, ...props }, ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      style={min === undefined ? style : { ...style, ["--td-grid-min" as string]: `${min}px` }}
      className={cx("td-mk-feature-grid", `td-mk-feature-grid--${columns}`, className)}
    />
  );
});
