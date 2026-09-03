"use client";

import { forwardRef, useId, useState, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-faq.css";

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

export interface TonalDepthFaqItem {
  /** Stable key, and what `value` / `onValueChange` speak in. */
  id: string;
  question: ReactNode;
  answer: ReactNode;
}

export interface TonalDepthFaqProps extends Omit<HTMLAttributes<HTMLElement>, "onChange"> {
  items: TonalDepthFaqItem[];
  /** Ids open on first render. Ignored once `value` is passed. */
  defaultValue?: string[];
  /** Controlled open ids. */
  value?: string[];
  onValueChange?: (open: string[]) => void;
  /** One at a time. Opening a question closes the one before it. */
  single?: boolean;
  /** Names the list for a screen reader. */
  label?: string;
}

/**
 * A list of questions that open in place.
 *
 * Each question is a real `button` with `aria-expanded`, and its answer is the
 * region that button controls — so the keyboard and a screen reader get the
 * disclosure for free.
 *
 * The answer is hidden with `hidden` rather than `display: none` in a
 * stylesheet, because the two disagree: a CSS-hidden panel is still found by
 * in-page search in some browsers, which is how a reader ends up scrolled to
 * text they cannot see.
 *
 * **There is one version of it, deliberately.** A `seam` variant that dropped
 * the plate existed briefly to cover the design system's standalone
 * disclosure; it was removed because two looks for one list is two things to
 * keep beautiful, and the list was the one that mattered. A disclosure is this
 * component with a single item — which it always was.
 */
export const TonalDepthFaq = forwardRef<HTMLElement, TonalDepthFaqProps>(function TonalDepthFaq(
  { items, defaultValue = [], value, onValueChange, single = false, label, className, ...props },
  ref,
) {
  const base = useId();
  const [uncontrolled, setUncontrolled] = useState<string[]>(defaultValue);
  const open = value ?? uncontrolled;

  const toggle = (id: string) => {
    const isOpen = open.includes(id);
    const next = single ? (isOpen ? [] : [id]) : isOpen ? open.filter(x => x !== id) : [...open, id];
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  return (
    <section {...props} ref={ref} aria-label={label} className={cx("td-faq", "td-registry-faq", className)}>
      {items.map(item => {
        const isOpen = open.includes(item.id);
        return (
          <div className="td-faq-item td-registry-faq-item" data-state={isOpen ? "open" : "closed"} key={item.id}>
            <h3 className="td-registry-faq-heading">
              <button
                type="button"
                className="td-faq-q td-registry-faq-q"
                id={`${base}-q-${item.id}`}
                aria-expanded={isOpen}
                aria-controls={`${base}-a-${item.id}`}
                onClick={() => toggle(item.id)}
              >
                <span className="td-registry-faq-text">{item.question}</span>
                <ChevronDownIcon className="td-faq-chev td-registry-faq-chev" weight={LAMP_WEIGHT} aria-hidden="true" />
              </button>
            </h3>
            <div
              className="td-faq-a td-registry-faq-a"
              id={`${base}-a-${item.id}`}
              role="region"
              aria-labelledby={`${base}-q-${item.id}`}
              hidden={!isOpen}
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </section>
  );
});
