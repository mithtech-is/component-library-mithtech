"use client";

import { forwardRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import { CloseIcon, LAMP_WEIGHT } from "./icons";

export interface FilterOption {
  value: string;
  label: ReactNode;
  count?: number;
  color?: "brand" | "accent";
  disabled?: boolean;
}
export interface FilterBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  label?: string;
  options: FilterOption[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  clearLabel?: string;
}

export const FilterBar = forwardRef<HTMLDivElement, FilterBarProps>(function FilterBar(
  { label = "Filters", options, value, defaultValue = [], onValueChange, clearLabel = "Clear filters", className, ...props }, ref,
) {
  const [internal, setInternal] = useState(defaultValue);
  const selected = value ?? internal;
  const update = (next: string[]) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };
  const toggle = (option: string) => update(selected.includes(option) ? selected.filter(item => item !== option) : [...selected, option]);
  return (
    <div {...props} ref={ref} role="group" aria-label={label} className={cx("td-filters", className)}>
      {options.map(option => (
        <button key={option.value} type="button" className="td-filter-chip" aria-pressed={selected.includes(option.value)} data-color={option.color} disabled={option.disabled} onClick={() => toggle(option.value)}>
          {option.label}{option.count !== undefined ? <span className="td-filter-chip-count">{option.count}</span> : null}
        </button>
      ))}
      {selected.length ? <button type="button" className="td-filters-clear" onClick={() => update([])}>{clearLabel}<span className="td-filters-clear-x" aria-hidden="true"><CloseIcon weight={LAMP_WEIGHT} /></span></button> : null}
    </div>
  );
});
