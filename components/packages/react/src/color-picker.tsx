"use client";

/**
 * A colour, picked from a set somebody curated.
 *
 * A swatch grid rather than a spectrum, deliberately: a design system that
 * hands the reader an eyedropper has stopped being a design system. The grid
 * is the palette; `allowCustom` opens the native picker for the cases where a
 * brand colour genuinely has to be typed in.
 */

import {
  forwardRef, useEffect, useRef, useState,
  type KeyboardEvent,
} from "react";
import { cx } from "./utils";
import "./color-picker.css";

export interface ColorSwatch {
  value: string;
  label: string;
}

export interface ColorPickerProps {
  /** A hex string, `#RRGGBB`. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** The palette. Defaults to the design system's own eight. */
  swatches?: ColorSwatch[];
  /** Offer the platform colour picker as well as the grid. */
  allowCustom?: boolean;
  label?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  name?: string;
}

const DEFAULT_SWATCHES: ColorSwatch[] = [
  { value: "#FF5E29", label: "Papaya" },
  { value: "#0675B0", label: "Azure" },
  { value: "#59D38C", label: "Green" },
  { value: "#EC360E", label: "Error" },
  { value: "#F5A524", label: "Amber" },
  { value: "#8B5CF6", label: "Violet" },
  { value: "#1F1C17", label: "Ink" },
  { value: "#9A9388", label: "Ink 3" },
];

/**
 * Paint a colour onto an element through a CSS custom property.
 *
 * A ref rather than `style={...}`: the JSX style prop is what put a saturated
 * fill through a server boundary and took fifty-five pages to a 500 while the
 * types stayed green. Setting the property imperatively keeps the value in the
 * DOM where it belongs and out of the serialised element.
 */
const paint = (property: string, color: string) => (node: HTMLElement | null) => {
  node?.style.setProperty(property, color);
};

export const ColorPicker = forwardRef<HTMLButtonElement, ColorPickerProps>(function ColorPicker(
  {
    value, defaultValue, onValueChange, swatches = DEFAULT_SWATCHES, allowCustom = false,
    label = "Colour", disabled, invalid, className, name,
  },
  ref,
) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? swatches[0]!.value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const current = value ?? uncontrolled;

  const set = (next: string) => {
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  const close = () => { setOpen(false); triggerRef.current?.focus(); };

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => { setActive(Math.max(0, swatches.findIndex(s => s.value === current))); }, [current, swatches]);

  const handleGridKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") { event.preventDefault(); close(); return; }
    const columns = 6;
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1
      : event.key === "ArrowDown" ? columns : event.key === "ArrowUp" ? -columns : 0;
    if (step) {
      event.preventDefault();
      setActive(i => Math.min(swatches.length - 1, Math.max(0, i + step)));
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const swatch = swatches[active];
      if (swatch) { set(swatch.value); close(); }
    }
  };

  const currentLabel = swatches.find(s => s.value.toLowerCase() === current.toLowerCase())?.label ?? current;

  return (
    <div
      className={cx("td-colorpop", "td-react-colorpop", className)}
      ref={rootRef}
      data-state={open ? "open" : undefined}
      data-disabled={disabled || undefined}
    >
      <button
        ref={node => {
          triggerRef.current = node;
          paint("--swatch", current)(node);
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        type="button"
        className="td-colorpop-swatch"
        aria-label={`${label}: ${currentLabel}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
      />
      {name ? <input type="hidden" name={name} value={current} /> : null}

      <div className="td-colorpop-pop" role="dialog" aria-label={label}>
        {open ? (
          <>
            <div className="td-colorpop-grid" role="listbox" aria-label={label} onKeyDown={handleGridKey}>
              {swatches.map((swatch, index) => (
                <button
                  key={swatch.value}
                  ref={paint("background-color", swatch.value)}
                  type="button"
                  role="option"
                  className="td-colorpop-cell"
                  aria-selected={swatch.value.toLowerCase() === current.toLowerCase()}
                  aria-label={swatch.label}
                  tabIndex={index === active ? 0 : -1}
                  onClick={() => { set(swatch.value); close(); }}
                />
              ))}
            </div>
            <span className="td-colorpop-hex">{current.toUpperCase()}</span>
            {allowCustom ? (
              <label className="td-react-colorpop-custom">
                <span>Custom</span>
                <input type="color" value={current} onChange={event => set(event.target.value)} />
              </label>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
});
