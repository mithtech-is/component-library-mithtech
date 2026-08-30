"use client";

/**
 * The four date and time fields, and the one calendar they share.
 *
 * They are one file because they are one decision made four ways: how much of
 * an instant the reader has to give you. A day (`DatePicker`), a time of day
 * (`TimePicker`), a span of days (`DateRangePicker`), or a precise instant
 * (`DateTimePicker`). Splitting them across four files would hide that the
 * calendar, the popover and the carved trigger are the same three parts each
 * time, and would let the four drift apart a state at a time.
 *
 * Values are ISO strings — `YYYY-MM-DD` and `HH:MM` — not `Date`. A `Date` is
 * an instant in a timezone, and none of these fields is asking for one: a
 * birthday is not 00:00 UTC, and a range of days does not change because the
 * reader flew somewhere.
 */

import {
  forwardRef, useEffect, useId, useRef, useState,
  type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode,
} from "react";
import { cx } from "./utils";
import { ChevronLeftIcon, ChevronRightIcon, DateIcon, LAMP_WEIGHT } from "./icons";
import "./date-picker.css";

/* ── Date arithmetic, in local civil time ─────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function parseIso(value: string | undefined): { y: number; m: number; d: number } | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) };
}

const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const firstWeekday = (y: number, m: number) => new Date(y, m, 1).getDay();

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/** `2026-08-30` → `30 Aug 2026`. The reader's form, not the machine's. */
export function formatIsoDate(value: string | undefined, fallback = "Select"): string {
  const parts = parseIso(value);
  if (!parts) return fallback;
  return `${parts.d} ${MONTHS[parts.m]!.slice(0, 3)} ${parts.y}`;
}

/* ── Calendar ─────────────────────────────────────────────────────────── */

