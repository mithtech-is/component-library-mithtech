import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./file-preview.css";

export interface FilePreviewProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** The file's name, including its extension. Truncates rather than wraps. */
  name: ReactNode;
  /**
   * The machine facts, already formatted — "142 KB · 4 pages · 17 Aug".
   *
   * The component does not format bytes or dates: a library that decides
   * whether 142000 is "142 KB" or "138.7 KiB", and in which locale, is deciding
   * something the caller knows better.
   */
  meta?: ReactNode;
  /** Buttons — open, download, share. `IconButton` is the one to reach for. */
  actions?: ReactNode;
  /**
   * A real thumbnail. Without one the component draws a page of ruled lines,
   * which says "a document" without pretending to show its first page.
   */
  thumbnail?: ReactNode;
  href?: string;
  renderLink?: (props: { className: string; href: string; children: ReactNode }) => ReactNode;
}

/**
 * A document offered for opening — the thing an attachment row is.
 *
 * The anatomy is `Frame`'s, turned on its side: the preview is the measured
 * object and sits in the well, and the name, the facts and the buttons are
 * chrome on the raised plate beside it. That is why a PDF preview reads as a
 * document rather than as a card with a picture in it.
 *
 * It renders no PDF. There is no viewer, no page navigation and no network —
 * pass a `thumbnail` you have rendered yourself, or let it draw the ruled page.
 */
export const FilePreview = forwardRef<HTMLElement, FilePreviewProps>(function FilePreview(
  { name, meta, actions, thumbnail, href, renderLink, className, ...props },
  ref,
) {
  const title = (
    <span className="td-react-filepreview-name">{name}</span>
  );
  return (
    <article {...props} ref={ref} className={cx("td-react-filepreview", className)}>
      <span className="td-react-filepreview-thumb" aria-hidden={thumbnail ? undefined : true}>
        {thumbnail ?? (
          <>
            <span className="td-react-filepreview-rule td-react-filepreview-rule--w90" />
            <span className="td-react-filepreview-rule td-react-filepreview-rule--w70" />
            <span className="td-react-filepreview-rule td-react-filepreview-rule--w50" />
          </>
        )}
      </span>
      <div className="td-react-filepreview-body">
        {href
          ? renderLink
            ? renderLink({ className: "td-react-filepreview-link", href, children: title })
            : <a className="td-react-filepreview-link" href={href}>{title}</a>
          : title}
        {meta !== undefined ? <p className="td-react-filepreview-meta">{meta}</p> : null}
        {actions ? <div className="td-react-filepreview-actions">{actions}</div> : null}
      </div>
    </article>
  );
});

export interface FilePreviewListProps extends HTMLAttributes<HTMLDivElement> {
  min?: number;
}

/** Documents in columns that wrap. */
export const FilePreviewList = forwardRef<HTMLDivElement, FilePreviewListProps>(function FilePreviewList(
  { min = 320, className, style, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={cx("td-react-filepreview-list", className)}
      style={{ ...style, ["--td-filepreview-min" as string]: `${min}px` }}
    />
  );
});
