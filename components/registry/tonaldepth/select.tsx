import { forwardRef, type ReactNode, type SelectHTMLAttributes } from "react";
import { CaretDownIcon as ChevronDownIcon } from "@phosphor-icons/react";
import "./tonaldepth-select.css";

const LAMP_WEIGHT = "fill" as const;

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/* ── TonalDepthSelect ──────────────────────────────────────────────────────────── */

export interface TonalDepthSelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface TonalDepthSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  options: TonalDepthSelectOption[];
  /** The unselected row. Rendered as a disabled empty-value option. */
  placeholder?: string;
  invalid?: boolean;
  containerClassName?: string;
}

/**
 * A native `<select>` in the system's housing.
 *
 * Native on purpose: the platform picker, the keyboard, the type-ahead and
 * every assistive technology arrive already correct, and on a phone the reader
 * gets the OS wheel rather than a listbox rebuilt in a page.
 */
export const TonalDepthSelect = forwardRef<HTMLSelectElement, TonalDepthSelectProps>(function TonalDepthSelect(
  { options, placeholder, invalid = false, disabled, className, containerClassName, "aria-invalid": ariaInvalid, ...props },
  ref,
) {
  const effectiveInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  return (
    <span
      className={cx("td-select-wrap", containerClassName)}
      data-state={effectiveInvalid ? "error" : undefined}
      data-disabled={disabled || undefined}
    >
      <select
        {...props}
        ref={ref}
        disabled={disabled}
        aria-invalid={effectiveInvalid || undefined}
        className={cx("td-select", className)}
      >
        {placeholder !== undefined ? <option value="" disabled>{placeholder}</option> : null}
        {options.map(option => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {typeof option.label === "string" ? option.label : option.value}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="td-select-chevron" weight={LAMP_WEIGHT} aria-hidden="true" />
    </span>
  );
});
