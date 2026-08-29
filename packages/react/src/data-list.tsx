import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./data-list.css";

export interface DataListRow {
  /** The field name. Set in mono and upper-cased — it is a key, not prose. */
  label: ReactNode;
  value: ReactNode;
  /** The machine face at the end of the row — a duration, a count, a state. */
  meta?: ReactNode;
  /** Makes the whole row a link. */
  href?: string;
}

export interface DataListProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  rows: DataListRow[];
  /** Names the list for a screen reader. */
  label?: string;
  /**
   * Hand your router the anchor. Given the class and the href, return the
   * element. Only used by rows that carry an `href`.
   */
  renderLink?: (props: { className: string; href: string; children: ReactNode }) => ReactNode;
}

/**
 * Four to six fields about one thing.
 *
 * A `Table` answers "how do these records compare"; this answers "what is this
 * record". Below about six fields a table's header row is overhead — the field
 * name belongs beside its value, not above a column of one.
 *
 * Rendered as a real definition list, so a screen reader reads it as pairs.
 */
export const DataList = forwardRef<HTMLElement, DataListProps>(function DataList(
  { rows, label, renderLink, className, ...props },
  ref,
) {
  return (
    <dl {...props} ref={ref as never} aria-label={label} className={cx("td-data-list", "td-react-datalist", className)}>
      {rows.map((row, index) => {
        const body = (
          <>
            <dt className="td-data-list-label td-react-datalist-label">{row.label}</dt>
            <dd className="td-react-datalist-body">
              <span className="td-data-list-value td-react-datalist-value">{row.value}</span>
              {row.meta !== undefined ? <span className="td-data-list-meta td-react-datalist-meta">{row.meta}</span> : null}
            </dd>
          </>
        );
        if (!row.href) return <div className="td-data-list-row td-react-datalist-row" key={index}>{body}</div>;
        const linkClass = "td-react-datalist-link";
        return (
          <div className="td-data-list-row td-react-datalist-row td-react-datalist-row--link" key={index}>
            {renderLink
              ? renderLink({ className: linkClass, href: row.href, children: body })
              : <a className={linkClass} href={row.href}>{body}</a>}
          </div>
        );
      })}
    </dl>
  );
});
