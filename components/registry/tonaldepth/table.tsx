import { forwardRef, type HTMLAttributes, type TableHTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import "./tonaldepth-table.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export const TonalDepthTableContainer = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function TonalDepthTableContainer({ className, ...props }, ref) { return <div {...props} ref={ref} className={cx("td-table-wrap", className)} />; });

export const TonalDepthTable = forwardRef<HTMLTableElement, TableHTMLAttributes<HTMLTableElement>>(function TonalDepthTable({ className, ...props }, ref) { return <table {...props} ref={ref} className={cx("td-table", "td-registry-table", className)} />; });

export const TonalDepthTableHead = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(function TonalDepthTableHead(props, ref) { return <thead {...props} ref={ref} />; });

export const TonalDepthTableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(function TonalDepthTableBody(props, ref) { return <tbody {...props} ref={ref} />; });

export const TonalDepthTableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(function TonalDepthTableRow(props, ref) { return <tr {...props} ref={ref} />; });

export const TonalDepthTableHeader = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(function TonalDepthTableHeader({ scope = "col", ...props }, ref) { return <th {...props} ref={ref} scope={scope} />; });

export const TonalDepthTableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(function TonalDepthTableCell(props, ref) { return <td {...props} ref={ref} />; });