interface CalendarProps {
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
function Calendar({ value, rangeEnd, onPick, min, max, label = "Calendar" }: CalendarProps) {
  const today = new Date();
  const selected = parseIso(value);
  const [view, setView] = useState(() => selected ?? { y: today.getFullYear(), m: today.getMonth(), d: today.getDate() });
  const [focusDay, setFocusDay] = useState(() => selected?.d ?? today.getDate());
  const gridRef = useRef<HTMLDivElement>(null);

  const total = daysInMonth(view.y, view.m);
  const lead = firstWeekday(view.y, view.m);
  const todayIso = toIso(today.getFullYear(), today.getMonth(), today.getDate());
  const endParts = parseIso(rangeEnd);

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
      if (next < 1) { shiftMonth(-1); setFocusDay(daysInMonth(view.y, view.m - 1) + next); }
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
      const iso = toIso(view.y, view.m, focusDay);
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
        <span aria-live="polite">{MONTHS[view.m]} {view.y}</span>
        <button type="button" className="td-cal-nav" aria-label="Next month" onClick={() => shiftMonth(1)}>
          <ChevronRightIcon weight={LAMP_WEIGHT} aria-hidden="true" />
        </button>
      </div>
      <div className="td-cal-grid" role="grid" ref={gridRef} onKeyDown={handleKey}>
        {WEEKDAYS.map((day, index) => (
          <div className="td-cal-day-h" key={`${day}-${index}`} role="columnheader" aria-label={day}>{day}</div>
        ))}
        {Array.from({ length: lead }, (_, index) => <div key={`lead-${index}`} className="td-react-cal-blank" aria-hidden="true" />)}
        {Array.from({ length: total }, (_, index) => {
          const day = index + 1;
          const iso = toIso(view.y, view.m, day);
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
              aria-label={`${day} ${MONTHS[view.m]} ${view.y}`}
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

interface TimeGridProps {
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
function TimeGrid({ value, onPick, minuteStep = 5, label = "Time" }: TimeGridProps) {
  const [hh, mm] = (value ?? "").split(":");
  const hour = hh === undefined || hh === "" ? null : Number(hh);
  const minute = mm === undefined || mm === "" ? null : Number(mm);
  const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, index) => index * minuteStep);

  const set = (nextHour: number | null, nextMinute: number | null) => {
    onPick(`${pad(nextHour ?? 0)}:${pad(nextMinute ?? 0)}`);
  };

  return (
    <div className="td-timegrid" role="group" aria-label={label}>
      <div className="td-timegrid-head">
        <span className="td-timegrid-label">{label}</span>
        <span className="td-timegrid-value">{hour === null && minute === null ? "--:--" : `${pad(hour ?? 0)}:${pad(minute ?? 0)}`}</span>
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
                {pad(h)}
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
                {pad(m)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── The carved trigger every field opens from ────────────────────────── */

interface FieldProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fieldLabel: string;
  display: ReactNode;
  open: boolean;
}

const Field = forwardRef<HTMLButtonElement, FieldProps>(function Field(
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
function useDismiss(open: boolean, close: () => void, rootRef: { current: HTMLElement | null }) {
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

/* ── DatePicker ───────────────────────────────────────────────────────── */

export interface DatePickerProps {
  /** `YYYY-MM-DD`. */
  value?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}

/** One day. The calendar in a popover, behind a carved field. */
export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(function DatePicker(
  { value, onValueChange, label = "Date", min, max, disabled, invalid, className }, ref,
) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); triggerRef.current?.focus(); };
  useDismiss(open, close, rootRef);

  return (
    <div className={cx("td-drpick", "td-react-datepick", className)} ref={rootRef} data-disabled={disabled || undefined}>
      <Field
        ref={node => {
          triggerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        fieldLabel={label}
        display={formatIsoDate(value)}
        open={open}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onClick={() => setOpen(v => !v)}
      />
      <div className="td-drpop" data-open={open || undefined} role="dialog" aria-label={label}>
        {open ? (
          <Calendar value={value} onPick={iso => { onValueChange?.(iso); close(); }} min={min} max={max} label={label} />
        ) : null}
      </div>
    </div>
  );
});

/* ── TimePicker ───────────────────────────────────────────────────────── */

export interface TimePickerProps {
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
export const TimePicker = forwardRef<HTMLButtonElement, TimePickerProps>(function TimePicker(
  { value, onValueChange, label = "Time", minuteStep = 5, disabled, invalid, className }, ref,
) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); triggerRef.current?.focus(); };
  useDismiss(open, close, rootRef);

  return (
    <div className={cx("td-drpick", "td-react-timepick", className)} ref={rootRef} data-disabled={disabled || undefined}>
      <Field
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
        {open ? <TimeGrid value={value} minuteStep={minuteStep} onPick={next => onValueChange?.(next)} label={label} /> : null}
      </div>
    </div>
  );
});

/* ── DateRangePicker ──────────────────────────────────────────────────── */

export interface DateRangePreset {
  label: string;
  /** Returns `[startIso, endIso]`. */
  range: () => [string, string];
}

export interface DateRangePickerProps {
  start?: string;
  end?: string;
  onRangeChange?: (start: string, end: string) => void;
  startLabel?: string;
  endLabel?: string;
  /** Quick spans — "7D", "30D", "QTD". The reader's real question is usually one of these. */
  presets?: DateRangePreset[];
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
}

/** Two days and everything between them. One calendar fills both ends in turn. */
export const DateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(function DateRangePicker(
  { start, end, onRangeChange, startLabel = "From", endLabel = "To", presets, min, max, disabled, className }, ref,
) {
  const [open, setOpen] = useState<null | "start" | "end">(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(null);
  useDismiss(open !== null, close, rootRef);

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
      className={cx("td-drpick", "td-react-daterange", className)}
      ref={node => {
        rootRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      data-disabled={disabled || undefined}
    >
      <Field fieldLabel={startLabel} display={formatIsoDate(start)} open={open === "start"} disabled={disabled} onClick={() => setOpen(v => (v === "start" ? null : "start"))} />
      <span className="td-drsep" aria-hidden="true">–</span>
      <Field fieldLabel={endLabel} display={formatIsoDate(end)} open={open === "end"} disabled={disabled} onClick={() => setOpen(v => (v === "end" ? null : "end"))} />
      <div className="td-drpop" data-open={open !== null || undefined} role="dialog" aria-label="Date range">
        {open !== null ? (
          <>
            <Calendar value={start} rangeEnd={end} onPick={pick} min={min} max={max} label="Date range" />
            {presets?.length ? (
              <div className="td-react-daterange-presets">
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

/* ── DateTimePicker ───────────────────────────────────────────────────── */

export interface DateTimePickerProps {
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
export const DateTimePicker = forwardRef<HTMLButtonElement, DateTimePickerProps>(function DateTimePicker(
  { date, time, onDateTimeChange, label = "When", minuteStep = 5, disabled, className }, ref,
) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); triggerRef.current?.focus(); };
  useDismiss(open, close, rootRef);
  const titleId = useId();

  return (
    <div className={cx("td-drpick", "td-react-datetime", className)} ref={rootRef} data-disabled={disabled || undefined}>
      <Field
        ref={node => {
          triggerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        fieldLabel={label}
        display={<><DateIcon weight={LAMP_WEIGHT} aria-hidden="true" /> {formatIsoDate(date)}{time ? ` · ${time}` : ""}</>}
        open={open}
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
      />
      <div className="td-drpop" data-open={open || undefined} role="dialog" aria-labelledby={titleId}>
        {open ? (
          <>
            <span className="td-react-vh" id={titleId}>{label}</span>
            <Calendar value={date} onPick={iso => onDateTimeChange?.(iso, time ?? "09:00")} label="Date" />
            <TimeGrid value={time} minuteStep={minuteStep} onPick={next => onDateTimeChange?.(date ?? "", next)} label="Time" />
          </>
        ) : null}
      </div>
    </div>
  );
});
