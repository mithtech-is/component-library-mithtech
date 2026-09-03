"use client";

import { forwardRef, useId, useState } from "react";
import "./tonaldepth-address-field.css";
import { TonalDepthCombobox, TonalDepthComboboxOption } from "./tonaldepth-combobox";
import { TonalDepthInput } from "./tonaldepth-input";

const LAMP_WEIGHT = "fill" as const;

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * Microsoft's Fluent System Icons, filled weight, copied in because a registry
 * item is one self-contained file. Vendored from `@fluentui/svg-icons` and
 * stripped to `currentColor`, so the component's lamp ladder moves them.
 */
interface FluentIconProps extends SVGProps<SVGSVGElement> {
  /** Edge length. `1em` so the glyph scales with the type it sits beside. */
  size?: number | string;
  /** The fill. `currentColor` so the lamp ramp can move it. */
  color?: string;
  /**
   * Swallowed, not forwarded. Fluent marks are filled by construction, so
   * there is nothing to switch — but call sites pass `weight={LAMP_WEIGHT}`
   * and `weight` is not an SVG attribute, so React would put it on the DOM.
   */
  weight?: string;
  /** Flip horizontally, for a mark that points. */
  mirrored?: boolean;
}

interface FluentGlyphProps extends FluentIconProps {
  viewBox: string;
  d: string;
}

function FluentGlyph({ viewBox, d, size = "1em", color = "currentColor", weight, mirrored, ...props }: FluentGlyphProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      fill={color}
      transform={mirrored ? "scale(-1, 1)" : undefined}
      {...props}
    >
      <path d={d} />
    </svg>
  );
}

/** `location_24_filled` */
function LocationIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M5.84 4.57a8.7 8.7 0 1 1 12.32 12.31l-1.19 1.18q-1.31 1.29-3.4 3.3c-.88.85-2.26.85-3.13 0l-3.5-3.39-1.1-1.09a8.7 8.7 0 0 1 0-12.31M12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6" {...props} />;
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
  reverseGeocode?: (position: { latitude: number; longitude: number }) => Promise<Partial<TonalDepthAddressValue>>;
  /** The control's label. */
  locateLabel?: string;
}

export const TonalDepthAddressField = forwardRef<HTMLInputElement, TonalDepthAddressFieldProps>(function TonalDepthAddressField(
  {
    value, onValueChange, countries, states, stateLabel = "State",
    postcodeLabel = "Postcode", legend = "Address", disabled, invalid, className,
    reverseGeocode, locateLabel = "Use my location",
  },
  ref,
) {
  const current = value ?? TonalDepthemptyAddress();
  const groupId = useId();
  const patch = (part: Partial<TonalDepthAddressValue>) => onValueChange?.({ ...current, ...part });
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
    <fieldset className={cx("td-fieldset", "td-registry-address", className)} disabled={disabled}>
      <legend className="td-fieldset-legend" id={groupId}>{legend}</legend>
      {reverseGeocode ? (
        <div className="td-registry-address-locate">
          <button type="button" className="td-registry-address-locate-btn" onClick={locate} disabled={disabled || locating}>
            <LocationIcon weight={LAMP_WEIGHT} aria-hidden="true" />
            {locating ? "Finding you…" : locateLabel}
          </button>
          {/* Polite, not assertive: the reader pressed a button and is waiting
              on it, so this is an answer rather than an interruption. */}
          <span className="td-registry-address-locate-msg" role="status">{locateError}</span>
        </div>
      ) : null}

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
