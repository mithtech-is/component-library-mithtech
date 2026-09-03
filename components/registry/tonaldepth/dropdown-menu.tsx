"use client";

import { forwardRef, useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import "./tonaldepth-dropdown-menu.css";

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

export interface TonalDepthDropdownMenuItem { value: string; label: ReactNode; disabled?: boolean }

export interface TonalDepthDropdownMenuProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  items: TonalDepthDropdownMenuItem[];
  value?: string;
  onValueChange?: (value: string) => void;
}

export const TonalDepthDropdownMenu = forwardRef<HTMLDivElement, TonalDepthDropdownMenuProps>(function TonalDepthDropdownMenu(
  { label, items, value, onValueChange, className, ...props }, forwardedRef,
) {
  const id = useId();
  const root = useRef<HTMLDivElement | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const setRef = (node: HTMLDivElement | null) => { root.current = node; if (typeof forwardedRef === "function") forwardedRef(node); else if (forwardedRef) forwardedRef.current = node; };
  const enabled = items.filter(item => !item.disabled);
  const focusItem = (index: number) => document.getElementById(`${id}-item-${enabled[index].value}`)?.focus();
  const openMenu = () => setOpen(true);
  useEffect(() => {
    if (open && enabled.length) focusItem(0);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); trigger.current?.focus(); return; }
    const current = enabled.findIndex(item => `${id}-item-${item.value}` === document.activeElement?.id);
    let next = current;
    if (event.key === "ArrowDown") next = (current + 1) % enabled.length;
    else if (event.key === "ArrowUp") next = (current - 1 + enabled.length) % enabled.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = enabled.length - 1;
    else return;
    event.preventDefault(); focusItem(next);
  };
  return (
    <div {...props} ref={setRef} className={cx("td-dropdown", "td-registry-dropdown", className)} data-state={open ? "open" : "closed"} onKeyDown={onKeyDown}>
      <button ref={trigger} type="button" className="td-dropdown-trigger td-registry-dropdown-trigger" aria-haspopup="menu" aria-expanded={open} aria-controls={`${id}-menu`} onClick={() => open ? setOpen(false) : openMenu()}>
        <span className="td-dropdown-value td-registry-dropdown-value">{label}</span><ChevronDownIcon className="td-dropdown-chevron td-registry-dropdown-chevron" weight={LAMP_WEIGHT} aria-hidden="true" />
      </button>
      <div id={`${id}-menu`} role="menu" className="td-dropdown-menu td-registry-dropdown-menu" aria-hidden={!open}>
        {items.map(item => <button key={item.value} id={`${id}-item-${item.value}`} type="button" role="menuitemradio" aria-checked={value === item.value} disabled={item.disabled} className="td-dropdown-item td-registry-dropdown-item" onClick={() => { onValueChange?.(item.value); setOpen(false); trigger.current?.focus(); }}><span className="td-dropdown-check" aria-hidden="true">✓</span><span className="td-dropdown-item-text">{item.label}</span></button>)}
      </div>
    </div>
  );
});
