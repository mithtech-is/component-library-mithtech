"use client";

import { createContext, forwardRef, useContext, useId, type FieldsetHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import { CheckboxMarkIcon, LAMP_WEIGHT } from "./icons";
import "./selection.css";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, disabled, className, ...props }, ref,
) {
  return (
    <label className={cx("td-check", "td-react-check", className)} data-disabled={disabled || undefined}>
      <input {...props} ref={ref} type="checkbox" disabled={disabled} />
      <span className="td-check-box" aria-hidden="true"><CheckboxMarkIcon weight={LAMP_WEIGHT} aria-hidden="true" /></span>
      <span>{label}</span>
    </label>
  );
});

type RadioContextValue = { name: string; disabled?: boolean };
const RadioContext = createContext<RadioContextValue | null>(null);

export interface RadioGroupProps extends FieldsetHTMLAttributes<HTMLFieldSetElement> {
  name?: string;
  legend?: ReactNode;
}

export const RadioGroup = forwardRef<HTMLFieldSetElement, RadioGroupProps>(function RadioGroup(
  { name, legend, disabled, className, children, ...props }, ref,
) {
  const generatedName = useId();
  return (
    <RadioContext.Provider value={{ name: name ?? generatedName, disabled }}>
      <fieldset {...props} ref={ref} disabled={disabled} className={cx("td-fieldset", className)}>
        {legend ? <legend className="td-fieldset-legend">{legend}</legend> : null}
        <div className="td-check-row">{children}</div>
      </fieldset>
    </RadioContext.Provider>
  );
});

export interface CheckboxGroupProps extends FieldsetHTMLAttributes<HTMLFieldSetElement> {
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
export const CheckboxGroup = forwardRef<HTMLFieldSetElement, CheckboxGroupProps>(function CheckboxGroup(
  { legend, disabled, className, children, ...props }, ref,
) {
  return (
    <fieldset {...props} ref={ref} disabled={disabled} className={cx("td-fieldset", className)}>
      {legend ? <legend className="td-fieldset-legend">{legend}</legend> : null}
      <div className="td-check-row">{children}</div>
    </fieldset>
  );
});

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  value: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, disabled, className, name, ...props }, ref,
) {
  const group = useContext(RadioContext);
  const effectiveDisabled = disabled || group?.disabled;
  return (
    <label className={cx("td-radio", className)} data-disabled={effectiveDisabled || undefined}>
      <input {...props} ref={ref} type="radio" name={name ?? group?.name} disabled={effectiveDisabled} />
      <span className="td-radio-dot" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
});

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role"> {
  label: ReactNode;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, disabled, className, ...props }, ref,
) {
  return (
    <label className={cx("td-switch", "td-react-switch", className)} data-disabled={disabled || undefined}>
      <input {...props} ref={ref} type="checkbox" role="switch" disabled={disabled} />
      <span className="td-switch-track" aria-hidden="true"><span className="td-switch-thumb" /></span>
      <span>{label}</span>
    </label>
  );
});
