"use client";

import { forwardRef, useId, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "./utils";
import "./tabs.css";

export interface TabItem { value: string; label: ReactNode; content: ReactNode; disabled?: boolean }
export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: string;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { items, value, defaultValue, onValueChange, label = "Tabs", className, ...props }, ref,
) {
  const id = useId();
  const first = items.find(item => !item.disabled)?.value ?? "";
  const [internal, setInternal] = useState(defaultValue ?? first);
  const selected = value ?? internal;
  const select = (next: string) => { if (value === undefined) setInternal(next); onValueChange?.(next); };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const enabled = items.filter(item => !item.disabled);
    const index = enabled.findIndex(item => item.value === selected);
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % enabled.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + enabled.length) % enabled.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = enabled.length - 1;
    else return;
    event.preventDefault();
    select(enabled[next].value);
    document.getElementById(`${id}-tab-${enabled[next].value}`)?.focus();
  };
  const active = items.find(item => item.value === selected) ?? items[0];
  return (
    <div {...props} ref={ref} className={cx("td-tabs", className)}>
      <div role="tablist" aria-label={label} className="td-tablist" onKeyDown={onKeyDown}>
        {items.map(item => <button key={item.value} id={`${id}-tab-${item.value}`} type="button" role="tab" disabled={item.disabled} aria-selected={item.value === selected} aria-controls={`${id}-panel-${item.value}`} tabIndex={item.value === selected ? 0 : -1} className="td-tab td-react-tab" onClick={() => select(item.value)}>{item.label}</button>)}
      </div>
      {active ? <div id={`${id}-panel-${active.value}`} role="tabpanel" aria-labelledby={`${id}-tab-${active.value}`} tabIndex={0} className="td-tabpanel">{active.content}</div> : null}
    </div>
  );
});
