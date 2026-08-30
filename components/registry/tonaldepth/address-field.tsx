import { forwardRef, useId } from "react";
import "./tonaldepth-address-field.css";
import { TonalDepthCombobox, TonalDepthComboboxOption } from "./tonaldepth-combobox";
import { TonalDepthInput } from "./tonaldepth-input";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthAddressValue {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export const TonalDepthemptyAddress = (): TonalDepthAddressValue => ({ line1: "", line2: "", city: "", state: "", postcode: "", country: "" });

export interface TonalDepthAddressFieldProps {
  value?: TonalDepthAddressValue;
  onValueChange?: (value: TonalDepthAddressValue) => void;
  /** Countries to offer. Without it the country line is a plain text field. */
  countries?: TonalDepthComboboxOption[];
  /** States for the chosen country. Same — without it, free text. */
  states?: TonalDepthComboboxOption[];
  /** What the second administrative line is called here — "State", "Province". */
  stateLabel?: string;
  /** And the postal code — "PIN code", "ZIP", "Postcode". */
  postcodeLabel?: string;
  legend?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}

export const TonalDepthAddressField = forwardRef<HTMLInputElement, TonalDepthAddressFieldProps>(function TonalDepthAddressField(
  {
    value, onValueChange, countries, states, stateLabel = "State",
    postcodeLabel = "Postcode", legend = "Address", disabled, invalid, className,
  },
  ref,
) {
  const current = value ?? TonalDepthemptyAddress();
  const groupId = useId();
  const patch = (part: Partial<TonalDepthAddressValue>) => onValueChange?.({ ...current, ...part });

  return (
    <fieldset className={cx("td-fieldset", "td-registry-address", className)} disabled={disabled}>
      <legend className="td-fieldset-legend" id={groupId}>{legend}</legend>

      <div className="td-registry-address-row">
        <TonalDepthInput
          ref={ref}
          containerClassName="td-registry-address-wide"
          autoComplete="address-line1"
          placeholder="Flat, building, street"
          aria-label="Address line 1"
          invalid={invalid}
          value={current.line1}
          onChange={event => patch({ line1: event.target.value })}
        />
      </div>
      <div className="td-registry-address-row">
        <TonalDepthInput
          containerClassName="td-registry-address-wide"
          autoComplete="address-line2"
          placeholder="Area, landmark (optional)"
          aria-label="Address line 2"
          value={current.line2}
          onChange={event => patch({ line2: event.target.value })}
        />
      </div>

      {/* Country first: it decides what the next two lines are even called. */}
      <div className="td-registry-address-row td-registry-address-row--split">
        {countries?.length ? (
          <TonalDepthCombobox
            options={countries}
            value={current.country}
            onValueChange={next => patch({ country: next, state: "" })}
            label="Country"
            placeholder="Country"
            disabled={disabled}
          />
        ) : (
          <TonalDepthInput
            autoComplete="country-name"
            placeholder="Country"
            aria-label="Country"
            value={current.country}
            onChange={event => patch({ country: event.target.value })}
          />
        )}

        {states?.length ? (
          <TonalDepthCombobox
            options={states}
            value={current.state}
            onValueChange={next => patch({ state: next })}
            label={stateLabel}
            placeholder={stateLabel}
            disabled={disabled}
          />
        ) : (
          <TonalDepthInput
            autoComplete="address-level1"
            placeholder={stateLabel}
            aria-label={stateLabel}
            value={current.state}
            onChange={event => patch({ state: event.target.value })}
          />
        )}
      </div>

      <div className="td-registry-address-row td-registry-address-row--split">
        <TonalDepthInput
          autoComplete="address-level2"
          placeholder="City"
          aria-label="City"
          value={current.city}
          onChange={event => patch({ city: event.target.value })}
        />
        <TonalDepthInput
          autoComplete="postal-code"
          inputMode="numeric"
          placeholder={postcodeLabel}
          aria-label={postcodeLabel}
          className="td-registry-address-postcode"
          value={current.postcode}
          onChange={event => patch({ postcode: event.target.value })}
        />
      </div>
    </fieldset>
  );
});
