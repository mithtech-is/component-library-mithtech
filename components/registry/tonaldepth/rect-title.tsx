"use client";

import { Fragment, forwardRef, useCallback, useEffect, useLayoutEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-rect-title.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export type TonalDepthRectTitleLevel = 1 | 2 | 3;

/**
 * A line's ink. These are the system's categories, not free colour — a
 * headline that can take any hex is a headline that can break the palette
 * ([[L11]]: colour is category). `ink` is the default face; `muted` steps a
 * line back; the other four are the named channels.
 */
export type TonalDepthRectTitleTone = "ink" | "muted" | "brand" | "accent" | "green" | "error";

/** How far a line may be scaled up to reach the longest one. */
const TonalDepthDEFAULT_MAX_SCALE = 1.5;

export interface TonalDepthRectTitleProps extends Omit<HTMLAttributes<HTMLHeadingElement>, "children"> {
  /**
   * The headline. Split into balanced lines and fitted to a rectangle.
   *
   * Put a newline in it to break where you say rather than where the splitter
   * would: explicit breaks win outright, and the automatic count and the
   * two-line floor are both skipped.
   *
   * Optional only because `lines` may carry the headline instead. One of the
   * two is required, and the component warns when neither is there.
   */
  text?: string;
  /** Which heading this is. The rect system runs at h1–h3; h4 and below are UI face. */
  level?: TonalDepthRectTitleLevel;
  /** Ceiling on the split. Two lines is the floor whenever the text has two words. */
  maxLines?: number;
  /**
   * How the lines are decided: **how many**, or **exactly which**.
   *
   * A **number** overrides the automatic count. `maxLines` only caps the
   * split, and the automatic count is also held down by a words-per-line
   * heuristic — so a five-word headline stays at two lines however high
   * `maxLines` goes. Pass a number when you want a specific count and mean it.
   * Clamped to the word count: four lines from three words is not a rectangle,
   * it is three lines and a gap.
   *
   * An **array** is the break set itself, and the splitter never runs. The
   * fitter still scales the block, so it is still a rectangle — it just does
   * not choose where the lines end. Reach for it when the breaks are the
   * design: a page's own `h1`, where three specific lines are the mark and a
   * balanced split would be a different headline.
   *
   * With an array, `text` is not used and may be omitted.
   */
  lines?: number | string[];
  /**
   * Screen-reader-only text rendered INSIDE the heading, after the visible
   * lines.
   *
   * The page's primary heading is where the positioning and the geo belong for
   * search, and an iconic three-line headline has no room for either. This
   * puts them in the same heading element without moving a pixel of it: the
   * suffix carries the library's own visually-hidden class, and it is not a
   * `.td-h1-line`, so the fitter never measures it and the rectangle is
   * unchanged.
   *
   * Keep it a phrase that continues the heading — it is read as part of the
   * heading, not as a separate sentence.
   */
  srSuffix?: ReactNode;
  /** Land the last line in the brand colour. Ignored when `tones` is given. */
  accent?: boolean;
  /**
   * Ink per line, in order. Short lists repeat their last entry, so
   * `["ink"]` holds the whole block and `["ink", "brand"]` accents every line
   * after the first. Overrides `accent`.
   */
  tones?: TonalDepthRectTitleTone[];
  /**
   * Square the block off exactly, however far a line has to stretch.
   *
   * Off by default: the fitter stops at 1.5x so a two-word line cannot become
   * a billboard, which means a lopsided headline stays slightly ragged. On,
   * every line reaches the same width — use it when the rectangle matters more
   * than the size relationship, and check the result.
   */
  forceRectangle?: boolean;
  /**
   * The scale ceiling, when 1.5 is the wrong number. `forceRectangle` is the
   * same thing set to Infinity; pass this instead to loosen it by a measured
   * amount rather than all the way.
   */
  maxScale?: number;
}

const TonalDepthtoneClass: Record<TonalDepthRectTitleTone, string> = {
  ink: "",
  muted: "td-h1-line--muted",
  // Core already owns the brand line as `.accent`; reuse it rather than
  // shipping a second name for the same ink.
  brand: "accent",
  accent: "td-h1-line--accent",
  green: "td-h1-line--green",
  error: "td-h1-line--error",
};

/** The tone for line `i`, given the list and the legacy `accent` flag. */
function TonalDepthlineTone(tones: TonalDepthRectTitleTone[] | undefined, accent: boolean, i: number, count: number): TonalDepthRectTitleTone {
  if (tones?.length) return tones[Math.min(i, tones.length - 1)];
  return accent && i === count - 1 ? "brand" : "ink";
}

/**
 * Split a headline into balanced lines.
 *
 * Balanced by character count rather than word count: Anton is condensed, so
 * "Implementation" and "ERP for you" occupy very different widths for the same
 * three-or-so words, and balancing on words alone produces a visibly lopsided
 * block before the fitter ever sees it.
 *
 * Returns at least two lines whenever the text has at least two words — one
 * line is not a rectangle, and the fitter has nothing to equalise against.
 */
export function TonalDepthsplitRectTitle(text: string, maxLines = 3, exactLines?: number): string[] {
  // A newline is the author saying where the line ends. Nothing heuristic
  // should second-guess that, so explicit breaks short-circuit the whole
  // splitter — including the two-line floor, since a deliberate one-line
  // headline is a decision rather than an accident.
  if (text.includes("\n")) {
    const written = text.split("\n").map(line => line.trim()).filter(Boolean);
    if (written.length) return written;
  }

  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return words.length ? [words.join(" ")] : [];

  // `exactLines` asks for a number; `maxLines` only caps one. The difference
  // matters because the automatic count is also held down by a words-per-line
  // heuristic — five words can never reach four lines on its own, so raising
  // `maxLines` alone looks like it does nothing.
  const lineCount = exactLines === undefined
    ? Math.max(2, Math.min(maxLines, Math.ceil(words.length / 3), words.length))
    : Math.max(1, Math.min(exactLines, words.length));
  return TonalDepthbalanceLines(words, lineCount);
}

/**
 * Choose the break points that minimise the longest line, then the spread
 * around the mean.
 *
 * Filling greedily to a target overshoots on the last word each line accepts:
 * "Talk to a principal consultant." comes out 9 and 21 characters when 19 and
 * 11 is available on the same two lines. The fitter caps its scaling at 1.5x,
 * so it cannot close a gap that wide and the block never squares off. Choosing
 * the break instead of stumbling into it is what keeps it a rectangle.
 *
 * Lengths are counted in characters rather than measured: Anton is condensed
 * and the real widths are not knowable on the server, where the split happens.
 */
/**
 * The span of a line that actually carries its visual width.
 *
 * Punctuation at either end does not count toward the rectangle. A line ending
 * in a full stop measures wider than the letters that make it up, so the
 * fitter scales it less and the block stops squaring off on the glyphs — the
 * comma and the stop hang past the edge instead of the letters meeting it.
 * "Talk to a principal consultant." is the case that shows it.
 *
 * Returns character offsets into the line's text, so both the splitter and the
 * pixel measurement can use the same definition of what a line is.
 */
const TonalDepthEDGE_PUNCTUATION = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

function TonalDepthinkSpan(text: string): { start: number; end: number }

function TonalDepthbalanceLines(words: string[], lineCount: number): string[] {
  // Lengths are the ink only: trailing punctuation would otherwise push a
  // break one word earlier than the rectangle wants.
  const inkLength = (text: string) => text.replace(TonalDepthEDGE_PUNCTUATION, "").length;
  const target = inkLength(words.join(" ")) / lineCount;
  const memo = new Map<string, { longest: number; spread: number; cuts: number[] }>();

  function best(start: number, remaining: number) {
    const key = `${start}:${remaining}`;
    const cached = memo.get(key);
    if (cached) return cached;

    if (remaining === 1) {
      const length = inkLength(words.slice(start).join(" "));
      const only = { longest: length, spread: (length - target) ** 2, cuts: [] as number[] };
      memo.set(key, only);
      return only;
    }

    let chosen: { longest: number; spread: number; cuts: number[] } | undefined;
    // Every remaining line needs at least one word of its own.
    for (let end = start + 1; end <= words.length - (remaining - 1); end++) {
      const length = inkLength(words.slice(start, end).join(" "));
      const rest = best(end, remaining - 1);
      const candidate = {
        longest: Math.max(length, rest.longest),
        spread: (length - target) ** 2 + rest.spread,
        cuts: [end, ...rest.cuts],
      };
      if (
        !chosen ||
        candidate.longest < chosen.longest ||
        (candidate.longest === chosen.longest && candidate.spread < chosen.spread)
      ) {
        chosen = candidate;
      }
    }

    memo.set(key, chosen!);
    return chosen!;
  }

  const lines: string[] = [];
  let start = 0;
  for (const cut of [...best(0, lineCount).cuts, words.length]) {
    lines.push(words.slice(start, cut).join(" "));
    start = cut;
  }
  return lines;
}

/**
 * Scale each line so they all end at the same visual width — the thing that
 * makes the block read as a rectangle rather than a ragged heading.
 *
 * Widths come from a Range over the text, not the span's box: `.td-h1-line` is
 * `display: block`, so its box is the column width and says nothing about the
 * glyphs. Only `font-size` moves; letter-spacing is never touched.
 *
 * Returns false when nothing has measurable width yet — the face has not landed
 * and every number would be the fallback's — so the caller can try again.
 */
function TonalDepthfitLines(heading: HTMLElement, maxScale: number): boolean {
  const lines = Array.from(heading.querySelectorAll<HTMLElement>(".td-h1-line"));
  if (lines.length < 2) return true;

  // Fitting is an enhancement over a heading that already reads correctly, so a
  // renderer without Range metrics (jsdom, and anything else not doing layout)
  // gets the unfitted lines rather than an exception.
  const probe = heading.ownerDocument.createRange();
  if (typeof probe.getBoundingClientRect !== "function") return true;

  for (const line of lines) line.style.fontSize = "";
  const base = parseFloat(getComputedStyle(heading).fontSize) || 16;

  const widths = lines.map((line) => {
    const range = heading.ownerDocument.createRange();
    const text = line.firstChild;
    const value = line.textContent ?? "";
    // Measure between the first and last letter, so a line's stop or comma
    // hangs past the rectangle rather than shrinking the words inside it.
    if (text && text.nodeType === 3 && value) {
      const { start, end } = TonalDepthinkSpan(value);
      range.setStart(text, start);
      range.setEnd(text, end);
    } else {
      range.selectNodeContents(line);
    }
    const width = range.getBoundingClientRect().width;
    range.detach();
    return width;
  });
  const target = Math.max(...widths);
  if (!target) return false;

  // The static system's runtime only scales up, so a headline whose longest
  // line is wider than its column runs off the side of the page. Shrinking the
  // whole block keeps the rectangle — every line still lands on `target` — and
  // keeps it on the page.
  const available = heading.clientWidth;
  const scale = available > 0 && target > available ? available / target : 1;

  lines.forEach((line, i) => {
    // Capped so a two-word line never becomes a billboard, unless the caller
    // has asked for the rectangle at any cost.
    const grow = widths[i] >= target - 0.5 ? 1 : Math.min(target / widths[i], maxScale);
    line.style.fontSize = `${base * scale * grow}px`;
  });
  return true;
}

/** Fitting reads layout, so it belongs before paint — except on the server. */
const useTonalDepthFitEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * A headline set as the design system's rectangle title: Anton, uppercase, and
 * scaled line by line so the block squares off.
 *
 * The component owns its heading element — it needs one to measure against and
 * to read the base size from. Pick the level with `level`; the rect system is
 * h1–h3 only, because h4 and below are the UI face.
 *
 * Fitting is self-contained. It does not use the static system's global
 * `fitHeadings()` runtime, which walks the whole document and would fight
 * React over inline styles it did not set.
 *
 * **Four ways to decide the lines, in order of who wins.** An ARRAY of
 * `lines` is the break set itself and beats everything — `text` is not read at
 * all. A newline in `text` is an explicit break and beats the rest. A NUMBER
 * of `lines` asks for an exact count. Otherwise the splitter chooses, capped
 * by `maxLines` and by a words-per-line heuristic — which is why raising
 * `maxLines` on a short headline appears to do nothing, and why `lines`
 * exists.
 *
 * **The fitter runs either way.** An explicit break set stops the block being
 * re-broken; it does not stop it being squared off, which is the whole point
 * of the component.
 */
export const TonalDepthRectTitle = forwardRef<HTMLHeadingElement, TonalDepthRectTitleProps>(function TonalDepthRectTitle(
  { text, level = 1, maxLines = 3, lines: lineSpec, srSuffix, accent = true, tones, forceRectangle = false, maxScale, className, ...props },
  ref,
) {
  const heading = useRef<HTMLHeadingElement | null>(null);
  /* An array is the break set; a number is a count for the splitter to hit.
     The array short-circuits the splitter entirely, so a headline whose breaks
     ARE the design cannot be re-broken by a heuristic that has no way of
     knowing that. */
  const written = Array.isArray(lineSpec)
    ? lineSpec.map(line => line.trim()).filter(Boolean)
    : null;
  const lines = written ?? TonalDepthsplitRectTitle(text ?? "", maxLines, typeof lineSpec === "number" ? lineSpec : undefined);
  if (!lines.length) {
    // Unconditional rather than dev-only, and matching IconButton's missing
    // name: it only fires on a real defect, and the package carries no
    // build-time environment flag to gate it on.
    console.warn("TonalDepthRectTitle: pass `text`, or a `lines` array. Neither is set, so the heading is empty.");
  }
  const scaleCeiling = maxScale ?? (forceRectangle ? Infinity : TonalDepthDEFAULT_MAX_SCALE);

  const setRefs = useCallback(
    (node: HTMLHeadingElement | null) => {
      heading.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  useTonalDepthFitEffect(() => {
    const node = heading.current;
    if (!node) return;

    let frame = 0;
    let attempts = 0;
    let cancelled = false;

    const run = () => {
      if (cancelled || !heading.current) return;
      // 20 frames is the static system's own ceiling. Past that the face is not
      // coming and the fallback measurements are the best available.
      if (!TonalDepthfitLines(heading.current, scaleCeiling) && attempts++ < 20) frame = requestAnimationFrame(run);
    };
    const refit = () => {
      attempts = 0;
      run();
    };

    refit();
    // Anton changes every measurement and lands after the first paint.
    document.fonts?.ready.then(refit);
    // `.td-h1` sizes off the viewport, so a resize changes the base size too.
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(refit) : null;
    observer?.observe(node);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
    // `lines.join` rather than the array identity: a caller writing the break
    // set inline hands a fresh array every render, and refitting on every one
    // of those is a resize observer's worth of work for no change.
  }, [text, maxLines, level, scaleCeiling, lines.join("\n")]);

  const Heading = `h${level}` as const;
  return (
    <Heading {...props} ref={setRefs} className={cx(`td-${Heading}`, "td-registry-rect-title", className)}>
      {lines.map((line, i) => (
        <Fragment key={`${line}-${i}`}>
          {/* The lines are block boxes with no whitespace between them, so the
              accessible name and a copy-paste would read "to aprincipal" without
              this. Whitespace between block boxes is not rendered. */}
          {i > 0 ? " " : null}
          <span className={cx("td-h1-line", TonalDepthtoneClass[TonalDepthlineTone(tones, accent, i, lines.length)])}>
            {line}
          </span>
        </Fragment>
      ))}
      {/* Inside the heading, so it is part of the heading's accessible name and
          its text — and NOT a `.td-h1-line`, so the fitter never measures it
          and the rectangle is untouched. */}
      {srSuffix ? <span className="td-registry-rect-title-sr">{srSuffix}</span> : null}
    </Heading>
  );
});
