import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import { AcceptIcon, CancelIcon, LAMP_WEIGHT } from "./icons";
import "./comparison-table.css";

export interface ComparisonColumn {
  key: string;
  label: ReactNode;
  note?: ReactNode;
  /** Marks the column the page is arguing for. Rendered as the selected step
   * of the depth ladder — a pressed well with papaya ink, never a fill. */
  highlight?: boolean;
}

export interface ComparisonRow {
  label: ReactNode;
  note?: ReactNode;
  /** Keyed by `ComparisonColumn.key`. `true` / `false` render as yes / no marks. */
  cells: Record<string, ReactNode | boolean>;
}

export interface ComparisonTableProps extends HTMLAttributes<HTMLDivElement> {
  caption: ReactNode;
  captionHidden?: boolean;
  criteriaLabel?: ReactNode;
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  yesLabel?: string;
  noLabel?: string;
}

function Mark({ value, yesLabel, noLabel }: { value: boolean; yesLabel: string; noLabel: string }) {
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

export const ComparisonTable = forwardRef<HTMLDivElement, ComparisonTableProps>(function ComparisonTable(
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
                        ? <Mark value={value} yesLabel={yesLabel} noLabel={noLabel} />
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
