import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-input.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  containerClassName?: string;
}

export const TonalDepthInput = forwardRef<HTMLInputElement, TonalDepthInputProps>(function TonalDepthInput(
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
