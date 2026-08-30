"use client";

import { forwardRef, useId, type ElementType, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./frame.css";

/**
 * How deep the well is cut.
 *
 * `well` is the default and the one to reach for: content sits *in* the
 * surface. `flush` cuts no well at all — for a frame that is only supplying a
 * caption and a rule. `deep` is for a single hero object on a page that has
 * nothing else competing with it.
 */
export type FrameDepth = "well" | "flush" | "deep";

/**
 * The element the frame renders as. `figure` is for a frame whose well holds
 * one self-contained object the surrounding prose refers to — a chart, a
 * specimen. Everything else wants the default.
 */
export type FrameElement = "section" | "figure" | "article" | "div";

/**
 * The heading level the title renders at.
 *
 * A document's headings are an outline, and an outline with a level missing
 * from it is a broken one. The frame cannot know where on a page it sits, so
 * the caller says: a frame taken as a section's own heading under an `h1` is
 * `h2`, one inside a section is `h3` (the default), one inside a subsection is
 * `h4`. `p` is for a housing whose title is a caption rather than a heading —
 * it belongs in no outline at all.
 */
export type FrameTitleLevel = "h2" | "h3" | "h4" | "p";

/**
 * How large the title is drawn — which is a separate question from what level
 * it is.
 *
 * `caption` is the default and is right for a figure inside prose: a chart
 * caption should not out-shout the paragraph it belongs to. `section` is the
 * system's h4 step, for a frame that IS a section of the page and whose title
 * is the claim being made.
 */
export type FrameTitleScale = "caption" | "section";

export interface FrameProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** Small caps above the title. The category, not a sentence. */
  eyebrow?: ReactNode;
  title?: ReactNode;
  /** One line under the title. What the reader is looking at. */
  description?: ReactNode;
  /** Controls placed opposite the title — a range picker, a download. */
  actions?: ReactNode;
  /** A note under the well: the source, the as-of date, the caveat. */
  footnote?: ReactNode;
  depth?: FrameDepth;
  as?: FrameElement;
  /**
   * The title's heading level. `h3` by default, so no existing caller moves.
   *
   * **Level and size are deliberately separate.** `titleAs` decides where the
   * title sits in the document outline and `titleScale` decides how big it is
   * drawn; neither overrides the other, because a section heading that has to
   * stay quiet and a figure caption that has to be loud are both real.
   */
  titleAs?: FrameTitleLevel;
  /** How large the title is drawn. `caption` by default — see `titleScale`. */
  titleScale?: FrameTitleScale;
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
 *
 * **The head slots work at section scale as well as figure scale**, and that
 * is why `titleAs` and `titleScale` exist. The title used to be a hard `h3` at
 * 16px, which is right for a chart caption and wrong for a frame that is the
 * section — so a consumer whose page headed at `h2` either skipped a level or
 * abandoned the head slots and composed the header outside the frame, which
 * makes `eyebrow` / `title` / `description` unusable for half of what a frame
 * houses. Neither prop changes anything for an existing caller.
 */
export const Frame = forwardRef<HTMLElement, FrameProps>(function Frame(
  { eyebrow, title, description, actions, footnote, depth = "well", as: Element = "section", titleAs = "h3", titleScale = "caption", flushContent = false, className, children, ...props },
  ref,
) {
  const titleId = useId();
  const hasHead = Boolean(eyebrow || title || description || actions);
  // The union would otherwise narrow the ref to one member's element type.
  const Tag = Element as ElementType;
  const TitleTag = titleAs as ElementType;
  return (
    <Tag
      {...props}
      ref={ref}
      aria-labelledby={title ? titleId : props["aria-labelledby"]}
      className={cx("td-react-frame", `td-react-frame--${depth}`, className)}
    >
      {hasHead ? (
        <header className="td-react-frame-head">
          <div className="td-react-frame-identity">
            {eyebrow ? <p className="td-react-frame-eyebrow">{eyebrow}</p> : null}
            {title ? <TitleTag id={titleId} className={cx("td-react-frame-title", `td-react-frame-title--${titleScale}`)}>{title}</TitleTag> : null}
            {description ? <p className="td-react-frame-description">{description}</p> : null}
          </div>
          {actions ? <div className="td-react-frame-actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cx("td-react-frame-well", flushContent && "td-react-frame-well--flush")}>{children}</div>
      {footnote ? <p className="td-react-frame-footnote">{footnote}</p> : null}
    </Tag>
  );
});

export interface FrameGridProps extends HTMLAttributes<HTMLDivElement> {
  /** Smallest a frame may get before the grid drops a column. */
  min?: number;
}

/** Frames laid out so they reflow rather than squash. */
export const FrameGrid = forwardRef<HTMLDivElement, FrameGridProps>(function FrameGrid(
  { min = 320, className, style, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      style={{ ...style, ["--td-frame-min" as string]: `${min}px` }}
      className={cx("td-react-frame-grid", className)}
    />
  );
});
