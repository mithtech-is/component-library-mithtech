import { forwardRef, type HTMLAttributes, type MouseEvent } from "react";
import { cx } from "./utils";
import "./chip.css";

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Removes the chip. When given, the chip draws a × control after the label
   * and calls this when it is pressed.
   *
   * A chip WITHOUT `onRemove` is a static token — a value the reader is shown,
   * not one they can retract. A chip WITH it is an applied filter they can take
   * off, and the × is the only interactive part: the token itself stays a
   * `<span>`, so a screen reader is never told the whole thing is pressable
   * when only the × does anything ([[L12]]).
   */
  onRemove?: () => void;
  /**
   * The × control's accessible name — e.g. `"Remove ERPNext filter"`. Required
   * whenever `onRemove` is set: a bare × announces only "button", and a reader
   * clearing filters one at a time needs to know which one this takes off.
   */
  removeLabel?: string;
}

/**
 * A filter token — one applied value the reader can see and, when it can be
 * retracted, take off.
 *
 * The full recipe is the base `.td-chip` in `tonaldepth-core` ([[L16]]): a quiet
 * pill at rest, because a row of applied filters is a list of values, not a row
 * of buttons — depth appears only on interaction. This component keeps that
 * grammar and adds the remove affordance the design carries: a raised × cap that
 * sinks into the chip when pressed.
 *
 * **Not `FilterBar`.** `FilterBar` is the composed picker — the labelled bar of
 * options with counts that a reader chooses *from*. `Chip` is a single token you
 * place yourself: the applied-filter row above a result set, a tag on a card, a
 * value in an intent picker. If you are rendering the set of choices, reach for
 * `FilterBar`; if you are rendering what was chosen, reach for this.
 */
export const Chip = forwardRef<HTMLSpanElement, ChipProps>(function Chip(
  { onRemove, removeLabel, className, children, ...props },
  ref,
) {
  return (
    <span {...props} ref={ref} className={cx("td-chip", "td-react-chip", className)}>
      {children}
      {onRemove ? (
        <button
          type="button"
          className="td-chip-x"
          aria-label={removeLabel}
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            // The × sits inside the token; if a caller made the token itself
            // clickable, removing must not also trip that outer handler.
            event.stopPropagation();
            onRemove();
          }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>
      ) : null}
    </span>
  );
});
