import { forwardRef, type TextareaHTMLAttributes } from "react";
import "./tonaldepth-textarea.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  containerClassName?: string;
}

export const TonalDepthTextarea = forwardRef<HTMLTextAreaElement, TonalDepthTextareaProps>(function TonalDepthTextarea(
  { invalid = false, disabled, className, containerClassName, "aria-invalid": ariaInvalid, ...props },
  ref,
) {
  const effectiveInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  return (
    <span className={cx("td-textarea-wrap", "td-registry-textarea-wrap", containerClassName)} data-state={effectiveInvalid ? "error" : undefined} data-disabled={disabled || undefined}>
      <textarea {...props} ref={ref} disabled={disabled} aria-invalid={effectiveInvalid || undefined} className={cx("td-textarea", className)} />
    </span>
  );
});
