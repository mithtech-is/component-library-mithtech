import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-switch.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthSwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role"> {
  label: ReactNode;
}

export const TonalDepthSwitch = forwardRef<HTMLInputElement, TonalDepthSwitchProps>(function TonalDepthSwitch(
  { label, disabled, className, ...props }, ref,
) {
  return (
    <label className={cx("td-switch", "td-registry-switch", className)} data-disabled={disabled || undefined}>
      <input {...props} ref={ref} type="checkbox" role="switch" disabled={disabled} />
      <span className="td-switch-track" aria-hidden="true"><span className="td-switch-thumb" /></span>
      <span>{label}</span>
    </label>
  );
});
