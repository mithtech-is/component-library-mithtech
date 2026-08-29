"use client";

import { useEffect, useRef, useState, forwardRef, type MouseEvent } from "react";
import { Button, type ButtonProps } from "./button";
import "./confirm-button.css";

export interface ConfirmButtonProps extends Omit<ButtonProps, "children" | "onClick"> {
  /** What the button says at rest — "Delete build". */
  label: string;
  /** What it says once armed. Default `Sure?`. */
  confirmLabel?: string;
  /** Fires on the SECOND press only. The first press only arms it. */
  onConfirm?: () => void;
  /**
   * How long it stays armed before returning to rest, in milliseconds.
   * Default 3000. A button that stays armed forever is a button that will be
   * pressed by accident an hour later.
   */
  timeout?: number;
}

/**
 * A destructive action that asks once, in place.
 *
 * The first press arms it and the label changes; the second press inside the
 * timeout commits. Nothing else moves — no dialog, no toast, no second control
 * appearing beside it, so the reader's pointer is already where it needs to be.
 *
 * This is `Button` with a state machine on top, in its own module for the
 * reason every wrapper here exists: `Button` is server-renderable and is on
 * every page in the system, and a `useState` in it would push a client boundary
 * onto all of them ([[L22]]).
 *
 * **Use it for the reversible-but-annoying.** Deleting a build, rolling back a
 * deploy, archiving a project. For something genuinely unrecoverable — deleting
 * an account, a customer, a ledger — use `Dialog`, where the reader has to read
 * a sentence and the consequence can be spelled out. An inline confirm is a
 * speed bump, not informed consent.
 */
export const ConfirmButton = forwardRef<HTMLButtonElement, ConfirmButtonProps>(function ConfirmButton(
  { label, confirmLabel = "Sure?", onConfirm, timeout = 3000, variant = "secondary", ...props },
  ref,
) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const press = (event: MouseEvent<HTMLButtonElement>) => {
    if (!armed) {
      // `preventDefault` because a ConfirmButton inside a form must not submit
      // it on the arming press — the whole point is that the first press does
      // nothing but ask.
      event.preventDefault();
      setArmed(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setArmed(false), timeout);
      return;
    }
    clearTimeout(timer.current);
    setArmed(false);
    onConfirm?.();
  };

  return (
    <Button
      {...props}
      ref={ref}
      variant={armed ? "destructive" : variant}
      className={armed ? "td-react-confirm td-react-confirm--armed" : "td-react-confirm"}
      // The label changes under the reader's pointer, so the change has to be
      // announced: without this a screen-reader user presses "Delete build",
      // hears nothing, and presses it again — which commits.
      aria-live="polite"
      data-armed={armed ? "true" : undefined}
      onClick={press}
      onBlur={event => {
        setArmed(false);
        props.onBlur?.(event);
      }}
      onKeyDown={event => {
        // Escape disarms, which is the shape every other dismissable thing in
        // the system has.
        if (event.key === "Escape" && armed) {
          clearTimeout(timer.current);
          setArmed(false);
        }
        props.onKeyDown?.(event);
      }}
    >
      {armed ? confirmLabel : label}
    </Button>
  );
});
