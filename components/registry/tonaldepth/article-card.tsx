"use client";

import { forwardRef, useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-article-card.css";

const LAMP_WEIGHT = "fill" as const;

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * Microsoft's Fluent System Icons, filled weight, copied in because a registry
 * item is one self-contained file. Vendored from `@fluentui/svg-icons` and
 * stripped to `currentColor`, so the component's lamp ladder moves them.
 */
interface FluentIconProps extends SVGProps<SVGSVGElement> {
  /** Edge length. `1em` so the glyph scales with the type it sits beside. */
  size?: number | string;
  /** The fill. `currentColor` so the lamp ramp can move it. */
  color?: string;
  /**
   * Swallowed, not forwarded. Fluent marks are filled by construction, so
   * there is nothing to switch — but call sites pass `weight={LAMP_WEIGHT}`
   * and `weight` is not an SVG attribute, so React would put it on the DOM.
   */
  weight?: string;
  /** Flip horizontally, for a mark that points. */
  mirrored?: boolean;
}

interface FluentGlyphProps extends FluentIconProps {
  viewBox: string;
  d: string;
}

function FluentGlyph({ viewBox, d, size = "1em", color = "currentColor", weight, mirrored, ...props }: FluentGlyphProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      fill={color}
      transform={mirrored ? "scale(-1, 1)" : undefined}
      {...props}
    >
      <path d={d} />
    </svg>
  );
}

/** `chevron_left_24_filled` */
function ChevronLeftIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M15.7 4.3a1 1 0 0 1 0 1.4L9.42 12l6.3 6.3a1 1 0 0 1-1.42 1.4l-7-7a1 1 0 0 1 0-1.4l7-7a1 1 0 0 1 1.42 0" {...props} />;
}

/** `chevron_right_24_filled` */
function ChevronRightIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M8.3 4.3a1 1 0 0 0 0 1.4l6.29 6.3-6.3 6.3a1 1 0 1 0 1.42 1.4l7-7a1 1 0 0 0 0-1.4l-7-7a1 1 0 0 0-1.42 0" {...props} />;
}

/** `data_bar_vertical_24_filled` */
function DatasetIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M5.75 3C6.99 3 8 4 8 5.25v13.5a2.25 2.25 0 1 1-4.5 0V5.25C3.5 4 4.5 3 5.75 3m6.5 4c1.24 0 2.25 1 2.25 2.25v9.5a2.25 2.25 0 1 1-4.5 0v-9.5C10 8 11 7 12.25 7m6.5 4c1.24 0 2.25 1 2.25 2.25v5.5a2.25 2.25 0 1 1-4.5 0v-5.5c0-1.24 1-2.25 2.25-2.25" {...props} />;
}

/** `circle_24_filled` */
function DotIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0" {...props} />;
}

/** `arrow_download_24_filled` */
function DownloadIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M13 3a1 1 0 1 0-2 0v12.09l-3.3-3.3a1 1 0 0 0-1.4 1.42l5 5a1 1 0 0 0 1.4 0l5-5a1 1 0 0 0-1.4-1.42L13 15.1zM5 20a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2z" {...props} />;
}

/** `cursor_click_24_filled` */
function InteractiveIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M9.25 2c.41 0 .75.34.75.75v2.5a.75.75 0 0 1-1.5 0v-2.5c0-.41.34-.75.75-.75M4.47 3.97c.3-.3.77-.3 1.06 0l1.75 1.75a.75.75 0 1 1-1.06 1.06L4.47 5.03a.75.75 0 0 1 0-1.06m9.56 0c.3.3.3.77 0 1.06l-1.75 1.75a.75.75 0 1 1-1.06-1.06l1.75-1.75c.3-.3.77-.3 1.06 0M2.5 8.75c0-.41.34-.75.75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75m6 .74a1.32 1.32 0 0 1 2.18-1l8.46 7.25c.9.78.39 2.27-.8 2.32l-3.85.15c-.41.02-.8.2-1.07.5l-2.62 2.93c-.8.9-2.3.33-2.3-.88z" {...props} />;
}

export interface TonalDepthArticleCardAuthor {
  name: ReactNode;
  initials?: string;
  avatar?: ReactNode;
}

/**
 * What kind of thing the reader gets, which decides the chip's glyph and the
 * category colour it carries.
 *
 * - `live` — a tool that runs in the page: a calculator, a benchmark, a quote
 *   estimator. Green, the system's healthy-state colour.
 * - `download` — a file the reader takes away: a sheet, a template, a runbook.
 *   Azure. Set `download` on the asset too, or the browser navigates instead.
 * - `data` — the numbers behind the piece, offered raw: a CSV, a dataset.
 *   Violet, from the categorical series.
 * - `interactive` — something the reader operates rather than reads: a
 *   checklist, a configurator, a timeline they can step through. Papaya.
 */
