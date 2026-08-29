"use client";

// Disclosure is open/closed state, so the module is a client boundary.
import { forwardRef, useId, useState, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import { ChevronDownIcon, LAMP_WEIGHT } from "./icons";
import "./faq.css";

export interface FaqItem {
  /** Stable key, and what `value` / `onValueChange` speak in. */
  id: string;
  question: ReactNode;
  answer: ReactNode;
}

export interface FaqProps extends Omit<HTMLAttributes<HTMLElement>, "onChange"> {
  items: FaqItem[];
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
export const Faq = forwardRef<HTMLElement, FaqProps>(function Faq(
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
    <section {...props} ref={ref} aria-label={label} className={cx("td-faq", "td-react-faq", className)}>
      {items.map(item => {
        const isOpen = open.includes(item.id);
        return (
          <div className="td-faq-item td-react-faq-item" data-state={isOpen ? "open" : "closed"} key={item.id}>
            <h3 className="td-react-faq-heading">
              <button
                type="button"
                className="td-faq-q td-react-faq-q"
                id={`${base}-q-${item.id}`}
                aria-expanded={isOpen}
                aria-controls={`${base}-a-${item.id}`}
                onClick={() => toggle(item.id)}
              >
                <span className="td-react-faq-text">{item.question}</span>
                <ChevronDownIcon className="td-faq-chev td-react-faq-chev" weight={LAMP_WEIGHT} aria-hidden="true" />
              </button>
            </h3>
            <div
              className="td-faq-a td-react-faq-a"
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
