import { cloneElement, forwardRef, isValidElement, useId, type HTMLAttributes, type ReactElement, type ReactNode } from "react";
import "./tonaldepth-form-field.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthFormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: ReactNode;
  htmlFor?: string;
  helperText?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  optional?: boolean;
  children: ReactElement<Record<string, unknown>>;
}

/* The error message is associated with the control through `aria-describedby`
   and is read when focus lands on it, so it carries no live region of its own.
   A form that validates several fields at once should announce the failures in
   one summary above the form — three assertive regions firing together talk
   over each other and the field message is announced twice. */
export const TonalDepthFormField = forwardRef<HTMLDivElement, TonalDepthFormFieldProps>(function TonalDepthFormField(
  { label, htmlFor, helperText, error, required, optional, children, className, ...props },
  ref,
) {
  const generatedId = useId();
  const controlId = htmlFor ?? generatedId;
  const messageId = `${controlId}-message`;
  const hasMessage = Boolean(error || helperText);
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? controlId,
        "aria-describedby": children.props["aria-describedby"] ?? (hasMessage ? messageId : undefined),
        "aria-invalid": children.props["aria-invalid"] ?? (Boolean(error) || undefined),
        required: children.props.required ?? (required || undefined),
      })
    : children;
  return (
    <div {...props} ref={ref} className={cx("td-field", className)} data-invalid={Boolean(error) || undefined}>
      <label className="td-label" htmlFor={controlId}>
        {label}
        {required ? <span className="td-label-required" aria-hidden="true">*</span> : null}
        {optional ? <span className="td-label-optional">Optional</span> : null}
      </label>
      {control}
      {error ? <p id={messageId} className="td-helper td-helper--error">{error}</p> : helperText ? <p id={messageId} className="td-helper">{helperText}</p> : null}
    </div>
  );
});
