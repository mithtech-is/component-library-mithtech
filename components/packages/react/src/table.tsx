import { forwardRef, type HTMLAttributes, type TableHTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cx } from "./utils";
import "./table.css";

export const TableContainer = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function TableContainer({ className, ...props }, ref) { return <div {...props} ref={ref} className={cx("td-table-wrap", className)} />; });
export const Table = forwardRef<HTMLTableElement, TableHTMLAttributes<HTMLTableElement>>(function Table({ className, ...props }, ref) { return <table {...props} ref={ref} className={cx("td-table", "td-react-table", className)} />; });
export const TableHead = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(function TableHead(props, ref) { return <thead {...props} ref={ref} />; });
export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(function TableBody(props, ref) { return <tbody {...props} ref={ref} />; });
export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(function TableRow(props, ref) { return <tr {...props} ref={ref} />; });
export const TableHeader = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(function TableHeader({ scope = "col", ...props }, ref) { return <th {...props} ref={ref} scope={scope} />; });
export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(function TableCell(props, ref) { return <td {...props} ref={ref} />; });
