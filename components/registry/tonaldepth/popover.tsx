"use client";

import { forwardRef, useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import "./tonaldepth-popover.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthPopoverProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /**
   * The trigger button's content — the words and/or icon that open the panel.
   * This is the button's *contents*, not the button: TonalDepthPopover renders the button
   * itself, so passing another button here would nest one inside another.
   */
  trigger: ReactNode;
  /** An optional title row at the top of the panel; also names it for a screen reader. */
  title?: ReactNode;
  /**
   * The panel's accessible name when there is no `title` to label it. One of
   * `title` or `label` should be present, or the dialog reaches a screen reader
   * unnamed.
   */
  label?: string;
  /** The panel body. */
  children: ReactNode;
  /** Controlled open state. Pass it with `onOpenChange`; omit to run uncontrolled. */
  open?: boolean;
  /** The open state before the reader touches it, when uncontrolled. */
  defaultOpen?: boolean;
  /** Called when the popover wants to open or close. */
  onOpenChange?: (open: boolean) => void;
  /** Class for the trigger button, to restyle it or swap in another control's look. */
  triggerClassName?: string;
}

/**
 * A click-triggered panel of arbitrary content, anchored to its trigger.
 *
 * The wrap, the anchored panel and its title are the base `.td-popover*` in
 * `tonaldepth-core` ([[L16]]); this component wires the behaviour a static panel
 * cannot carry — it toggles on click, closes on Escape and on a click outside,
 * moves focus into the panel on open and returns it to the trigger on Escape,
 * and carries `role="dialog"` with a name.
 *
 * **Not `Tooltip`** — that appears on *hover* to explain a control, takes no
 * focus and holds no controls. A popover is opened deliberately and can hold
 * interactive content. **Not `DropdownMenu`**, which is a list of *commands* a
 * reader picks one of; a popover is free-form content. **Not `Dialog`**, which
 * is modal and seizes the whole page — a popover is a light, non-modal panel the
 * page stays live behind.
 */
export const TonalDepthPopover = forwardRef<HTMLDivElement, TonalDepthPopoverProps>(function TonalDepthPopover(
  { trigger, title, label, children, open, defaultOpen = false, onOpenChange, triggerClassName, className, ...props },
  forwardedRef,
) {
  const id = useId();
  const panelId = `${id}-panel`;
  const titleId = `${id}-title`;
  const root = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const controlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlled ? open : internalOpen;

  const setOpen = (next: boolean) => {
    if (!controlled) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const setRef = (node: HTMLDivElement | null) => {
    root.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  // Move focus into the panel when it opens, so a keyboard reader lands in the
  // content rather than being left on the trigger behind an open dialog.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

  // Close on a click anywhere outside the wrap. Focus is left where the click
  // landed — only Escape and the trigger return it to the button.
  useEffect(() => {
    if (!isOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isOpen]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <div
      {...props}
      ref={setRef}
      className={cx("td-popover-wrap", "td-registry-popover-wrap", className)}
      data-state={isOpen ? "open" : "closed"}
      onKeyDown={onKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        className={cx("td-registry-popover-trigger", triggerClassName)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setOpen(!isOpen)}
      >
        {trigger}
      </button>
      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        tabIndex={-1}
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : label}
        aria-hidden={!isOpen}
        className="td-popover td-registry-popover"
      >
        {title ? (
          <p id={titleId} className="td-popover-title">
            {title}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
});
