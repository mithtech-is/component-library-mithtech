import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import { Frame } from "./frame";
import "./chart-container.css";

export interface ChartLegendItem { label: ReactNode; color?: string }
export interface ChartContainerProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  meta?: ReactNode;
  description?: string;
  legend?: ChartLegendItem[];
  children: ReactNode;
}

/**
 * A chart, housed.
 *
 * This is a `Frame` with the slots a plot needs already wired: the caption in
 * the head, the legend under the well, and the well itself run flush because a
 * chart carries its own margins. A chart is a measured object, so it is shown
 * in a well rather than offered on a plate — that pairing is `Frame`'s, and
 * this component does not re-implement it.
 *
 * It renders a `figure`, so the plot and its caption are announced as one
 * thing rather than a heading followed by loose graphics.
 */
export const ChartContainer = forwardRef<HTMLElement, ChartContainerProps>(function ChartContainer(
  { title, meta, description, legend, children, className, ...props }, ref,
) {
  const descriptionId = useId();
  return (
    <Frame
      {...props}
      ref={ref}
      as="figure"
      flushContent
      title={title}
      actions={meta ? <span className="td-chart-card-meta">{meta}</span> : undefined}
      footnote={legend?.length ? (
        <span className="td-chart-legend" aria-label="Chart legend">
          {legend.map((item, index) => (
            <span className="td-chart-legend-item" key={index}>
              <span className="td-chart-legend-swatch" aria-hidden="true" style={{ background: item.color ?? `var(--td-series-${index + 1})` }} />
              {item.label}
            </span>
          ))}
        </span>
      ) : undefined}
      aria-describedby={description ? descriptionId : undefined}
      className={cx("td-react-chart", className)}
    >
      {description ? <p id={descriptionId} className="td-react-visually-hidden">{description}</p> : null}
      <div className="td-chart-svg-wrap">{children}</div>
    </Frame>
  );
});
