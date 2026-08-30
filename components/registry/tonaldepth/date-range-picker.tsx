"use client";

import { forwardRef, useEffect, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { CaretLeftIcon as ChevronLeftIcon, CaretRightIcon as ChevronRightIcon } from "@phosphor-icons/react";
import "./tonaldepth-date-range-picker.css";

const LAMP_WEIGHT = "fill" as const;

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/* ── Date arithmetic, in local civil time ─────────────────────────────── */

const TonalDepthpad = (n: number) => String(n).padStart(2, "0");

const TonalDepthtoIso = (y: number, m: number, d: number) => `${y}-${TonalDepthpad(m + 1)}-${TonalDepthpad(d)}`;

function TonalDepthparseIso(value: string | undefined): { y: number; m: number; d: number }

const TonalDepthdaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

const TonalDepthfirstWeekday = (y: number, m: number) => new Date(y, m, 1).getDay();

const TonalDepthMONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const TonalDepthWEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/** `2026-08-30` → `30 Aug 2026`. The reader's form, not the machine's. */
export function TonalDepthformatIsoDate(value: string | undefined, fallback = "Select"): string {
  const parts = TonalDepthparseIso(value);
  if (!parts) return fallback;
  return `${parts.d} ${TonalDepthMONTHS[parts.m]!.slice(0, 3)} ${parts.y}`;
}

/* ── TonalDepthCalendar ─────────────────────────────────────────────────────────── */

interface TonalDepthCalendarProps {
  /** Selected day, or the range ends when `rangeEnd` is given too. */
  value?: string;
  rangeEnd?: string;
  onPick: (iso: string) => void;
  min?: string;
  max?: string;
  label?: string;
}

/**
 * The month grid. Arrow keys walk days, PageUp/PageDown walk months, so a
 * reader who never touches the mouse still moves in the units they think in.
 */
function TonalDepthCalendar({ value, rangeEnd, onPick, min, max, label = "TonalDepthCalendar" }: TonalDepthCalendarProps) {
  const today = new Date();
  const selected = TonalDepthparseIso(value);
  const [view, setView] = useState(() => selected ?? { y: today.getFullYear(), m: today.getMonth(), d: today.getDate() });
  const [focusDay, setFocusDay] = useState(() => selected?.d ?? today.getDate());
  const gridRef = useRef<HTMLDivElement>(null);

  const total = TonalDepthdaysInMonth(view.y, view.m);
  const lead = TonalDepthfirstWeekday(view.y, view.m);
  const todayIso = TonalDepthtoIso(today.getFullYear(), today.getMonth(), today.getDate());
  const endParts = TonalDepthparseIso(rangeEnd);

  const shiftMonth = (by: number) => {
    setView(v => {
      const next = new Date(v.y, v.m + by, 1);
      return { y: next.getFullYear(), m: next.getMonth(), d: 1 };
    });
  };

  const outOfBounds = (iso: string) => (min !== undefined && iso < min) || (max !== undefined && iso > max);

  const handleKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1
      : event.key === "ArrowDown" ? 7 : event.key === "ArrowUp" ? -7 : 0;
    if (step) {
      event.preventDefault();
      const next = focusDay + step;
      if (next < 1) { shiftMonth(-1); setFocusDay(TonalDepthdaysInMonth(view.y, view.m - 1) + next); }
      else if (next > total) { shiftMonth(1); setFocusDay(next - total); }
      else setFocusDay(next);
      return;
    }
    if (event.key === "PageUp") { event.preventDefault(); shiftMonth(-1); return; }
    if (event.key === "PageDown") { event.preventDefault(); shiftMonth(1); return; }
    if (event.key === "Home") { event.preventDefault(); setFocusDay(1); return; }
    if (event.key === "End") { event.preventDefault(); setFocusDay(total); return; }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const iso = TonalDepthtoIso(view.y, view.m, focusDay);
      if (!outOfBounds(iso)) onPick(iso);
    }
  };

  useEffect(() => {
    gridRef.current?.querySelector<HTMLElement>(`[data-day="${focusDay}"]`)?.focus();
  }, [focusDay, view.m, view.y]);

  return (
    <div className="td-cal" role="group" aria-label={label}>
      <div className="td-cal-head">
        <button type="button" className="td-cal-nav" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
          <ChevronLeftIcon weight={LAMP_WEIGHT} aria-hidden="true" />
        </button>
        <span aria-live="polite">{TonalDepthMONTHS[view.m]} {view.y}</span>
        <button type="button" className="td-cal-nav" aria-label="Next month" onClick={() => shiftMonth(1)}>
          <ChevronRightIcon weight={LAMP_WEIGHT} aria-hidden="true" />
        </button>
      </div>
      <div className="td-cal-grid" role="grid" ref={gridRef} onKeyDown={handleKey}>
        {TonalDepthWEEKDAYS.map((day, index) => (
          <div className="td-cal-day-h" key={`${day}-${index}`} role="columnheader" aria-label={day}>{day}</div>
        ))}
        {Array.from({ length: lead }, (_, index) => <div key={`lead-${index}`} className="td-registry-cal-blank" aria-hidden="true" />)}
        {Array.from({ length: total }, (_, index) => {
          const day = index + 1;
          const iso = TonalDepthtoIso(view.y, view.m, day);
          const isSelected = value === iso;
          const isEnd = rangeEnd === iso;
          const inRange = !!(value && endParts && iso > value && iso < rangeEnd!);
          const disabled = outOfBounds(iso);
          const state = [
            iso === todayIso && "today",
            (isSelected || isEnd) && "selected",
            inRange && "inrange",
          ].filter(Boolean).join(" ");
          return (
            <button
              type="button"
              key={iso}
              data-day={day}
              className="td-cal-day"
              role="gridcell"
              data-state={state || undefined}
              aria-selected={isSelected || isEnd}
              aria-label={`${day} ${TonalDepthMONTHS[view.m]} ${view.y}`}
              disabled={disabled}
              tabIndex={day === focusDay ? 0 : -1}
              onClick={() => onPick(iso)}
            >
              {day}
            </button>
          );
        })}
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

/* ── TonalDepthDateRangePicker ──────────────────────────────────────────────────── */

export interface TonalDepthDateRangePreset {
  label: string;
  /** Returns `[startIso, endIso]`. */
  range: () => [string, string];
}

export interface TonalDepthDateRangePickerProps {
  start?: string;
  end?: string;
  onRangeChange?: (start: string, end: string) => void;
  startLabel?: string;
  endLabel?: string;
  /** Quick spans — "7D", "30D", "QTD". The reader's real question is usually one of these. */
  presets?: TonalDepthDateRangePreset[];
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
}

/** Two days and everything between them. One calendar fills both ends in turn. */
export const TonalDepthDateRangePicker = forwardRef<HTMLDivElement, TonalDepthDateRangePickerProps>(function TonalDepthDateRangePicker(
  { start, end, onRangeChange, startLabel = "From", endLabel = "To", presets, min, max, disabled, className }, ref,
) {
  const [open, setOpen] = useState<null | "start" | "end">(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(null);
  useTonalDepthDismiss(open !== null, close, rootRef);

  const pick = (iso: string) => {
    if (open === "start") {
      onRangeChange?.(iso, end && end >= iso ? end : iso);
      setOpen("end");
    } else {
      onRangeChange?.(start && start <= iso ? start : iso, iso);
      close();
    }
  };

  return (
    <div
      className={cx("td-drpick", "td-registry-daterange", className)}
      ref={node => {
        rootRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      data-disabled={disabled || undefined}
    >
      <TonalDepthField fieldLabel={startLabel} display={TonalDepthformatIsoDate(start)} open={open === "start"} disabled={disabled} onClick={() => setOpen(v => (v === "start" ? null : "start"))} />
      <span className="td-drsep" aria-hidden="true">–</span>
      <TonalDepthField fieldLabel={endLabel} display={TonalDepthformatIsoDate(end)} open={open === "end"} disabled={disabled} onClick={() => setOpen(v => (v === "end" ? null : "end"))} />
      <div className="td-drpop" data-open={open !== null || undefined} role="dialog" aria-label="Date range">
        {open !== null ? (
          <>
            <TonalDepthCalendar value={start} rangeEnd={end} onPick={pick} min={min} max={max} label="Date range" />
            {presets?.length ? (
              <div className="td-registry-daterange-presets">
                {presets.map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    className="td-daterange-quick"
                    onClick={() => { const [s, e] = preset.range(); onRangeChange?.(s, e); close(); }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
});
