import { forwardRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./choice-chips.css";

export interface ChoiceOption {
  value: string;
  label: ReactNode;
  /**
   * A dim suffix after the label — a platform name, a tally. Drawn in mono, the
   * same `td-chip-count` a chip carries, so it reads as metadata rather than a
   * second label.
   */
  detail?: ReactNode;
  disabled?: boolean;
}

export interface ChoiceChipsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  options: ChoiceOption[];
  /**
   * The group's accessible name — `"What are you trying to do?"`, `"Modules"`.
   * Required: a bare row of toggle chips tells a screen-reader user nothing
   * about what the choice governs.
   */
  label: string;
  /** The lit colour of a selected chip. Brand by default; accent where the row is the page's one emphatic choice. */
  color?: "brand" | "accent";
  /**
   * Multi-select. The value shape follows the mode: multi-select `value`,
   * `defaultValue` and `onValueChange` speak `string[]`; single-select speaks
   * `string | null` (`null` once nothing is chosen).
   */
  multiple?: boolean;
  /** Selected value(s). Pass with `onValueChange` to control the component. */
  value?: string | string[] | null;
  /** Uncontrolled starting value(s). */
  defaultValue?: string | string[] | null;
  /** Called with the new selection — a value or `null` in single mode, the set in multi. */
  onValueChange?: (value: string | string[] | null) => void;
  /** Single-select only: press the active chip again to clear the choice to `null`. */
  deselectable?: boolean;
}

/**
 * A row of toggle chips the reader chooses from — one intent from a list, the
 * modules they want, a status filter. Single-select by default; `multiple` makes
 * it a set.
 *
 * Each chip is the base `.td-chip` from `tonaldepth-core` ([[L16]]) worn on a
 * button: quiet at rest, and the selected chip carries the pressed well the base
 * already draws for `[aria-pressed="true"]` — a choice sinks in rather than a
 * colour being painted across a housing ([[L11]]). Controlled with `value` +
 * `onValueChange`, or left to run itself from `defaultValue`.
 *
 * **Not `Segmented`.** Segmented is three or four short peers in one recessed
 * housing (day/week/month); this is a wrapping row of separate pill chips, right
 * once the options grow many or their labels grow long. **Not `FilterBar`**,
 * which is the filter picker with counts and a clear-all over a result set —
 * `ChoiceChips` is a plain input, single or multi, with no result set implied.
 * **Not `Chip`/`LinkChip`**, which are a static token and a navigable pill; these
 * chips toggle a selection.
 */
export const ChoiceChips = forwardRef<HTMLDivElement, ChoiceChipsProps>(function ChoiceChips(
  props,
  ref,
) {
  const {
    options,
    label,
    color,
    className,
    multiple,
    value,
    defaultValue,
    onValueChange,
    deselectable,
    ...domProps
  } = props;

  const isMulti = multiple === true;
  const controlled = value !== undefined;

  // Both states are declared unconditionally (rules of hooks); only the one for
  // the active mode is ever read.
  const [internalSingle, setInternalSingle] = useState<string | null>(
    isMulti ? null : ((defaultValue as string | null | undefined) ?? null),
  );
  const [internalMulti, setInternalMulti] = useState<string[]>(
    isMulti ? ((defaultValue as string[] | undefined) ?? []) : [],
  );

  const currentSingle = isMulti ? null : controlled ? ((value as string | null) ?? null) : internalSingle;
  const currentMulti = isMulti ? (controlled ? ((value as string[]) ?? []) : internalMulti) : [];

  const isSelected = (v: string) => (isMulti ? currentMulti.includes(v) : currentSingle === v);

  const pick = (v: string) => {
    if (isMulti) {
      const next = currentMulti.includes(v) ? currentMulti.filter((x) => x !== v) : [...currentMulti, v];
      if (!controlled) setInternalMulti(next);
      onValueChange?.(next);
    } else {
      const next = deselectable && currentSingle === v ? null : v;
      if (!controlled) setInternalSingle(next);
      onValueChange?.(next);
    }
  };

  return (
    <div {...domProps} ref={ref} role="group" aria-label={label} className={cx("td-react-choicechips", className)}>
      {options.map((option) => {
        const on = isSelected(option.value);
        return (
          <button
            key={option.value}
            type="button"
            className="td-chip"
            aria-pressed={on}
            data-color={on ? color : undefined}
            disabled={option.disabled}
            onClick={() => pick(option.value)}
          >
            {option.label}
            {option.detail != null ? <span className="td-chip-count">{option.detail}</span> : null}
          </button>
        );
      })}
    </div>
  );
});
