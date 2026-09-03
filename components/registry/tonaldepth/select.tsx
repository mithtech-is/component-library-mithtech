import { forwardRef, type ReactNode, type SelectHTMLAttributes } from "react";
import "./tonaldepth-select.css";

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

/** `chevron_down_24_filled` */
function ChevronDownIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M4.3 8.3a1 1 0 0 1 1.4 0l6.3 6.29 6.3-6.3a1 1 0 1 1 1.4 1.42l-7 7a1 1 0 0 1-1.4 0l-7-7a1 1 0 0 1 0-1.42" {...props} />;
}

/* ── TonalDepthSelect ──────────────────────────────────────────────────────────── */

export interface TonalDepthSelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

/**
 * How tall the field is drawn.
 *
 * `sm` is `Button size="sm"` to the pixel: 34px tall, 12px of label, a 10px
 * radius. A filter row mixing a small button with a default field sat them
 * 3px apart and read as two rows of one thing.
 *
 * `md` is the field's own existing height — 37px, unchanged, so no caller
 * moves. It is deliberately NOT raised to `Button size="md"`'s 42px: that
 * would be a silent 5px shift under every TonalDepthSelect already shipped, to fix an
 * alignment nobody has reported.
 */
export type TonalDepthSelectSize = "sm" | "md";

export interface TonalDepthSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children" | "size"> {
  options: TonalDepthSelectOption[];
  /** The unselected row. Rendered as a disabled empty-value option. */
  placeholder?: string;
  invalid?: boolean;
  containerClassName?: string;
  /**
   * `md` by default, matching `Button size="md"`. Pass `sm` beside a small
   * button so the two share a baseline.
   *
   * This shadows the native `size` attribute, which on a `<select>` means
   * "show this many rows at once" and turns the control into a list box —
   * not something any caller of this component has ever wanted, and not
   * something the housing can draw.
   */
  size?: TonalDepthSelectSize;
}

/**
 * A native `<select>` in the system's housing.
 *
 * Native on purpose: the platform picker, the keyboard, the type-ahead and
 * every assistive technology arrive already correct, and on a phone the reader
 * gets the OS wheel rather than a listbox rebuilt in a page.
 */
export const TonalDepthSelect = forwardRef<HTMLSelectElement, TonalDepthSelectProps>(function TonalDepthSelect(
  { options, placeholder, invalid = false, disabled, size = "md", className, containerClassName, "aria-invalid": ariaInvalid, ...props },
  ref,
) {
  const effectiveInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  return (
    <span
      className={cx("td-select-wrap", "td-registry-select", size === "sm" && "td-registry-select--sm", containerClassName)}
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
