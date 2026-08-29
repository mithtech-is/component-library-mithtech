import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-code-block.css";
import { TonalDepthFrame } from "./tonaldepth-frame";
import { TonalDepthCopyChip } from "./tonaldepth-copy-chip";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthCodeBlockProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "children"> {
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
  /**
   * Read `code` as a unified diff and mark each line by its first character —
   * `+` added, `-` removed, `@` or `+++`/`---` a hunk header, anything else
   * context.
   *
   * This is a reading mode, not a second component: it is the same monospace
   * listing in the same well, and the only thing that changes is that each line
   * carries a verdict. It is deliberately dumb — it does not parse hunk
   * ranges, does not pair added lines with removed ones, and does not compute a
   * diff. Give it the output of `git diff`.
   *
   * The marker column is drawn from the line's own first character rather than
   * being re-emitted, so copying still yields the diff exactly as it came in.
   * `children` is ignored in this mode: a highlighter's markup and a per-line
   * split cannot both own the same text.
   */
  diff?: boolean;
}

/**
 * Code, housed.
 *
 * This is a `TonalDepthFrame` with the slots a listing needs already wired: the language
 * and the file above, a `TonalDepthCopyChip` in the corner, the source in the well. Code
 * is a measured object, so it is *shown* in a well rather than *offered* on a
 * plate — that pairing is `TonalDepthFrame`'s and this component does not re-implement it
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
export const TonalDepthCodeBlock = forwardRef<HTMLElement, TonalDepthCodeBlockProps>(function TonalDepthCodeBlock(
  { code, children, language, title, footnote, copy = true, copyLabel = "Copy", copyAriaLabel = "Copy code", copiedLabel = "Copied", wrap = false, diff = false, className, ...props },
  ref,
) {
  // Trailing newline first: `"a\n".split("\n")` is `["a", ""]`, and that empty
  // string renders as a blank marked line at the bottom of every diff.
  const lines = diff ? code.replace(/\n$/, "").split("\n") : [];
  return (
    <TonalDepthFrame
      {...props}
      ref={ref}
      as="figure"
      eyebrow={language}
      title={title}
      footnote={footnote}
      actions={copy ? <TonalDepthCopyChip value={code} label={copyLabel} copiedLabel={copiedLabel} aria-label={copyAriaLabel} /> : undefined}
      className={cx("td-registry-code", diff && "td-registry-code--diff", className)}
    >
      {/* Focusable because it is its own scroller: a listing wider than the
          page is unreachable by keyboard otherwise. */}
      <pre
        className={cx("td-codeblock", "td-registry-codeblock", wrap && "td-registry-codeblock--wrap")}
        tabIndex={0}
      >
        <code className="td-registry-codeblock-code">
          {diff
            ? lines.map((line, index) => (
                <span className="td-registry-diff-line" data-kind={TonalDepthdiffKind(line)} key={index}>
                  {line}
                  {"\n"}
                </span>
              ))
            : children ?? code}
        </code>
      </pre>
    </TonalDepthFrame>
  );
});

/** The verdict a unified-diff line's first character carries. */
function TonalDepthdiffKind(line: string): "add" | "del" | "meta" | "context" {
  // `+++` and `---` are file headers, not an added and a removed line — they
  // have to be tested before the single-character cases or every diff opens
  // with one green line and one red one.
  if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("@@")) return "meta";
  if (line.startsWith("+")) return "add";
  if (line.startsWith("-")) return "del";
  return "context";
}
