import { forwardRef, useId, type HTMLAttributes, type ReactNode, type SVGProps } from "react";
import "./tonaldepth-comparison-table.css";

const LAMP_WEIGHT = "fill" as const;

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * TonalDepth's own glyphs, copied in because a registry item is one
 * self-contained file. Filled and colour-neutral by construction, so the
 * component's lamp ladder moves them through `currentColor`.
 */
interface TdIconProps extends SVGProps<SVGSVGElement> {
  /** Edge length. `1em` so the glyph scales with the type it sits beside. */
  size?: number | string;
  /** The fill. `currentColor` so the lamp ramp can move it. */
  color?: string;
  /**
   * Accepted so a TD glyph is a drop-in at a call site passing
   * `weight={LAMP_WEIGHT}`. TD glyphs are filled by construction, so there is
   * nothing to switch — the prop is swallowed rather than forwarded, because
   * `weight` is not an SVG attribute and React would put it on the DOM.
   */
  weight?: string;
  /** Flip horizontally, matching Phosphor's prop of the same name. */
  mirrored?: boolean;
}

/** `fillRule` comes from `SVGProps`; pass `evenodd` where the artwork knocks a
 *  hole out of its own outline. */
interface TdGlyphProps extends TdIconProps {
  viewBox: string;
  d: string;
}

function TdGlyph({ viewBox, d, fillRule, size = "1em", color = "currentColor", weight, mirrored, ...props }: TdGlyphProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      fill={color}
      transform={mirrored ? "scale(-1, 1)" : undefined}
      {...props}
    >
      <path d={d} fillRule={fillRule} />
    </svg>
  );
}

const CHECK_FAT = "M243.31,90.91l-128.4,128.4a16,16,0,0,1-22.62,0l-71.62-72a16,16,0,0,1,0-22.61l20-20a16,16,0,0,1,22.58,0L104,144.22l96.76-95.57a16,16,0,0,1,22.59,0l19.95,19.54A16,16,0,0,1,243.31,90.91Z";

const CANCEL = "M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12ZM16.1716 14.7574C16.6951 13.967 17 13.0191 17 12C17 9.23858 14.7614 7 12 7C10.9809 7 10.033 7.30488 9.24261 7.8284L16.1716 14.7574ZM7.8284 9.24261L14.7574 16.1716C13.967 16.6951 13.0191 17 12 17C9.23858 17 7 14.7614 7 12C7 10.9809 7.30488 10.033 7.8284 9.24261ZM12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5Z";

/** The accept mark. A bare fat tick — Phosphor's circled check read as a badge. */
function TdCheckFat(props: TdIconProps) {
  return <TdGlyph viewBox="0 0 256 256" d={CHECK_FAT} {...props} />;
}

/** The cancel mark: a solid ring with the bar carved out of the disc inside it. */
function TdCancel(props: TdIconProps) {
  return <TdGlyph viewBox="0 0 24 24" d={CANCEL} fillRule="evenodd" {...props} />;
}

const AcceptIcon = TdCheckFat;
const CancelIcon = TdCancel;

export interface TonalDepthComparisonColumn {
  key: string;
  label: ReactNode;
  note?: ReactNode;
  /** Marks the column the page is arguing for. Rendered as the selected step
   * of the depth ladder — a pressed well with papaya ink, never a fill. */
  highlight?: boolean;
}

export interface TonalDepthComparisonRow {
  label: ReactNode;
  note?: ReactNode;
  /** Keyed by `TonalDepthComparisonColumn.key`. `true` / `false` render as yes / no marks. */
  cells: Record<string, ReactNode | boolean>;
}

export interface TonalDepthComparisonTableProps extends HTMLAttributes<HTMLDivElement> {
  caption: ReactNode;
  captionHidden?: boolean;
  criteriaLabel?: ReactNode;
  columns: TonalDepthComparisonColumn[];
  rows: TonalDepthComparisonRow[];
  yesLabel?: string;
  noLabel?: string;
}

function TonalDepthMark({ value, yesLabel, noLabel }: { value: boolean; yesLabel: string; noLabel: string }) {
  return (
    <span className={cx("td-mk-compare-mark", value ? "td-mk-compare-mark--yes" : "td-mk-compare-mark--no")}>
      {/* The glyph carries the answer, not just its colour — a green tick and a
          grey tick are the same mark to a colour-blind reader. */}
      {value
        ? <AcceptIcon weight={LAMP_WEIGHT} aria-hidden="true" />
        : <CancelIcon weight={LAMP_WEIGHT} aria-hidden="true" />}
      <span className="td-mk-visually-hidden">{value ? yesLabel : noLabel}</span>
    </span>
  );
}

export const TonalDepthComparisonTable = forwardRef<HTMLDivElement, TonalDepthComparisonTableProps>(function TonalDepthComparisonTable(
  { caption, captionHidden = false, criteriaLabel = "Criterion", columns, rows, yesLabel = "Yes", noLabel = "No", className, ...props },
  ref,
) {
  const captionId = useId();
  return (
    <div {...props} ref={ref} className={cx("td-mk-compare", className)}>
      <div className="td-mk-compare-scroll" tabIndex={0} role="region" aria-labelledby={captionId}>
        <table className="td-mk-compare-table">
          <caption id={captionId} className={cx("td-mk-compare-caption", captionHidden && "td-mk-visually-hidden")}>{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="td-mk-compare-criterion">{criteriaLabel}</th>
              {columns.map(column => (
                <th
                  key={column.key}
                  scope="col"
                  className={cx("td-mk-compare-col", column.highlight && "td-mk-compare-col--selected")}
                  aria-current={column.highlight ? "true" : undefined}
                >
                  <span className="td-mk-compare-col-label">{column.label}</span>
                  {column.note ? <span className="td-mk-compare-col-note">{column.note}</span> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <th scope="row" className="td-mk-compare-criterion">
                  <span className="td-mk-compare-row-label">{row.label}</span>
                  {row.note ? <span className="td-mk-compare-row-note">{row.note}</span> : null}
                </th>
                {columns.map(column => {
                  const value = row.cells[column.key];
                  return (
                    <td key={column.key} className={cx("td-mk-compare-cell", column.highlight && "td-mk-compare-cell--selected")}>
                      {typeof value === "boolean"
                        ? <TonalDepthMark value={value} yesLabel={yesLabel} noLabel={noLabel} />
                        : value ?? <span className="td-mk-compare-empty" aria-hidden="true">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
