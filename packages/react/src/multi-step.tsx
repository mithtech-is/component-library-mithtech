"use client";

import { forwardRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { Button } from "./button";
import { cx } from "./utils";
import "./multi-step.css";

export interface MultiStepItem {
  /** The word on the progress bar — "Discovery", "Scope". One or two words. */
  label: ReactNode;
  /** The heading for the pane. */
  title?: ReactNode;
  /** What this step is about, under the title. */
  description?: ReactNode;
  /** The fields. Omit and only the title and description show. */
  children?: ReactNode;
}

export interface MultiStepProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "children"> {
  steps: MultiStepItem[];
  /** Controlled index. Leave off and the component owns its own position. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (index: number) => void;
  /** Fires when Next is pressed on the last step. */
  onComplete?: () => void;
  backLabel?: string;
  nextLabel?: string;
  /** What the last step's Next button says. Default `Submit`. */
  completeLabel?: string;
  /** Accessible name for the whole flow. */
  label?: string;
}

/**
 * A form broken into panes, with the step indicator that belongs to it.
 *
 * The indicator is the same three-state sequence `Timeline` draws — done,
 * current, upcoming — laid out as a segmented bar, and it is part of this
 * component rather than a `Timeline` beside it for one reason: here the
 * sequence is *operable*. The reader moves through it, so the indicator and the
 * controls that move it have to agree about where they are, and splitting them
 * across two components makes that a prop the caller has to keep in step.
 *
 * The component owns the position and nothing else. It does not validate, does
 * not block Next on an invalid pane, and does not collect values — hold your
 * form state where you already hold it, and pass `value` / `onValueChange` to
 * gate movement on whatever validity means to you.
 */
export const MultiStep = forwardRef<HTMLDivElement, MultiStepProps>(function MultiStep(
  { steps, value, defaultValue = 0, onValueChange, onComplete, backLabel = "Back", nextLabel = "Next", completeLabel = "Submit", label, className, ...props },
  ref,
) {
  const [own, setOwn] = useState(defaultValue);
  const index = Math.max(0, Math.min(steps.length - 1, value ?? own));
  const step = steps[index];
  const last = index === steps.length - 1;

  const go = (next: number) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };

  return (
    <div {...props} ref={ref} className={cx("td-react-multistep", className)} role="group" aria-label={label}>
      <p className="td-react-multistep-meta">
        <span>Step <strong>{index + 1}</strong> of {steps.length}</span>
        <span className="td-react-multistep-here">{step?.label}</span>
      </p>
      {/* The bar reports; it is not a tablist. Its segments are not buttons,
          because moving through a form out of order is what the Back and Next
          controls are for and a clickable segment invites skipping a required
          pane. */}
      <div
        className="td-react-multistep-bar"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={index + 1}
        aria-label={typeof step?.label === "string" ? step.label : undefined}
      >
        {steps.map((item, position) => (
          <span
            className="td-react-multistep-segment"
            data-state={position < index ? "done" : position === index ? "current" : "upcoming"}
            key={position}
          >
            <span className="td-react-multistep-fill" />
            <span className="td-react-multistep-vh">{item.label}</span>
          </span>
        ))}
      </div>
      <div className="td-react-multistep-pane">
        {step?.title !== undefined ? <h3 className="td-react-multistep-title">{step.title}</h3> : null}
        {step?.description !== undefined ? <p className="td-react-multistep-description">{step.description}</p> : null}
        {step?.children}
      </div>
      <div className="td-react-multistep-actions">
        <Button variant="ghost" disabled={index === 0} onClick={() => go(index - 1)}>{backLabel}</Button>
        <Button variant="primary" onClick={() => (last ? onComplete?.() : go(index + 1))}>
          {last ? completeLabel : nextLabel}
        </Button>
      </div>
    </div>
  );
});
