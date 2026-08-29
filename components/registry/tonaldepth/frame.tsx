import { forwardRef, useId, type ElementType, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-frame.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * How deep the well is cut.
 *
 * `well` is the default and the one to reach for: content sits *in* the
 * surface. `flush` cuts no well at all — for a frame that is only supplying a
 * caption and a rule. `deep` is for a single hero object on a page that has
 * nothing else competing with it.
 */
export type TonalDepthFrameDepth = "well" | "flush" | "deep";

/**
 * The element the frame renders as. `figure` is for a frame whose well holds
 * one self-contained object the surrounding prose refers to — a chart, a
 * specimen. Everything else wants the default.
 */
export type TonalDepthFrameElement = "section" | "figure" | "article" | "div";

export interface TonalDepthFrameProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** Small caps above the title. The category, not a sentence. */
  eyebrow?: ReactNode;
  title?: ReactNode;
  /** One line under the title. What the reader is looking at. */
  description?: ReactNode;
  /** Controls placed opposite the title — a range picker, a download. */
  actions?: ReactNode;
  /** A note under the well: the source, the as-of date, the caveat. */
  footnote?: ReactNode;
  depth?: TonalDepthFrameDepth;
  as?: TonalDepthFrameElement;
  /**
   * Let the well's content bleed to its edges. Charts usually want this — a
   * plot already carries its own margins and would otherwise sit in two.
   */
  flushContent?: boolean;
}

/**
 * A frame with a well: the housing anything measured lives inside.
 *
 * The design system houses charts, tables, code, maps and specimens in a
 * frame — a raised plate with a well cut into it. The plate carries the
 * identity (eyebrow, title, actions) and the well carries the object. That
 * separation is the point: the reader can tell at a glance what is *chrome*
 * and what is *data*, because chrome is raised and data is recessed.
 *
 * Depth is state here as everywhere else, so the well never uses a border or a
 * fill to mark its edge — it is carved, with a shade above and a highlight
 * below.
 *
 * Reach for it whenever something is *housed*: a chart, a data table, a
 * terminal transcript, a rendered specimen. Do not use it as a generic card —
 * `Card` is the raised surface for content that is being *offered*, and a
 * frame is for content that is being *shown*.
 */
export const TonalDepthFrame = forwardRef<HTMLElement, TonalDepthFrameProps>(function TonalDepthFrame(
  { eyebrow, title, description, actions, footnote, depth = "well", as: Element = "section", flushContent = false, className, children, ...props },
  ref,
) {
  const titleId = useId();
  const hasHead = Boolean(eyebrow || title || description || actions);
  // The union would otherwise narrow the ref to one member's element type.
  const Tag = Element as ElementType;
  return (
    <Tag
      {...props}
      ref={ref}
      aria-labelledby={title ? titleId : props["aria-labelledby"]}
      className={cx("td-registry-frame", `td-registry-frame--${depth}`, className)}
    >
      {hasHead ? (
        <header className="td-registry-frame-head">
          <div className="td-registry-frame-identity">
            {eyebrow ? <p className="td-registry-frame-eyebrow">{eyebrow}</p> : null}
            {title ? <h3 id={titleId} className="td-registry-frame-title">{title}</h3> : null}
            {description ? <p className="td-registry-frame-description">{description}</p> : null}
          </div>
          {actions ? <div className="td-registry-frame-actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cx("td-registry-frame-well", flushContent && "td-registry-frame-well--flush")}>{children}</div>
      {footnote ? <p className="td-registry-frame-footnote">{footnote}</p> : null}
    </Tag>
  );
});

export interface TonalDepthFrameGridProps extends HTMLAttributes<HTMLDivElement> {
  /** Smallest a frame may get before the grid drops a column. */
  min?: number;
}

/** Frames laid out so they reflow rather than squash. */
export const TonalDepthFrameGrid = forwardRef<HTMLDivElement, TonalDepthFrameGridProps>(function TonalDepthFrameGrid(
  { min = 320, className, style, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      style={{ ...style, ["--td-frame-min" as string]: `${min}px` }}
      className={cx("td-registry-frame-grid", className)}
    />
  );
});
