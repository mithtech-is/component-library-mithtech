"use client";

import { forwardRef, useState, type HTMLAttributes, type ReactNode, type SVGProps } from "react";
import "./tonaldepth-filter-bar.css";

const LAMP_WEIGHT = "fill" as const;

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * TonalDepth's own glyphs, copied in because a registry item is one
 * self-contained file. Filled and colour-neutral by construction, so the
 * component's lamp ladder moves them through `currentColor`.
 */
interface TdIconProps extends SVGProps<SVGSVGElement> {
  /** Edge length. `1em` so the glyph scales with the type it sits beside. */
  size?: number | string;
  /** The fill. `currentColor` so the lamp ramp can move it. */
  color?: string;
  /**
   * Accepted so a TD glyph is a drop-in at a call site passing
   * `weight={LAMP_WEIGHT}`. TD glyphs are filled by construction, so there is
   * nothing to switch — the prop is swallowed rather than forwarded, because
   * `weight` is not an SVG attribute and React would put it on the DOM.
   */
  weight?: string;
  /** Flip horizontally, matching Phosphor's prop of the same name. */
  mirrored?: boolean;
}

/** `fillRule` comes from `SVGProps`; pass `evenodd` where the artwork knocks a
 *  hole out of its own outline. */
interface TdGlyphProps extends TdIconProps {
  viewBox: string;
  d: string;
}

function TdGlyph({ viewBox, d, fillRule, size = "1em", color = "currentColor", weight, mirrored, ...props }: TdGlyphProps) {
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
      <path d={d} fillRule={fillRule} />
    </svg>
  );
}

// A bare cross, drawn as one filled polygon: two 40-unit bars crossing at the
// centre, tips at 30.4/225.6. Not a stroked path — the set is filled by
// construction, and a stroke cannot carry the lamp's glow.
const CLOSE = "M58.7,225.6 30.4,197.3 99.7,128 30.4,58.7 58.7,30.4 128,99.7 197.3,30.4 225.6,58.7 156.3,128 225.6,197.3 197.3,225.6 128,156.3Z";

/**
 * The dismiss mark. A bare cross.
 *
 * Phosphor's `X` cannot be used: at `fill` weight a stroke-only glyph renders
 * as a filled square PLATE with the mark knocked out of it. Its `XCircle` —
 * which this replaces — is a solid disc, and at the 13px a dismiss control
 * uses that reads as a hole punched in the surface rather than as a mark on
 * it, which is the one move the system forbids. The bar and the disc were
 * also the same glyph as CancelIcon, so dismissing a panel and refusing an
 * action looked identical.
 */
function TdClose(props: TdIconProps) {
  return <TdGlyph viewBox="0 0 256 256" d={CLOSE} {...props} />;
}

const CloseIcon = TdClose;

export interface TonalDepthFilterOption {
  value: string;
  label: ReactNode;
  count?: number;
  color?: "brand" | "accent";
  disabled?: boolean;
}

export interface TonalDepthFilterBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  label?: string;
  options: TonalDepthFilterOption[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  clearLabel?: string;
}

export const TonalDepthFilterBar = forwardRef<HTMLDivElement, TonalDepthFilterBarProps>(function TonalDepthFilterBar(
  { label = "Filters", options, value, defaultValue = [], onValueChange, clearLabel = "Clear filters", className, ...props }, ref,
) {
  const [internal, setInternal] = useState(defaultValue);
  const selected = value ?? internal;
  const update = (next: string[]) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };
  const toggle = (option: string) => update(selected.includes(option) ? selected.filter(item => item !== option) : [...selected, option]);
  return (
    <div {...props} ref={ref} role="group" aria-label={label} className={cx("td-filters", className)}>
      {options.map(option => (
        <button key={option.value} type="button" className="td-filter-chip" aria-pressed={selected.includes(option.value)} data-color={option.color} disabled={option.disabled} onClick={() => toggle(option.value)}>
          {option.label}{option.count !== undefined ? <span className="td-filter-chip-count">{option.count}</span> : null}
        </button>
      ))}
      {selected.length ? <button type="button" className="td-filters-clear" onClick={() => update([])}>{clearLabel}<span className="td-filters-clear-x" aria-hidden="true"><CloseIcon weight={LAMP_WEIGHT} /></span></button> : null}
    </div>
  );
});
