"use client";

import { forwardRef, useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { CaretDownIcon as ChevronDownIcon } from "@phosphor-icons/react";
import "./tonaldepth-dropdown-menu.css";

const LAMP_WEIGHT = "fill" as const;

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
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
