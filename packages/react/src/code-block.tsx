import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import { CopyChip } from "./copy-chip";
import { Frame } from "./frame";
import "./code-block.css";

export interface CodeBlockProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "children"> {
  /**
   * The raw source. This is what the copy control puts on the clipboard, and
   * what is rendered when `children` is absent.
   */
  code: string;
  /**
   * Pre-highlighted markup. You bring the highlighter — see the note. Whatever
   * is passed replaces the plain text; `code` is still what gets copied.
   */
  children?: ReactNode;
  /** The language, above the well. A tag, not a sentence: "TypeScript", "bash". */
  language?: ReactNode;
  /** What this block is — a route, a path, a filename. */
  title?: ReactNode;
  /** A note under the well: where it came from, what it assumes. */
  footnote?: ReactNode;
  /** The copy control in the corner. */
  copy?: boolean;
  /** The chip's visible text. Default "Copy". */
  copyLabel?: string;
  /** The chip's accessible name — the value is a whole file, so it cannot be the label. */
  copyAriaLabel?: string;
  /** Announced and shown while the copied state holds. Default "Copied". */
  copiedLabel?: string;
  /** Wrap long lines instead of scrolling them. */
  wrap?: boolean;
}

/**
 * Code, housed.
 *
 * This is a `Frame` with the slots a listing needs already wired: the language
 * and the file above, a `CopyChip` in the corner, the source in the well. Code
 * is a measured object, so it is *shown* in a well rather than *offered* on a
 * plate — that pairing is `Frame`'s and this component does not re-implement it
 * ([[L32]]).
 *
 * **It does no syntax highlighting, and it never will.** A highlighter is a
 * grammar per language and a theme per grammar; carrying one would put a
 * dependency the size of the library itself behind a component that draws a
 * box. Pass pre-highlighted markup as `children` — from Shiki, Prism,
 * highlight.js, or your own server — and set `code` to the raw text so the copy
 * control has something to copy. Four token classes are styled from the
 * system's own tokens: `td-cb-k` (keyword), `td-cb-s` (string), `td-cb-n`
 * (name), `td-cb-c` (comment).
 *
 * **The well is the surface pressed in, not a dark slab.** The design system's
 * own panel hardcodes `#1A1815` in both themes; a well is the plain material
 * carved inward ([[L32]]) and a fixed dark ground on a paper page is a tinted
 * band ([[L03]]). The recess carries it, and the token colours follow the theme.
 */
export const CodeBlock = forwardRef<HTMLElement, CodeBlockProps>(function CodeBlock(
  { code, children, language, title, footnote, copy = true, copyLabel = "Copy", copyAriaLabel = "Copy code", copiedLabel = "Copied", wrap = false, className, ...props },
  ref,
) {
  return (
    <Frame
      {...props}
      ref={ref}
      as="figure"
      eyebrow={language}
      title={title}
      footnote={footnote}
      actions={copy ? <CopyChip value={code} label={copyLabel} copiedLabel={copiedLabel} aria-label={copyAriaLabel} /> : undefined}
      className={cx("td-react-code", className)}
    >
      {/* Focusable because it is its own scroller: a listing wider than the
          page is unreachable by keyboard otherwise. */}
      <pre
        className={cx("td-codeblock", "td-react-codeblock", wrap && "td-react-codeblock--wrap")}
        tabIndex={0}
      >
        <code className="td-react-codeblock-code">{children ?? code}</code>
      </pre>
    </Frame>
  );
});
