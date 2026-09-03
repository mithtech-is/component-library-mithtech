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

import { forwardRef, useId, useState } from "react";
import { cx } from "./utils";
import { LocationIcon, LAMP_WEIGHT } from "./icons";
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
  /**
   * Turns on **Use my location** — a control that asks the browser where the
   * reader is and fills the address from it.
   *
   * You supply the reverse geocode. The component owns the permission prompt,
   * the pending state, the failure copy and the merge; it does not own a
   * service, and that is deliberate: baking one endpoint in would put every
   * consumer of this library behind one shared rate limit and one privacy
   * policy that none of them agreed to. OpenStreetMap's Nominatim, which is
   * the obvious free choice, explicitly requires a per-application User-Agent
   * and caps usage — terms a component cannot accept on your behalf.
   *
   * `reverseGeocode` is given the coordinates and returns whatever it could
   * resolve; anything it omits is left as the reader typed it. Throwing is
   * fine — the failure is reported and the fields are untouched.
   *
   * See the docs page for a Nominatim adapter you can paste in.
   */
  reverseGeocode?: (position: { latitude: number; longitude: number }) => Promise<Partial<AddressValue>>;
  /** The control's label. */
  locateLabel?: string;
}

export const AddressField = forwardRef<HTMLInputElement, AddressFieldProps>(function AddressField(
  {
    value, onValueChange, countries, states, stateLabel = "State",
    postcodeLabel = "Postcode", legend = "Address", disabled, invalid, className,
    reverseGeocode, locateLabel = "Use my location",
  },
  ref,
) {
  const current = value ?? emptyAddress();
  const groupId = useId();
  const patch = (part: Partial<AddressValue>) => onValueChange?.({ ...current, ...part });
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  /*
   * Asked for on PRESS, never on mount.
   *
   * `navigator.geolocation` fires the browser's permission prompt the moment
   * it is called, and a prompt that appears because a form rendered is the
   * fastest way to have location denied permanently for the origin — after
   * which this control cannot work for that reader again, on any page.
   */
  const locate = () => {
    if (!reverseGeocode || typeof navigator === "undefined" || !navigator.geolocation) {
      setLocateError("This browser cannot share a location.");
      return;
    }
    setLocateError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const found = await reverseGeocode({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          /* Merged over what is there, not swapped for it. A reader who has
             already typed a flat number keeps it — a geocode resolves a
             building, and the part inside the building is theirs. */
          onValueChange?.({ ...current, ...Object.fromEntries(Object.entries(found).filter(([, v]) => v)) });
        } catch {
          setLocateError("We could not turn that location into an address.");
        } finally {
          setLocating(false);
        }
      },
      error => {
        setLocating(false);
        setLocateError(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was declined. Type the address instead."
            : "We could not read your location.",
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  return (
    <fieldset className={cx("td-fieldset", "td-react-address", className)} disabled={disabled}>
      <legend className="td-fieldset-legend" id={groupId}>{legend}</legend>
      {reverseGeocode ? (
        <div className="td-react-address-locate">
          <button type="button" className="td-react-address-locate-btn" onClick={locate} disabled={disabled || locating}>
            <LocationIcon weight={LAMP_WEIGHT} aria-hidden="true" />
            {locating ? "Finding you…" : locateLabel}
          </button>
          {/* Polite, not assertive: the reader pressed a button and is waiting
              on it, so this is an answer rather than an interruption. */}
          <span className="td-react-address-locate-msg" role="status">{locateError}</span>
        </div>
      ) : null}

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
