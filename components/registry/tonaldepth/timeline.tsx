import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-timeline.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export type TonalDepthTimelineState = "done" | "current" | "upcoming";

/**
 * Which axis the sequence is measured on.
 *
 * `elapsed` is the timeline: `time` is a timestamp against now — "2 weeks ago",
 * "week 8" — so it trails the row the way a machine value does.
 *
 * `period` is the **roadmap**: `time` is the planning window the item belongs
 * to — "Q4 2025", "H1 2027" — so it leads the item as its heading, in papaya
 * mono, because the period is what the reader scans down.
 *
 * `flow` is the **pipeline**: the same sequence turned on its side, steps
 * separated by direction marks. Reach for it when the reader's question is
 * "where did it stop" rather than "how long did it take" — a build's stages, an
 * order's route from draft to fulfilled. It is horizontal because the answer is
 * one position along a line, and a vertical list makes you read six rows to
 * find it.
 *
 * A `flow` step with a `description` lays out as a column with a capped
 * measure instead of a nowrap pill, so the paragraph is read under its step.
 * It used to be discarded — `display: none` on the description, on an axis
 * whose steps could not wrap — so five engagements with a paragraph each came
 * out as titles-only and nothing warned. **Every axis renders every field it
 * is given**; only the mark and the direction differ.
 *
 * `feed` is the **activity stream**: newest first, the mark is the person
 * rather than a state, and there is no "upcoming" — a feed reports what has
 * happened. Pass `initials` or `avatar` on the item; `time` trails the row.
 *
 * Same anatomy, same rail, same three states throughout. Only the axis differs,
 * which is why these are a prop here rather than four lookalike components.
 *
 * Each axis emits its own class, named for it — `td-mk-timeline--elapsed`,
 * `--period`, `--flow`, `--feed` — so reading the DOM answers which axis is
 * active. `--period` and `--elapsed` carry no rules of their own; that is the
 * roadmap and the timeline sharing a layout, not a missing class.
 */
export type TonalDepthTimelineAxis = "elapsed" | "period" | "flow" | "feed";

/**
 * What the rail's mark is.
 *
 * `dot` is the lamp — the state is the whole signal, and that is right when the
 * steps have no names of their own. `ordinal` numbers them, which is what a
 * plan with a fixed order needs: "step 3" is a thing a reader says out loud and
 * a bare dot cannot be referred to. A `done` step shows a tick rather than its
 * number, because the number stops being the useful fact once it is behind you.
 */
export type TonalDepthTimelineMarker = "dot" | "ordinal";

export interface TonalDepthTimelineItem {
  title: ReactNode;
  /** A machine-reported value — a date, a duration, a week number. Set in mono. */
  time?: ReactNode;
  meta?: ReactNode;
  description?: ReactNode;
  state?: TonalDepthTimelineState;
  /** Two or three letters for the mark. `feed` only; ignored on the other axes. */
  initials?: string;
  /** A photograph in place of the initials. `feed` only. */
  avatar?: ReactNode;
}

export interface TonalDepthTimelineProps extends HTMLAttributes<HTMLOListElement> {
  items: TonalDepthTimelineItem[];
  /** Accessible name for the sequence. */
  label?: string;
  /** Where `time` sits, and what it means. `period` is the roadmap form. */
  axis?: TonalDepthTimelineAxis;
  /** What the rail's mark is. `ordinal` numbers the steps. */
  marker?: TonalDepthTimelineMarker;
  currentLabel?: string;
  doneLabel?: string;
}

export const TonalDepthTimeline = forwardRef<HTMLOListElement, TonalDepthTimelineProps>(function TonalDepthTimeline(
  { items, label, axis = "elapsed", marker = "dot", currentLabel = "Current phase", doneLabel = "Complete", className, ...props },
  ref,
) {
  return (
    <ol
      {...props}
      ref={ref}
      aria-label={label}
      className={cx("td-mk-timeline", `td-mk-timeline--${axis}`, marker === "ordinal" && "td-mk-timeline--ordinal", className)}
    >
      {items.map((item, index) => {
        const state = item.state ?? "upcoming";
        // A done step shows a tick instead of its number: once it is behind
        // you, "which one was it" stops being the useful fact.
        const mark = axis === "feed"
          ? (item.avatar ?? (item.initials ? <span className="td-mk-timeline-initials">{item.initials}</span> : null))
          : marker === "ordinal"
            ? (state === "done" ? "\u2713" : index + 1)
            : null;
        return (
          /* `data-detail` rather than `:has()`: the flow axis lays a step out
             as a column when it carries a paragraph and as a nowrap pill when
             it does not, and an attribute the component sets is a fact the
             stylesheet cannot get wrong. */
          <li key={index} className="td-mk-timeline-item" data-state={state} data-detail={item.description !== undefined && item.description !== null ? "" : undefined}>
            <span className="td-mk-timeline-dot" aria-hidden="true">{mark}</span>
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
            {item.time !== undefined && axis !== "period" ? <span className="td-mk-timeline-time">{item.time}</span> : null}
          </li>
        );
      })}
    </ol>
  );
});
