"use client";

// Copying is a clipboard write and a timer, so the module is a client boundary.
import { forwardRef, useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import { AcceptIcon, CopyIcon, LAMP_WEIGHT } from "./icons";
import "./copy-chip.css";

export interface CopyChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value" | "children"> {
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
export const CopyChip = forwardRef<HTMLButtonElement, CopyChipProps>(function CopyChip(
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
      className={cx("td-react-copy", className)}
      onClick={event => { onClick?.(event); if (!event.defaultPrevented) void copy(); }}
    >
      <span className="td-react-copy-lamp" aria-hidden="true">
        {copied ? <AcceptIcon weight={LAMP_WEIGHT} /> : <CopyIcon weight={LAMP_WEIGHT} />}
      </span>
      <span className="td-react-copy-text" ref={textRef}>{label ?? value}</span>
      {/* The copied state has to be heard, not only seen. */}
      <span className="td-react-copy-live" role="status" aria-live="polite">{copied ? copiedLabel : ""}</span>
    </button>
  );
});
