"use client";

import { forwardRef, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cx } from "./utils";
import "./input.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  containerClassName?: string;
  /**
   * A show/hide control for a password, in the existing `trailing` slot.
   *
   * A prop rather than a `PasswordField`: the reader is typing into an Input
   * either way, and a separate component would have to re-declare every one of
   * Input's props to add one button.
   */
  revealable?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, leading, trailing, revealable = false, disabled, className, containerClassName, "aria-invalid": ariaInvalid, type, ...props },
  ref,
) {
  const effectiveInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  const [revealed, setRevealed] = useState(false);
  const effectiveType = revealable ? (revealed ? "text" : "password") : type;
  const reveal = revealable ? (
    <button
      type="button"
      className="td-react-input-reveal"
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

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid = false, disabled, className, containerClassName, "aria-invalid": ariaInvalid, ...props },
  ref,
) {
  const effectiveInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  return (
    <span className={cx("td-textarea-wrap", "td-react-textarea-wrap", containerClassName)} data-state={effectiveInvalid ? "error" : undefined} data-disabled={disabled || undefined}>
      <textarea {...props} ref={ref} disabled={disabled} aria-invalid={effectiveInvalid || undefined} className={cx("td-textarea", className)} />
    </span>
  );
});
