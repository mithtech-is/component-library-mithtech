import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import { CloseIcon, LAMP_WEIGHT } from "./icons";
import "./alert.css";

export type AlertVariant = "info" | "success" | "warning" | "error";
export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: AlertVariant;
  title: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { variant = "info", title, onDismiss, dismissLabel = "Dismiss", className, children, ...props }, ref,
) {
  return (
    <div {...props} ref={ref} role={variant === "error" ? "alert" : "status"} className={cx("td-alert", `td-alert--${variant}`, "td-react-alert", `td-react-alert--${variant}`, className)}>
      {/* The category is one lit lamp, not a glyph, a tinted tile and a painted
          rail all saying the same thing. `aria-hidden` because the variant is
          already carried by `role` and by the title. */}
      <span className="td-react-alert-lamp" aria-hidden="true" />
      {/* The body is one paragraph, so children must be inline content —
          passing a <p> nests one inside another and breaks hydration. */}
      <div><strong>{title}</strong>{children ? <p>{children}</p> : null}</div>
      {onDismiss ? <button className={cx("td-alert-close", "td-react-alert-close")} type="button" aria-label={dismissLabel} onClick={onDismiss}><CloseIcon weight={LAMP_WEIGHT} /></button> : null}
    </div>
  );
});
