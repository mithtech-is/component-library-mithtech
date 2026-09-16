import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-gauge.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export type TonalDepthGaugeLoad = "low" | "med" | "high";

export interface TonalDepthGaugeProps extends HTMLAttributes<HTMLDivElement> {
  /** The reading, 0–100. */
  value: number;
  /** The label under the meter — "CPU", "RAM", "Disk". */
  label: ReactNode;
  /**
   * The load band, which colours every bar — `low` green, `med` accent, `high`
   * brand. Derived from `value` (≤33 low, ≤66 med, else high) unless you set it,
   * so a gauge that means something other than "more is worse" can say so.
   */
  load?: TonalDepthGaugeLoad;
  /** How many bars the strip holds. Default 12. */
  bars?: number;
  /** Format the numeric readout. Default `"{value}%"`. */
  format?: (value: number) => ReactNode;
}

const TonalDepthbandFor = (value: number): TonalDepthGaugeLoad => (value <= 33 ? "low" : value <= 66 ? "med" : "high");

/**
 * A compact load meter — a strip of bars that rises with a value, read against a
 * label and a percentage. CPU, RAM, disk; utilisation, capacity, headroom.
 *
 * The strip, the bars and the band colours (low green, med accent, high brand)
 * are the base `.td-gauge*` in `tonaldepth-core` ([[L16]]); the band is a
 * category, not a wash — every bar is the one colour and the reading is carried
 * by how tall they stand and by the number.
 *
 * **How the bars are drawn** — the original design's bar heights were generated
 * by a script that is not in this repository, so this is a faithful
 * reconstruction, not a copy: the bars follow a fixed left-to-right ramp scaled
 * by `value`, so the meter fills as the reading climbs. If the design intent
 * turns out to differ, this is the one thing to revisit.
 *
 * **Not `Progress` / `Ring`** — those are a single determinate 0–100% figure as a
 * bar or a circle. A gauge is the same kind of figure drawn as a *level meter*,
 * where the band colour carries whether the level is comfortable or not.
 */
export const TonalDepthGauge = forwardRef<HTMLDivElement, TonalDepthGaugeProps>(function TonalDepthGauge(
  { value, label, load, bars = 12, format, className, ...props },
  ref,
) {
  const clamped = Math.max(0, Math.min(100, value));
  const band = load ?? TonalDepthbandFor(clamped);
  const labelText = typeof label === "string" ? label : (props["aria-label"] as string | undefined);

  return (
    <div
      {...props}
      ref={ref}
      role="meter"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={labelText}
      data-load={band}
      className={cx("td-gauge", "td-registry-gauge", className)}
    >
      <div className="td-gauge-bars" aria-hidden="true">
        {Array.from({ length: bars }, (_, index) => {
          // A fixed rising ramp (35% → 100% of the track), scaled by the reading
          // so the strip fills as the value climbs. A 4% floor keeps a bar from
          // vanishing entirely at a near-zero reading.
          const ramp = bars > 1 ? 35 + (index / (bars - 1)) * 65 : 100;
          const height = Math.max(4, (ramp * clamped) / 100);
          return <span key={index} className="td-gauge-bar" style={{ ["--td-gauge-bar-h"]: `${height}%`, height: `${height}%` } as CSSProperties} />;
        })}
      </div>
      <div className="td-gauge-value">{format ? format(clamped) : `${Math.round(clamped)}%`}</div>
      <div className="td-gauge-label">{label}</div>
    </div>
  );
});
