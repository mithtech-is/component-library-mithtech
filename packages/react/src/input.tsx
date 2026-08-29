import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cx } from "./utils";
import "./input.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, leading, trailing, disabled, className, containerClassName, "aria-invalid": ariaInvalid, ...props },
  ref,
) {
  const effectiveInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  return (
    <span
      className={cx("td-input-wrap", containerClassName)}
      data-state={effectiveInvalid ? "error" : undefined}
      data-disabled={disabled || undefined}
    >
      {leading ? <span className="td-input-icon" aria-hidden="true">{leading}</span> : null}
      <input {...props} ref={ref} disabled={disabled} aria-invalid={effectiveInvalid || undefined} className={cx("td-input", className)} />
      {trailing ? <span className="td-input-trailing">{trailing}</span> : null}
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
