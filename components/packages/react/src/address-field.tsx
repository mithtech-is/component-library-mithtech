"use client";

/**
 * A postal address as one value.
 *
 * Pure composition — no new housing and no new CSS. It is `Input`s for the
 * lines a reader types freely and `Combobox`es for the two that come from a
 * list, arranged in the order a postal address is actually read. It exists as a
 * component rather than as six fields in a form because the ORDER is the design
 * decision: country before state before city, because each one narrows the
 * next, and a form that asks for the city first has to re-ask for it when the
 * country changes.
 */

import { forwardRef, useId } from "react";
import { cx } from "./utils";
import { Combobox, type ComboboxOption } from "./select";
import { Input } from "./input";
import "./address-field.css";

export interface AddressValue {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export const emptyAddress = (): AddressValue => ({ line1: "", line2: "", city: "", state: "", postcode: "", country: "" });

export interface AddressFieldProps {
  value?: AddressValue;
  onValueChange?: (value: AddressValue) => void;
  /** Countries to offer. Without it the country line is a plain text field. */
  countries?: ComboboxOption[];
  /** States for the chosen country. Same — without it, free text. */
  states?: ComboboxOption[];
  /** What the second administrative line is called here — "State", "Province". */
  stateLabel?: string;
  /** And the postal code — "PIN code", "ZIP", "Postcode". */
  postcodeLabel?: string;
  legend?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}

export const AddressField = forwardRef<HTMLInputElement, AddressFieldProps>(function AddressField(
  {
    value, onValueChange, countries, states, stateLabel = "State",
    postcodeLabel = "Postcode", legend = "Address", disabled, invalid, className,
  },
  ref,
) {
  const current = value ?? emptyAddress();
  const groupId = useId();
  const patch = (part: Partial<AddressValue>) => onValueChange?.({ ...current, ...part });

  return (
    <fieldset className={cx("td-fieldset", "td-react-address", className)} disabled={disabled}>
      <legend className="td-fieldset-legend" id={groupId}>{legend}</legend>

      <div className="td-react-address-row">
        <Input
          ref={ref}
          containerClassName="td-react-address-wide"
          autoComplete="address-line1"
          placeholder="Flat, building, street"
          aria-label="Address line 1"
          invalid={invalid}
          value={current.line1}
          onChange={event => patch({ line1: event.target.value })}
        />
      </div>
      <div className="td-react-address-row">
        <Input
          containerClassName="td-react-address-wide"
          autoComplete="address-line2"
          placeholder="Area, landmark (optional)"
          aria-label="Address line 2"
          value={current.line2}
          onChange={event => patch({ line2: event.target.value })}
        />
      </div>

      {/* Country first: it decides what the next two lines are even called. */}
      <div className="td-react-address-row td-react-address-row--split">
        {countries?.length ? (
          <Combobox
            options={countries}
            value={current.country}
            onValueChange={next => patch({ country: next, state: "" })}
            label="Country"
            placeholder="Country"
            disabled={disabled}
          />
        ) : (
          <Input
            autoComplete="country-name"
            placeholder="Country"
            aria-label="Country"
            value={current.country}
            onChange={event => patch({ country: event.target.value })}
          />
        )}

        {states?.length ? (
          <Combobox
            options={states}
            value={current.state}
            onValueChange={next => patch({ state: next })}
            label={stateLabel}
            placeholder={stateLabel}
            disabled={disabled}
          />
        ) : (
          <Input
            autoComplete="address-level1"
            placeholder={stateLabel}
            aria-label={stateLabel}
            value={current.state}
            onChange={event => patch({ state: event.target.value })}
          />
        )}
      </div>

      <div className="td-react-address-row td-react-address-row--split">
        <Input
          autoComplete="address-level2"
          placeholder="City"
          aria-label="City"
          value={current.city}
          onChange={event => patch({ city: event.target.value })}
        />
        <Input
          autoComplete="postal-code"
          inputMode="numeric"
          placeholder={postcodeLabel}
          aria-label={postcodeLabel}
          className="td-react-address-postcode"
          value={current.postcode}
          onChange={event => patch({ postcode: event.target.value })}
        />
      </div>
    </fieldset>
  );
});
