"use client";

import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-input.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  containerClassName?: string;
  /**
   * A show/hide control for a password, in the existing `trailing` slot.
   *
   * A prop rather than a `PasswordField`: the reader is typing into an TonalDepthInput
   * either way, and a separate component would have to re-declare every one of
   * TonalDepthInput's props to add one button.
   */
  revealable?: boolean;
}

export const TonalDepthInput = forwardRef<HTMLInputElement, TonalDepthInputProps>(function TonalDepthInput(
  { invalid = false, leading, trailing, revealable = false, disabled, className, containerClassName, "aria-invalid": ariaInvalid, type, ...props },
  ref,
) {
  const effectiveInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  const [revealed, setRevealed] = useState(false);
  const effectiveType = revealable ? (revealed ? "text" : "password") : type;
  const reveal = revealable ? (
    <button
      type="button"
      className="td-registry-input-reveal"
      aria-pressed={revealed}
      aria-label={revealed ? "Hide password" : "Show password"}
      disabled={disabled}
      onClick={() => setRevealed(v => !v)}
    >
      {revealed ? "Hide" : "Show"}
    </button>
  ) : null;
  return (
    <span
      className={cx("td-input-wrap", containerClassName)}
      data-state={effectiveInvalid ? "error" : undefined}
      data-disabled={disabled || undefined}
    >
      {leading ? <span className="td-input-icon" aria-hidden="true">{leading}</span> : null}
      <input {...props} type={effectiveType} ref={ref} disabled={disabled} aria-invalid={effectiveInvalid || undefined} className={cx("td-input", className)} />
      {trailing || reveal ? <span className="td-input-trailing">{trailing}{reveal}</span> : null}
    </span>
  );
});
