"use client";

import { forwardRef, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import "./tonaldepth-otp-input.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthOtpInputProps {
  /** How many digits. Six unless you know otherwise. */
  length?: number;
  value?: string;
  onValueChange?: (value: string) => void;
  /** Fired once the last cell is filled — usually submits. */
  onComplete?: (value: string) => void;
  /** `numeric` restricts to digits; `text` allows alphanumeric codes. */
  mode?: "numeric" | "text";
  label?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  name?: string;
}

export const TonalDepthOtpInput = forwardRef<HTMLInputElement, TonalDepthOtpInputProps>(function TonalDepthOtpInput(
  { length = 6, value, onValueChange, onComplete, mode = "numeric", label = "One-time code", disabled, invalid, className, name },
  ref,
) {
  const [uncontrolled, setUncontrolled] = useState("");
  const cells = useRef<(HTMLInputElement | null)[]>([]);
  const code = (value ?? uncontrolled).slice(0, length);

  const commit = (next: string) => {
    const clean = next.slice(0, length);
    if (value === undefined) setUncontrolled(clean);
    onValueChange?.(clean);
    if (clean.length === length) onComplete?.(clean);
  };

  const allowed = (char: string) => (mode === "numeric" ? /^\d$/.test(char) : /^[A-Za-z0-9]$/.test(char));

  const focusCell = (index: number) => cells.current[Math.max(0, Math.min(length - 1, index))]?.focus();

  const setAt = (index: number, char: string) => {
    const chars = code.padEnd(length, " ").split("");
    chars[index] = char;
    return chars.join("").trimEnd();
  };

  const handleChange = (index: number, raw: string) => {
    const char = raw.slice(-1);
    if (!char) return;
    if (!allowed(char)) return;
    commit(setAt(index, mode === "numeric" ? char : char.toUpperCase()));
    focusCell(index + 1);
  };

  const handleKey = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (code[index]) commit(setAt(index, " "));
      else { commit(setAt(index - 1, " ")); focusCell(index - 1); }
      return;
    }
    if (event.key === "ArrowLeft") { event.preventDefault(); focusCell(index - 1); }
    if (event.key === "ArrowRight") { event.preventDefault(); focusCell(index + 1); }
    if (event.key === "Home") { event.preventDefault(); focusCell(0); }
    if (event.key === "End") { event.preventDefault(); focusCell(length - 1); }
  };

  // A code arrives from an SMS as one string. Spreading it across the cells is
  // the whole reason a reader tolerates six boxes instead of one.
  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").split("").filter(allowed).join("");
    if (!pasted) return;
    const next = (mode === "numeric" ? pasted : pasted.toUpperCase()).slice(0, length);
    commit(next);
    focusCell(next.length);
  };

  return (
    <div
      className={cx("td-otp", "td-registry-otp", className)}
      role="group"
      aria-label={label}
      data-disabled={disabled || undefined}
      data-state={invalid ? "error" : undefined}
    >
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={node => {
            cells.current[index] = node;
            if (index === 0) {
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
            }
          }}
          className="td-otp-cell"
          type="text"
          inputMode={mode === "numeric" ? "numeric" : "text"}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          name={name ? `${name}-${index + 1}` : undefined}
          maxLength={1}
          disabled={disabled}
          aria-label={`${label}, digit ${index + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          data-filled={code[index] && code[index] !== " " ? "true" : undefined}
          value={code[index] && code[index] !== " " ? code[index] : ""}
          onChange={event => handleChange(index, event.target.value)}
          onKeyDown={event => handleKey(index, event)}
          onPaste={handlePaste}
          onFocus={event => event.target.select()}
        />
      ))}
    </div>
  );
});
