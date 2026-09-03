import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-case-card.css";

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

/** `arrow_right_24_filled` */
function ArrowRightIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M13.7 4.28a1 1 0 1 0-1.4 1.43L17.67 11H4a1 1 0 1 0 0 2h13.66l-5.36 5.28a1 1 0 0 0 1.4 1.43l6.93-6.82c.5-.5.5-1.3 0-1.78z" {...props} />;
}

export interface TonalDepthCaseCardMetric {
  label: ReactNode;
  value: ReactNode;
}

export interface TonalDepthCaseCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  eyebrow?: ReactNode;
  title: ReactNode;
  summary?: ReactNode;
  metrics?: TonalDepthCaseCardMetric[];
  visual?: ReactNode;
  href?: string;
  cta?: ReactNode;
  /**
   * Hand your router the anchor. Given the class and the href, return the
   * element. Without it every card is a document load.
   */
  renderLink?: (props: { className: string; href: string; children: ReactNode }) => ReactNode;
}

export const TonalDepthCaseCard = forwardRef<HTMLElement, TonalDepthCaseCardProps>(function TonalDepthCaseCard(
  { eyebrow, title, summary, metrics, visual, href, renderLink, cta = "Read the case study", className, ...props },
  ref,
) {
  return (
    <article {...props} ref={ref} className={cx("td-mk-case", href && "td-mk-case--link", className)}>
      {visual ? <div className="td-mk-case-visual">{visual}</div> : null}
      {eyebrow ? <p className="td-mk-case-eyebrow">{eyebrow}</p> : null}
      <h3 className="td-mk-case-title">
        {!href
          ? title
          : renderLink
            ? renderLink({ className: "td-mk-case-titlelink", href, children: title })
            : <a className="td-mk-case-titlelink" href={href}>{title}</a>}
      </h3>
      {summary ? <p className="td-mk-case-summary">{summary}</p> : null}
      {metrics?.length ? (
        <dl className="td-mk-case-metrics">
          {metrics.map((metric, index) => (
            <div className="td-mk-case-metric" key={index}>
              <dt className="td-mk-case-metric-label">{metric.label}</dt>
              <dd className="td-mk-case-metric-value">{metric.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {href ? (
        <span className="td-mk-case-cta" aria-hidden="true">
          {cta}
          <ArrowRightIcon weight={LAMP_WEIGHT} className="td-mk-case-arrow" aria-hidden="true" />
        </span>
      ) : null}
    </article>
  );
});

export interface TonalDepthCaseCardGridProps extends HTMLAttributes<HTMLDivElement> {}

export const TonalDepthCaseCardGrid = forwardRef<HTMLDivElement, TonalDepthCaseCardGridProps>(function TonalDepthCaseCardGrid(
  { className, ...props }, ref,
) {
  return <div {...props} ref={ref} className={cx("td-mk-case-grid", className)} />;
});
