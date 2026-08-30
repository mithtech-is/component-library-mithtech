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
  /** 24-hour grid, or a 12-hour grid with a meridiem column. Default 24. */
  hourCycle?: 12 | 24;
}

const TonalDepthto12 = (hour: number) => hour % 12 || 12;

const TonalDepthfrom12 = (hour12: number, pm: boolean) => (hour12 % 12) + (pm ? 12 : 0);

/**
 * `HH:MM` in, a reader's time out.
 *
 * The stored value is 24-hour in both cycles. A component that changed its wire
 * format with its presentation would make every consumer parse the display back
 * to know what it holds, and two forms on one page could not agree.
 */
function TonalDepthformatTime(value: string | undefined, hourCycle: 12 | 24) {
  const [hh, mm] = (value ?? "").split(":");
  if (hh === undefined || hh === "" || mm === undefined) return hourCycle === 12 ? "--:-- --" : "--:--";
  const hour = Number(hh);
  if (hourCycle === 24) return `${TonalDepthpad(hour)}:${mm}`;
  return `${TonalDepthto12(hour)}:${mm} ${hour >= 12 ? "PM" : "AM"}`;
}

/**
 * Hours and minutes as two grids rather than one scrolling list.
 *
 * The list this replaces put every slot in a single 232px-tall column, so
 * reaching 14:45 meant scrolling past fifty-nine rows with no landmark to aim
 * at. A grid is what the calendar beside it already does, and it costs two
 * presses for any time on the clock.
 */
function TonalDepthTimeGrid({ value, onPick, minuteStep = 5, label = "Time", hourCycle = 24 }: TonalDepthTimeGridProps) {
  const [hh, mm] = (value ?? "").split(":");
  const hour = hh === undefined || hh === "" ? null : Number(hh);
  const minute = mm === undefined || mm === "" ? null : Number(mm);
  const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, index) => index * minuteStep);
  const twelve = hourCycle === 12;
  /* An unset picker reads as AM. The meridiem is a two-way switch and has no
     third position, so it shows the half that midnight falls in rather than
     leaving both rungs unlit and the column looking broken. */
  const pm = (hour ?? 0) >= 12;
  /* 12 leads, because a 12-hour clock starts its half there — a column running
     1..12 puts noon and midnight at the bottom, where nobody looks first. */
  const hours = twelve ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : Array.from({ length: 24 }, (_, h) => h);

  const set = (nextHour: number | null, nextMinute: number | null) => {
    onPick(`${TonalDepthpad(nextHour ?? 0)}:${TonalDepthpad(nextMinute ?? 0)}`);
  };

  return (
    <div className="td-timegrid" role="group" aria-label={label} data-cycle={hourCycle}>
      <div className="td-timegrid-head">
        <span className="td-timegrid-label">{label}</span>
        <span className="td-timegrid-value">{TonalDepthformatTime(value, hourCycle)}</span>
      </div>
      <div className="td-timegrid-cols">
        <div className="td-timegrid-col">
          <div className="td-timegrid-col-h">Hour</div>
          <div className="td-timegrid-grid" role="listbox" aria-label="Hour">
            {hours.map(h => (
              <button
                type="button"
                key={h}
                role="option"
                className="td-timegrid-opt"
                aria-selected={hour !== null && (twelve ? TonalDepthto12(hour) === h : hour === h)}
                onClick={() => set(twelve ? TonalDepthfrom12(h, pm) : h, minute)}
              >
                {twelve ? h : TonalDepthpad(h)}
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
        {/* A third column rather than a toggle beside the field: AM and PM are
            the same kind of choice as an hour, so they take the same rungs and
            the reader crosses one row of controls instead of two kinds. */}
        {twelve ? (
          <div className="td-timegrid-col">
            <div className="td-timegrid-col-h">AM/PM</div>
            <div className="td-timegrid-grid td-registry-timegrid-meridiem" role="listbox" aria-label="Before or after noon">
              {([["AM", false], ["PM", true]] as const).map(([text, isPm]) => (
                <button
                  type="button"
                  key={text}
                  role="option"
                  className="td-timegrid-opt"
                  aria-selected={pm === isPm}
                  onClick={() => set(TonalDepthfrom12(TonalDepthto12(hour ?? 0), isPm), minute)}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        ) : null}
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
  /** `HH:MM`, 24-hour — in both cycles. `hourCycle` changes the display only. */
  value?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  minuteStep?: number;
  /**
   * `24` shows a 24-hour grid; `12` shows a 12-hour grid with an AM/PM column
   * and renders the field as `9:30 AM`. Default 24.
   *
   * The value is unaffected — it is `HH:MM` either way, so a form does not have
   * to know which cycle the field was showing.
   */
  hourCycle?: 12 | 24;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}

/** A time of day, on the hour/minute grid. */
export const TonalDepthTimePicker = forwardRef<HTMLButtonElement, TonalDepthTimePickerProps>(function TonalDepthTimePicker(
  { value, onValueChange, label = "Time", minuteStep = 5, hourCycle = 24, disabled, invalid, className }, ref,
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
        display={TonalDepthformatTime(value, hourCycle)}
        open={open}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onClick={() => setOpen(v => !v)}
      />
      <div className="td-drpop" data-open={open || undefined} role="dialog" aria-label={label}>
        {open ? <TonalDepthTimeGrid value={value} minuteStep={minuteStep} hourCycle={hourCycle} onPick={next => onValueChange?.(next)} label={label} /> : null}
      </div>
    </div>
  );
});
