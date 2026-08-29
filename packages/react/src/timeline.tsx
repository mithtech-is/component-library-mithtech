import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./timeline.css";

export type TimelineState = "done" | "current" | "upcoming";

/**
 * Which axis the sequence is measured on.
 *
 * `elapsed` is the timeline: `time` is a timestamp against now — "2 weeks ago",
 * "week 8" — so it trails the row the way a machine value does.
 *
 * `period` is the **roadmap**: `time` is the planning window the item belongs
 * to — "Q4 2025", "H1 2027" — so it leads the item as its heading, in papaya
 * mono, because the period is what the reader scans down. Same anatomy, same
 * rail, same dot, same three states; only the axis differs, which is why it is
 * a prop here rather than a second component.
 */
export type TimelineAxis = "elapsed" | "period";

export interface TimelineItem {
  title: ReactNode;
  /** A machine-reported value — a date, a duration, a week number. Set in mono. */
  time?: ReactNode;
  meta?: ReactNode;
  description?: ReactNode;
  state?: TimelineState;
}

export interface TimelineProps extends HTMLAttributes<HTMLOListElement> {
  items: TimelineItem[];
  /** Accessible name for the sequence. */
  label?: string;
  /** Where `time` sits, and what it means. `period` is the roadmap form. */
  axis?: TimelineAxis;
  currentLabel?: string;
  doneLabel?: string;
}

export const Timeline = forwardRef<HTMLOListElement, TimelineProps>(function Timeline(
  { items, label, axis = "elapsed", currentLabel = "Current phase", doneLabel = "Complete", className, ...props },
  ref,
) {
  return (
    <ol {...props} ref={ref} aria-label={label} className={cx("td-mk-timeline", className)}>
      {items.map((item, index) => {
        const state = item.state ?? "upcoming";
        return (
          <li key={index} className="td-mk-timeline-item" data-state={state}>
            <span className="td-mk-timeline-dot" aria-hidden="true" />
            <div className="td-mk-timeline-body">
              {item.time !== undefined && axis === "period" ? <p className="td-mk-timeline-period">{item.time}</p> : null}
              <p className="td-mk-timeline-title">
                {item.title}
                {state === "current" ? <span className="td-mk-timeline-state">{currentLabel}</span> : null}
                {state === "done" ? <span className="td-mk-visually-hidden">{doneLabel}</span> : null}
              </p>
              {item.meta ? <p className="td-mk-timeline-meta">{item.meta}</p> : null}
              {item.description ? <p className="td-mk-timeline-description">{item.description}</p> : null}
            </div>
            {item.time !== undefined && axis === "elapsed" ? <span className="td-mk-timeline-time">{item.time}</span> : null}
          </li>
        );
      })}
    </ol>
  );
});