export type TonalDepthArticleCardAssetKind = "live" | "download" | "data" | "interactive";

/** One thing the piece carries, as a chip in the "In this piece" well. */
export interface TonalDepthArticleCardAsset {
  /** What it is, in the reader's words — "Cost calculator", "Line-item sheet". */
  label: ReactNode;
  href: string;
  kind: TonalDepthArticleCardAssetKind;
  /**
   * The machine face of the asset — `live`, `xlsx · 84 kb`, `csv`. Set in mono
   * and upper-cased, because it is a format and a size rather than prose.
   * Omit it where there is no machine value to report.
   */
  meta?: ReactNode;
  /** Overrides the kind's glyph, for an asset whose own mark says more. */
  icon?: ReactNode;
  /** Marks the anchor `download`, so the file saves instead of navigating. */
  download?: boolean;
}

export interface TonalDepthArticleCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  eyebrow?: ReactNode;
  title: ReactNode;
  excerpt?: ReactNode;
  cover?: ReactNode;
  href?: string;
  date?: ReactNode;
  readTime?: ReactNode;
  author?: TonalDepthArticleCardAuthor;
  /** What the piece carries. Renders the "In this piece" well when non-empty. */
  assets?: TonalDepthArticleCardAsset[];
  /** The well's heading. Say what the strip holds if "In this piece" is wrong for it. */
  assetsLabel?: ReactNode;
  /**
   * Hand your router the anchor. Given the class and the href, return the
   * element. Without it every card is a document load.
   *
   * **It covers the card's own link and nothing else.** An asset chip in the
   * "In this piece" well stays a plain anchor: most of them are downloads or
   * somebody else's host, and the chip's colour rides a `data-kind` attribute
   * this signature has nowhere to put. Route those yourself if you need to.
   */
  renderLink?: (props: { className: string; href: string; children: ReactNode }) => ReactNode;
}

/* What this port does NOT carry, named rather than left to be discovered
   ([[L29]] — a part left behind is a silent gap, and the note is the minimum
   the rule accepts when a part is dropped on purpose).
 
   The design system's own card (`docs/tonaldepth/components/10-marketing/
   articlecard.html`, `.td-article-*` in the site stylesheet) has two parts with
   no equivalent here:
 
   - `.td-article-badges` / `.td-article-badge` — carved mono chips pinned over
     the cover, with a `--feature` variant in brand ink. Not ported: the shape
     is a Badge, and a second badge family inside a card would be the "assemble
     a lookalike out of another component's parts" move [[L16]] forbids. If it
     is wanted, it is `badges?: ReactNode[]` rendering real `Badge`s into the
     cover slot — a decision, not an oversight.
   - `.td-article-head-icon` — a 112px watermark glyph bottom-right of the
     header band that tints papaya on hover. Not ported: `cover` is a free
     ReactNode slot here, so a consumer supplies whatever the band holds; the
     hover tint would have to be a prop to survive that.
 
   Everything else the original draws is present. Re-diff the class families
   before adding to this component: `grep -o "td-article-[a-z]*"` against the
   site stylesheet is the whole inventory in one command. */

function TonalDepthassetGlyph(kind: TonalDepthArticleCardAssetKind): ReactNode {
  if (kind === "download") return <DownloadIcon weight={LAMP_WEIGHT} />;
  if (kind === "data") return <DatasetIcon weight={LAMP_WEIGHT} />;
  if (kind === "interactive") return <InteractiveIcon weight={LAMP_WEIGHT} />;
  return <DotIcon weight={LAMP_WEIGHT} />;
}

/** How many rows the well stacks. The design system's own card is three. */
const TonalDepthASSET_ROWS = 3;

/**
 * Split the assets into up to three rows, in order.
 *
 * Sequential chunks rather than a round robin, because that is what the design
 * system's own markup does and the order carries meaning — the two `live`
 * tools sit together, then the two downloads, then the data. With fewer than
 * three assets it simply renders fewer rows.
 *
 * Rows, not a wrapping column: a `flex-wrap: wrap` column gives every chip in
 * a column the widest chip's width, so short labels trail a gap. Rows let each
 * chip hug its own label and sit flush against its neighbour.
 */
function TonalDepthassetRows(assets: TonalDepthArticleCardAsset[]): TonalDepthArticleCardAsset[][] {
  const perRow = Math.ceil(assets.length / TonalDepthASSET_ROWS);
  const rows: TonalDepthArticleCardAsset[][] = [];
  for (let index = 0; index < assets.length; index += perRow) rows.push(assets.slice(index, index + perRow));
  return rows;
}

