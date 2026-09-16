"use client";

import { forwardRef, useRef, useState, type HTMLAttributes, type KeyboardEvent } from "react";
import "./tonaldepth-inline-edit.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthInlineEditProps extends Omit<HTMLAttributes<HTMLButtonElement>, "onChange"> {
  /** The current value. Controlled — pass the new one back through `onValueChange`. */
  value: string;
  /** Called with the edited value when the reader commits (Enter or blur). */
  onValueChange: (value: string) => void;
  /**
   * The field's accessible name — `"Project"`, `"Owner"`. Names both the display
   * control ("Edit Project") and the input, so the field is not a nameless box.
   */
  label: string;
  /** Shown, muted, when the value is empty. Default `"Empty"`. */
  placeholder?: string;
}

/**
 * A value that turns into a field when you click it, and back when you leave —
 * the read-mostly detail a reader edits in place without a form or a modal.
 *
 * The value, its hover, the edit field and its focus underline are the base
 * `.td-inline-edit*` in `tonaldepth-core` ([[L16]]). Enter or a click away
 * commits; Escape discards; and a commit and a discard never both fire.
 *
 * **Not an `Input` in a `FormField`.** That is for a field the reader expects to
 * fill — it is always a box, with a label above it. This reads as text until
 * touched, for a value that is usually just displayed. **Not `Segmented` or a
 * `Select`** — those pick from a fixed set; this takes free text.
 */
export const TonalDepthInlineEdit = forwardRef<HTMLButtonElement, TonalDepthInlineEditProps>(function TonalDepthInlineEdit(
  { value, onValueChange, label, placeholder = "Empty", className, ...props },
  ref,
) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const finishing = useRef(false);

  const start = () => {
    setDraft(value);
    finishing.current = false;
    setEditing(true);
  };
  const finish = (save: boolean) => {
    // Enter commits and unmounts the input, whose blur would otherwise commit
    // again; the guard makes commit-or-discard fire exactly once per edit.
    if (finishing.current) return;
    finishing.current = true;
    if (save && draft !== value) onValueChange(draft);
    setEditing(false);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      finish(true);
    } else if (event.key === "Escape") {
      event.preventDefault();
      finish(false);
    }
  };

  if (editing) {
    return (
      <input
        aria-label={label}
        className="td-inline-edit-input td-registry-inline-edit-input"
        value={draft}
        autoFocus
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => finish(true)}
      />
    );
  }

  const empty = value.length === 0;
  return (
    <button
      {...props}
      ref={ref}
      type="button"
      aria-label={`Edit ${label}`}
      data-empty={empty || undefined}
      className={cx("td-inline-edit", "td-registry-inline-edit", className)}
      onClick={start}
    >
      <span className="td-inline-edit-text">{empty ? placeholder : value}</span>
    </button>
  );
});
