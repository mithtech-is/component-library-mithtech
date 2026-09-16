import { forwardRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./segmented.css";

export interface SegmentedOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface SegmentedProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** The choices, drawn left to right. */
  options: SegmentedOption[];
  /** The selected value. Pass it with `onValueChange` to control the component. */
  value?: string;
  /**
   * The value selected before the reader touches it. Leave `value` unset to run
   * uncontrolled; with neither, the first enabled option is selected.
   */
  defaultValue?: string;
  /** Called with the value of the segment the reader picks. */
  onValueChange?: (value: string) => void;
  /**
   * The group's accessible name — `"View"`, `"Sort"`, `"Theme"`. Required: a
   * bare row of buttons tells a screen-reader user nothing about what the choice
   * governs.
   */
  label: string;
}

/**
 * One choice from a small set of peers, shown all at once in a single inline
 * control — the day/week/month, the sort order, the light/dark/system row.
 *
 * The recessed well, the quiet segments and the selected segment's brand wash
 * are the base `.td-segmented` in `tonaldepth-core` ([[L16]]); the selected
 * segment presses into the well rather than a colour being painted across the
 * whole control ([[L11]]). Controlled with `value` + `onValueChange`, or left to
 * run itself from `defaultValue`.
 *
 * **Not `Tabs`.** Tabs own a *panel* of content that switches with the choice;
 * a segmented control just reports a value. **Not `RadioGroup`**, which is the
 * shape once the options grow long or want descriptions — a segmented control is
 * three or four short peers side by side. **Not `FilterBar`**, which is
 * multi-select.
 */
export const Segmented = forwardRef<HTMLDivElement, SegmentedProps>(function Segmented(
  { options, value, defaultValue, onValueChange, label, className, ...props },
  ref,
) {
  const controlled = value !== undefined;
  const firstEnabled = options.find((option) => !option.disabled)?.value;
  const [internal, setInternal] = useState(defaultValue ?? firstEnabled);
  const current = controlled ? value : internal;

  return (
    <div
      {...props}
      ref={ref}
      role="group"
      aria-label={label}
      className={cx("td-segmented", "td-react-segmented", className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === current}
          disabled={option.disabled}
          onClick={() => {
            if (!controlled) setInternal(option.value);
            onValueChange?.(option.value);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
});
