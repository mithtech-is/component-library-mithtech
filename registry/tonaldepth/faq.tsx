"use client";

import { forwardRef, useId, useState, type HTMLAttributes, type ReactNode } from "react";
import { CaretDownIcon as ChevronDownIcon } from "@phosphor-icons/react";
import "./tonaldepth-faq.css";

const LAMP_WEIGHT = "fill" as const;

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthFaqItem {
  /** Stable key, and what `value` / `onValueChange` speak in. */
  id: string;
  question: ReactNode;
  answer: ReactNode;
}

/**
 * How the list is housed.
 *
 * `plate` is the FAQ block: one carved plate with seams between the questions.
 * `seam` drops the housing and leaves the seams — which is the design system's
 * standalone **disclosure**. A single question in `seam` form is one
 * disclosure; that is the whole difference, and it is why there is no separate
 * component for it.
 */
export type TonalDepthFaqVariant = "plate" | "seam";

export interface TonalDepthFaqProps extends Omit<HTMLAttributes<HTMLElement>, "onChange"> {
  items: TonalDepthFaqItem[];
  /** Ids open on first render. Ignored once `value` is passed. */
  defaultValue?: string[];
  /** Controlled open ids. */
  value?: string[];
  onValueChange?: (open: string[]) => void;
  /** One at a time. Opening a question closes the one before it. */
  single?: boolean;
  /** `seam` drops the plate and leaves the seams — the standalone disclosure. */
  variant?: TonalDepthFaqVariant;
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
 * **The design system's standalone disclosure is this component with the plate
 * off.** `variant="seam"` drops the housing and leaves the seams; one item in
 * that form *is* a disclosure. It is a prop rather than a second component
 * because everything else — the button, `aria-expanded`, the controlled region,
 * the row press, the chevron — is identical, and two components would mean two
 * places to correct every time one of those changed.
 *
 * Two things the standalone disclosure does are deliberately not reproduced. It
 * puts the chevron on the *left*, in its own raised tile; a variant that moves
 * the mark to the other side is a second anatomy inside one component. And it
 * fills that tile with the brand colour when open, which is the one move the
 * system forbids ([[L11]]).
 */
export const TonalDepthFaq = forwardRef<HTMLElement, TonalDepthFaqProps>(function TonalDepthFaq(
  { items, defaultValue = [], value, onValueChange, single = false, variant = "plate", label, className, ...props },
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
    <section {...props} ref={ref} aria-label={label} className={cx("td-faq", "td-registry-faq", variant === "seam" && "td-registry-faq--seam", className)}>
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
