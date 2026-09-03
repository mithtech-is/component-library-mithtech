import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-checkbox.css";

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

/** `checkmark_circle_24_filled` */
function CheckboxMarkIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20m3.22 6.97-4.47 4.47-1.97-1.97a.75.75 0 0 0-1.06 1.06l2.5 2.5c.3.3.77.3 1.06 0l5-5a.75.75 0 1 0-1.06-1.06" {...props} />;
}

export interface TonalDepthCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
}

export const TonalDepthCheckbox = forwardRef<HTMLInputElement, TonalDepthCheckboxProps>(function TonalDepthCheckbox(
  { label, disabled, className, ...props }, ref,
) {
  return (
    <label className={cx("td-check", "td-registry-check", className)} data-disabled={disabled || undefined}>
      <input {...props} ref={ref} type="checkbox" disabled={disabled} />
      <span className="td-check-box" aria-hidden="true"><CheckboxMarkIcon weight={LAMP_WEIGHT} aria-hidden="true" /></span>
      <span>{label}</span>
    </label>
  );
});
