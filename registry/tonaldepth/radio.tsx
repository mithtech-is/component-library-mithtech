"use client";

import { createContext, forwardRef, useContext, useId, type FieldsetHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-radio.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

type TonalDepthRadioContextValue = { name: string; disabled?: boolean };

const TonalDepthRadioContext = createContext<TonalDepthRadioContextValue | null>(null);

export interface TonalDepthRadioGroupProps extends FieldsetHTMLAttributes<HTMLFieldSetElement> {
  name?: string;
  legend?: ReactNode;
}

export const TonalDepthRadioGroup = forwardRef<HTMLFieldSetElement, TonalDepthRadioGroupProps>(function TonalDepthRadioGroup(
  { name, legend, disabled, className, children, ...props }, ref,
) {
  const generatedName = useId();
  return (
    <TonalDepthRadioContext.Provider value={{ name: name ?? generatedName, disabled }}>
      <fieldset {...props} ref={ref} disabled={disabled} className={cx("td-fieldset", className)}>
        {legend ? <legend className="td-fieldset-legend">{legend}</legend> : null}
        <div className="td-check-row">{children}</div>
      </fieldset>
    </TonalDepthRadioContext.Provider>
  );
});

export interface TonalDepthRadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  value: string;
}

export const TonalDepthRadio = forwardRef<HTMLInputElement, TonalDepthRadioProps>(function TonalDepthRadio(
  { label, disabled, className, name, ...props }, ref,
) {
  const group = useContext(TonalDepthRadioContext);
  const effectiveDisabled = disabled || group?.disabled;
  return (
    <label className={cx("td-radio", className)} data-disabled={effectiveDisabled || undefined}>
      <input {...props} ref={ref} type="radio" name={name ?? group?.name} disabled={effectiveDisabled} />
      <span className="td-radio-dot" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
});
