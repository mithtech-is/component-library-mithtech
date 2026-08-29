import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { CheckCircleIcon as CheckboxMarkIcon } from "@phosphor-icons/react";
import "./tonaldepth-checkbox.css";

const LAMP_WEIGHT = "fill" as const;

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
}

export const TonalDepthCheckbox = forwardRef<HTMLInputElement, TonalDepthCheckboxProps>(function TonalDepthCheckbox(
  { label, disabled, className, ...props }, ref,
) {
  return (
    <label className={cx("td-check", "td-registry-check", className)} data-disabled={disabled || undefined}>
      <input {...props} ref={ref} type="checkbox" disabled={disabled} />
      <span className="td-check-box" aria-hidden="true"><CheckboxMarkIcon weight={LAMP_WEIGHT} aria-hidden="true" /></span>
      <span>{label}</span>
    </label>
  );
});
