"use client";

/**
 * Free-text tags in a carved well.
 *
 * The difference from `Combobox multiple` is the set, not the shape: a
 * MultiSelect picks from a list somebody else defined, this one lets the
 * reader invent the values. Same chip, deliberately — a reader who has seen
 * one should recognise the other.
 */

import {
  forwardRef, useRef, useState,
  type KeyboardEvent, type InputHTMLAttributes,
} from "react";
import { cx } from "./utils";
import { CloseIcon, LAMP_WEIGHT } from "./icons";
import "./tag-input.css";

export interface TagInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange"> {
  /** The tags. Controlled — pair with `onValueChange`. */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Keys that commit whatever is typed. Default Enter and comma. */
  commitKeys?: string[];
  /** Refuse a tag past this count. The input disappears when it is reached. */
  max?: number;
  /** Reject a duplicate rather than adding it twice. Default true. */
  unique?: boolean;
  invalid?: boolean;
  label?: string;
  containerClassName?: string;
}

export const TagInput = forwardRef<HTMLInputElement, TagInputProps>(function TagInput(
  {
    value, defaultValue, onValueChange, commitKeys = ["Enter", ","], max, unique = true,
    invalid = false, disabled, label, placeholder, className, containerClassName,
    "aria-invalid": ariaInvalid, onKeyDown, ...props
  },
  ref,
) {
  const [uncontrolled, setUncontrolled] = useState<string[]>(defaultValue ?? []);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const tags = value ?? uncontrolled;
  const effectiveInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  const full = max !== undefined && tags.length >= max;

  const commit = (next: string[]) => {
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  const add = (raw: string) => {
    const tag = raw.trim();
    if (!tag || full) return;
    if (unique && tags.includes(tag)) { setDraft(""); return; }
    commit([...tags, tag]);
    setDraft("");
  };

  const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (commitKeys.includes(event.key)) { event.preventDefault(); add(draft); return; }
    // Backspace on an empty field takes the last tag back — the standard
    // gesture, and the only way to undo without reaching for the mouse.
    if (event.key === "Backspace" && !draft && tags.length) {
      event.preventDefault();
      commit(tags.slice(0, -1));
    }
  };

  return (
    <div
      className={cx("td-taginput", "td-react-taginput", containerClassName)}
      data-state={effectiveInvalid ? "error" : undefined}
      data-disabled={disabled || undefined}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map(tag => (
        <span className="td-taginput-tag" key={tag}>
          {tag}
          <button
            type="button"
            className="td-taginput-x"
            aria-label={`Remove ${tag}`}
            disabled={disabled}
            onClick={event => { event.stopPropagation(); commit(tags.filter(t => t !== tag)); }}
          >
            <CloseIcon weight={LAMP_WEIGHT} aria-hidden="true" />
          </button>
        </span>
      ))}
      {full ? null : (
        <input
          {...props}
          ref={node => {
            inputRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          type="text"
          className={cx("td-taginput-input", className)}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={label}
          aria-invalid={effectiveInvalid || undefined}
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={handleKey}
          onBlur={() => add(draft)}
        />
      )}
    </div>
  );
});