function TonalDepthArticleCardPayload({ assets, label }: { assets: TonalDepthArticleCardAsset[]; label: ReactNode }) {
  const scroller = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const [reach, setReach] = useState({ overflows: false, atStart: true, atEnd: true });

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    const measure = () => {
      const slack = node.scrollWidth - node.clientWidth;
      setReach({ overflows: slack > 1, atStart: node.scrollLeft <= 1, atEnd: node.scrollLeft >= slack - 1 });
    };
    measure();
    node.addEventListener("scroll", measure, { passive: true });
    // jsdom and pre-2020 Safari have no ResizeObserver; without it the strip
    // still scrolls, it just stops re-measuring when the card is resized.
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(node);
    return () => {
      node.removeEventListener("scroll", measure);
      observer?.disconnect();
    };
  }, [assets.length]);

  // A screenful less one chip, so the chip the reader was looking at stays on
  // screen as an anchor. `behavior` is left unset deliberately: that defers to
  // the stylesheet's `scroll-behavior`, which reduced-motion turns off.
  const page = (direction: 1 | -1) => {
    const node = scroller.current;
    if (node) node.scrollBy({ left: direction * node.clientWidth * 0.8 });
  };

  return (
    <div className="td-mk-article-payload">
      <p className="td-mk-article-payload-label" id={labelId}>{label}</p>
      <div className="td-mk-article-assets" ref={scroller} role="group" aria-labelledby={labelId}>
        {TonalDepthassetRows(assets).map((row, rowIndex) => (
          <ul className="td-mk-article-assetrow" key={rowIndex}>
            {row.map((asset, index) => (
              <li className="td-mk-article-asset-item" key={index}>
                <a
                  className="td-mk-article-asset"
                  href={asset.href}
                  data-kind={asset.kind}
                  download={asset.download ? "" : undefined}
                >
                  <span className="td-mk-article-asset-glyph" aria-hidden="true">{asset.icon ?? TonalDepthassetGlyph(asset.kind)}</span>
                  <span className="td-mk-article-asset-label">{asset.label}</span>
                  {asset.meta ? <span className="td-mk-article-asset-meta">{asset.meta}</span> : null}
                </a>
              </li>
            ))}
          </ul>
        ))}
      </div>
      {reach.overflows ? (
        <div className="td-mk-article-payload-nav">
          <button
            type="button"
            className="td-mk-article-payload-arrow"
            aria-label="Show earlier items"
            disabled={reach.atStart}
            onClick={() => page(-1)}
          >
            <ChevronLeftIcon weight={LAMP_WEIGHT} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="td-mk-article-payload-arrow"
            aria-label="Show later items"
            disabled={reach.atEnd}
            onClick={() => page(1)}
          >
            <ChevronRightIcon weight={LAMP_WEIGHT} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export const TonalDepthArticleCard = forwardRef<HTMLElement, TonalDepthArticleCardProps>(function TonalDepthArticleCard(
  { eyebrow, title, excerpt, cover, href, renderLink, date, readTime, author, assets, assetsLabel = "In this piece", className, ...props },
  ref,
) {
  const hasMeta = Boolean(date || readTime);
  return (
    <article {...props} ref={ref} className={cx("td-mk-article", href && "td-mk-article--link", className)}>
      {cover ? <div className="td-mk-article-cover">{cover}</div> : null}
      <div className="td-mk-article-body">
        {eyebrow ? <p className="td-mk-article-eyebrow">{eyebrow}</p> : null}
        <h3 className="td-mk-article-title">
          {!href
            ? title
            : renderLink
              ? renderLink({ className: "td-mk-article-titlelink", href, children: title })
              : <a className="td-mk-article-titlelink" href={href}>{title}</a>}
        </h3>
        {excerpt ? <p className="td-mk-article-excerpt">{excerpt}</p> : null}
        {assets?.length ? <TonalDepthArticleCardPayload assets={assets} label={assetsLabel} /> : null}
        {(author || hasMeta) ? (
          <div className="td-mk-article-foot">
            {author ? (
              <div className="td-mk-article-author">
                <span className="td-mk-article-avatar" aria-hidden="true">
                  {author.avatar ?? author.initials ?? ""}
                </span>
                <p className="td-mk-article-name">{author.name}</p>
              </div>
            ) : <span />}
            {hasMeta ? (
              <p className="td-mk-article-meta">
                {date ? <span className="td-mk-article-date">{date}</span> : null}
                {date && readTime ? <span className="td-mk-article-meta-sep" aria-hidden="true">·</span> : null}
                {readTime ? <span className="td-mk-article-read">{readTime}</span> : null}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
});

export interface TonalDepthArticleCardGridProps extends HTMLAttributes<HTMLDivElement> {}

export const TonalDepthArticleCardGrid = forwardRef<HTMLDivElement, TonalDepthArticleCardGridProps>(function TonalDepthArticleCardGrid(
  { className, ...props }, ref,
) {
  return <div {...props} ref={ref} className={cx("td-mk-article-grid", className)} />;
});
