"use client";

import { forwardRef, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { CaretLeftIcon as ChevronLeftIcon, CaretRightIcon as ChevronRightIcon, CalendarBlankIcon as DateIcon } from "@phosphor-icons/react";
import "./tonaldepth-date-time-picker.css";

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

/* ── TonalDepthDateTimePicker ───────────────────────────────────────────────────── */

export interface TonalDepthDateTimePickerProps {
  /** `YYYY-MM-DD`. */
  date?: string;
  /** `HH:MM`. */
  time?: string;
  onDateTimeChange?: (date: string, time: string) => void;
  label?: string;
  minuteStep?: number;
  disabled?: boolean;
  className?: string;
}

/** A precise instant — the calendar and the time grid in one popover. */
export const TonalDepthDateTimePicker = forwardRef<HTMLButtonElement, TonalDepthDateTimePickerProps>(function TonalDepthDateTimePicker(
  { date, time, onDateTimeChange, label = "When", minuteStep = 5, disabled, className }, ref,
) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); triggerRef.current?.focus(); };
  useTonalDepthDismiss(open, close, rootRef);
  const titleId = useId();

  return (
    <div className={cx("td-drpick", "td-registry-datetime", className)} ref={rootRef} data-disabled={disabled || undefined}>
      <TonalDepthField
        ref={node => {
          triggerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        fieldLabel={label}
        display={<><DateIcon weight={LAMP_WEIGHT} aria-hidden="true" /> {TonalDepthformatIsoDate(date)}{time ? ` · ${time}` : ""}</>}
        open={open}
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
      />
      <div className="td-drpop" data-open={open || undefined} role="dialog" aria-labelledby={titleId}>
        {open ? (
          <>
            <span className="td-registry-vh" id={titleId}>{label}</span>
            <TonalDepthCalendar value={date} onPick={iso => onDateTimeChange?.(iso, time ?? "09:00")} label="Date" />
            <TonalDepthTimeGrid value={time} minuteStep={minuteStep} onPick={next => onDateTimeChange?.(date ?? "", next)} label="Time" />
          </>
        ) : null}
      </div>
    </div>
  );
});
