"use client";

import { forwardRef, useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { CaretLeftIcon as ChevronLeftIcon, CaretRightIcon as ChevronRightIcon, ChartBarIcon as DatasetIcon, CircleIcon as DotIcon, DownloadSimpleIcon as DownloadIcon, CursorClickIcon as InteractiveIcon } from "@phosphor-icons/react";
import "./tonaldepth-article-card.css";

const LAMP_WEIGHT = "fill" as const;

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
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
