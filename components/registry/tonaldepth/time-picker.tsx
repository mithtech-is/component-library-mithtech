"use client";

import { forwardRef, useEffect, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import "./tonaldepth-time-picker.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/* ── Date arithmetic, in local civil time ─────────────────────────────── */

const TonalDepthpad = (n: number) => String(n).padStart(2, "0");

/* ── Time grid ────────────────────────────────────────────────────────── */

interface TonalDepthTimeGridProps {
  /** `HH:MM`. */
  value?: string;
  onPick: (value: string) => void;
  /** Minutes between offered slots. Default 5 — twelve cells, one grid. */
  minuteStep?: number;
  label?: string;
}

/**
 * Hours and minutes as two grids rather than one scrolling list.
 *
 * The list this replaces put every slot in a single 232px-tall column, so
 * reaching 14:45 meant scrolling past fifty-nine rows with no landmark to aim
 * at. A grid is what the calendar beside it already does, and it costs two
 * presses for any time on the clock.
 */
function TonalDepthTimeGrid({ value, onPick, minuteStep = 5, label = "Time" }: TonalDepthTimeGridProps) {
  const [hh, mm] = (value ?? "").split(":");
  const hour = hh === undefined || hh === "" ? null : Number(hh);
  const minute = mm === undefined || mm === "" ? null : Number(mm);
  const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, index) => index * minuteStep);

  const set = (nextHour: number | null, nextMinute: number | null) => {
    onPick(`${TonalDepthpad(nextHour ?? 0)}:${TonalDepthpad(nextMinute ?? 0)}`);
  };

  return (
    <div className="td-timegrid" role="group" aria-label={label}>
      <div className="td-timegrid-head">
        <span className="td-timegrid-label">{label}</span>
        <span className="td-timegrid-value">{hour === null && minute === null ? "--:--" : `${TonalDepthpad(hour ?? 0)}:${TonalDepthpad(minute ?? 0)}`}</span>
      </div>
      <div className="td-timegrid-cols">
        <div className="td-timegrid-col">
          <div className="td-timegrid-col-h">Hour</div>
          <div className="td-timegrid-grid" role="listbox" aria-label="Hour">
            {Array.from({ length: 24 }, (_, h) => (
              <button
                type="button"
                key={h}
                role="option"
                className="td-timegrid-opt"
                aria-selected={hour === h}
                onClick={() => set(h, minute)}
              >
                {TonalDepthpad(h)}
              </button>
            ))}
          </div>
        </div>
        <div className="td-timegrid-col">
          <div className="td-timegrid-col-h">Min</div>
          <div className="td-timegrid-grid" role="listbox" aria-label="Minute">
            {minutes.map(m => (
              <button
                type="button"
                key={m}
                role="option"
                className="td-timegrid-opt"
                aria-selected={minute === m}
                onClick={() => set(hour, m)}
              >
                {TonalDepthpad(m)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── The carved trigger every field opens from ────────────────────────── */

interface TonalDepthFieldProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fieldLabel: string;
  display: ReactNode;
  open: boolean;
}

const TonalDepthField = forwardRef<HTMLButtonElement, TonalDepthFieldProps>(function TonalDepthField(
  { fieldLabel, display, open, className, ...props }, ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      type="button"
      className={cx("td-drfield", className)}
      aria-expanded={open}
      aria-haspopup="dialog"
    >
      <span className="td-drfield-label">{fieldLabel}</span>
      <span className="td-drfield-value">{display}</span>
    </button>
  );
});

/** Dismiss on outside press and on Escape, and hand focus back to the trigger. */
function useTonalDepthDismiss(open: boolean, close: () => void, rootRef: { current: HTMLElement | null }) {
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open, close, rootRef]);
}

/* ── TonalDepthTimePicker ───────────────────────────────────────────────────────── */

export interface TonalDepthTimePickerProps {
  /** `HH:MM`, 24-hour. */
  value?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  minuteStep?: number;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}

/** A time of day, on the hour/minute grid. */
export const TonalDepthTimePicker = forwardRef<HTMLButtonElement, TonalDepthTimePickerProps>(function TonalDepthTimePicker(
  { value, onValueChange, label = "Time", minuteStep = 5, disabled, invalid, className }, ref,
) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); triggerRef.current?.focus(); };
  useTonalDepthDismiss(open, close, rootRef);

  return (
    <div className={cx("td-drpick", "td-registry-timepick", className)} ref={rootRef} data-disabled={disabled || undefined}>
      <TonalDepthField
        ref={node => {
          triggerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        fieldLabel={label}
        display={value || "--:--"}
        open={open}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onClick={() => setOpen(v => !v)}
      />
      <div className="td-drpop" data-open={open || undefined} role="dialog" aria-label={label}>
        {open ? <TonalDepthTimeGrid value={value} minuteStep={minuteStep} onPick={next => onValueChange?.(next)} label={label} /> : null}
      </div>
    </div>
  );
});
