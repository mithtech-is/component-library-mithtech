import { forwardRef, type FieldsetHTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-checkbox-group.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthCheckboxGroupProps extends FieldsetHTMLAttributes<HTMLFieldSetElement> {
  legend?: ReactNode;
}

/**
 * Several checkboxes read as one question.
 *
 * The same fieldset and legend `RadioGroup` uses, and for the same reason: a
 * row of boxes with no group name is a row of unrelated questions to anyone
 * who cannot see that they are lined up. It carries no `name` context, because
 * unlike radios, checkboxes in a group do not share one.
 */
export const TonalDepthCheckboxGroup = forwardRef<HTMLFieldSetElement, TonalDepthCheckboxGroupProps>(function TonalDepthCheckboxGroup(
  { legend, disabled, className, children, ...props }, ref,
) {
  return (
    <fieldset {...props} ref={ref} disabled={disabled} className={cx("td-fieldset", className)}>
      {legend ? <legend className="td-fieldset-legend">{legend}</legend> : null}
      <div className="td-check-row">{children}</div>
    </fieldset>
  );
});
