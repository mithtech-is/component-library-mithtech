"use client";

import { forwardRef, useRef, useState, type KeyboardEvent, type InputHTMLAttributes, type SVGProps } from "react";
import "./tonaldepth-tag-input.css";

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

export interface TonalDepthTagInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange"> {
  /** The tags. Controlled — pair with `onValueChange`. */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Keys that commit whatever is typed. Default Enter and comma. */
  commitKeys?: string[];
  /** Refuse a tag past this count. The input disappears when it is reached. */
  max?: number;
  /** Reject a duplicate rather than adding it twice. Default true. */
  unique?: boolean;
  invalid?: boolean;
  label?: string;
  containerClassName?: string;
}

export const TonalDepthTagInput = forwardRef<HTMLInputElement, TonalDepthTagInputProps>(function TonalDepthTagInput(
  {
    value, defaultValue, onValueChange, commitKeys = ["Enter", ","], max, unique = true,
    invalid = false, disabled, label, placeholder, className, containerClassName,
    "aria-invalid": ariaInvalid, onKeyDown, ...props
  },
  ref,
) {
  const [uncontrolled, setUncontrolled] = useState<string[]>(defaultValue ?? []);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const tags = value ?? uncontrolled;
  const effectiveInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  const full = max !== undefined && tags.length >= max;

  const commit = (next: string[]) => {
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  const add = (raw: string) => {
    const tag = raw.trim();
    if (!tag || full) return;
    if (unique && tags.includes(tag)) { setDraft(""); return; }
    commit([...tags, tag]);
    setDraft("");
  };

  const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (commitKeys.includes(event.key)) { event.preventDefault(); add(draft); return; }
    // Backspace on an empty field takes the last tag back — the standard
    // gesture, and the only way to undo without reaching for the mouse.
    if (event.key === "Backspace" && !draft && tags.length) {
      event.preventDefault();
      commit(tags.slice(0, -1));
    }
  };

  return (
    <div
      className={cx("td-taginput", "td-registry-taginput", containerClassName)}
      data-state={effectiveInvalid ? "error" : undefined}
      data-disabled={disabled || undefined}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map(tag => (
        <span className="td-taginput-tag" key={tag}>
          {tag}
          <button
            type="button"
            className="td-taginput-x"
            aria-label={`Remove ${tag}`}
            disabled={disabled}
            onClick={event => { event.stopPropagation(); commit(tags.filter(t => t !== tag)); }}
          >
            <CloseIcon weight={LAMP_WEIGHT} aria-hidden="true" />
          </button>
        </span>
      ))}
      {full ? null : (
        <input
          {...props}
          ref={node => {
            inputRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          type="text"
          className={cx("td-taginput-input", className)}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={label}
          aria-invalid={effectiveInvalid || undefined}
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={handleKey}
          onBlur={() => add(draft)}
        />
      )}
    </div>
  );
});
