"use client";

import { forwardRef, useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode, type SVGProps } from "react";
import "./tonaldepth-copy-chip.css";

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

const CHECK_FAT = "M243.31,90.91l-128.4,128.4a16,16,0,0,1-22.62,0l-71.62-72a16,16,0,0,1,0-22.61l20-20a16,16,0,0,1,22.58,0L104,144.22l96.76-95.57a16,16,0,0,1,22.59,0l19.95,19.54A16,16,0,0,1,243.31,90.91Z";

function TdCheckFat(props: TdIconProps) {
  return <TdGlyph viewBox="0 0 256 256" d={CHECK_FAT} {...props} />;
}

const AcceptIcon = TdCheckFat;

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

/** `copy_24_filled` */
function CopyIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M8.5 13.75c0 2.35 1.9 4.25 4.25 4.25h1.74a3.25 3.25 0 0 1-3.24 3h-5A3.25 3.25 0 0 1 3 17.75v-7.5C3 8.45 4.46 7 6.25 7H8.5zM17.75 3C19.55 3 21 4.46 21 6.25v7.5c0 1.8-1.46 3.25-3.25 3.25h-5a3.25 3.25 0 0 1-3.25-3.25v-7.5C9.5 4.45 10.96 3 12.75 3z" {...props} />;
}

export interface TonalDepthCopyChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value" | "children"> {
  /** The text put on the clipboard. */
  value: string;
  /** What is shown. Defaults to `value` — override it when the string is long. */
  label?: ReactNode;
  /** How long the copied state holds, in ms. Default 1600. */
  holdFor?: number;
  /** Announced, and shown as the label, while the copied state holds. */
  copiedLabel?: string;
  /** Called after a successful copy. */
  onCopied?: (value: string) => void;
}

/**
 * A machine value the reader can take with them — a host, a command, a URL.
 *
 * The value is set in mono because it is a machine value, and the chip reports
 * its own success: the glyph swaps to the accept mark and the ink steps to
 * green for a moment. That is the whole feedback. There is no toast, and no
 * tinted plate behind it — a category arrives as ink and light, never as a
 * wash, so the original's green fill is deliberately not reproduced.
 *
 * `navigator.clipboard` needs a secure context. Where it is missing the chip
 * falls back to selecting its own text, so the reader can still copy by hand
 * rather than being left with a dead button.
 */
export const TonalDepthCopyChip = forwardRef<HTMLButtonElement, TonalDepthCopyChipProps>(function TonalDepthCopyChip(
  { value, label, holdFor = 1600, copiedLabel = "Copied", onCopied, className, onClick, type, ...props },
  ref,
) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // No clipboard (insecure origin, or a browser that refuses): select the
      // text instead so the reader can copy it themselves.
      const node = textRef.current;
      if (node && typeof getSelection === "function") {
        const range = document.createRange();
        range.selectNodeContents(node);
        const selection = getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      return;
    }
    setCopied(true);
    onCopied?.(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), holdFor);
  }, [value, holdFor, onCopied]);

  return (
    <button
      {...props}
      ref={ref}
      type={type ?? "button"}
      data-state={copied ? "copied" : undefined}
      // The chip names itself for a screen reader; the visible text is the
      // value, which on its own does not say what the control does.
      aria-label={props["aria-label"] ?? `Copy ${value}`}
      className={cx("td-registry-copy", className)}
      onClick={event => { onClick?.(event); if (!event.defaultPrevented) void copy(); }}
    >
      <span className="td-registry-copy-lamp" aria-hidden="true">
        {copied ? <AcceptIcon weight={LAMP_WEIGHT} /> : <CopyIcon weight={LAMP_WEIGHT} />}
      </span>
      <span className="td-registry-copy-text" ref={textRef}>{label ?? value}</span>
      {/* The copied state has to be heard, not only seen. */}
      <span className="td-registry-copy-live" role="status" aria-live="polite">{copied ? copiedLabel : ""}</span>
    </button>
  );
});
