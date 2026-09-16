import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-carousel.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthCarouselProps extends HTMLAttributes<HTMLDivElement> {
  /** Accessible name for the scroll region — "Case studies", "Recent work". */
  label: string;
  /** The items — typically `TonalDepthCarouselCard`, but any nodes. */
  children: ReactNode;
  /** A hint shown beneath the strip. Pass `null` to omit. Default `"Scroll →"`. */
  hint?: ReactNode;
}

/**
 * A horizontally scroll-snapping strip of cards — recent work, related reading,
 * a shelf of options too many to stack.
 *
 * The scroll region, the snap, the card and the hint are the base `.td-carousel*`
 * in `tonaldepth-core` ([[L16]]). It is a real scroll container: it carries
 * `role="region"` with a name and is itself focusable, so a keyboard reader
 * tabs to it and scrolls it with the arrow keys, and touch and trackpad work as
 * they already do — no prev/next buttons to reimplement or get out of step.
 *
 * **Not a slideshow.** There is no autoplay and no single "active" slide seizing
 * the view; every card is present and reachable. If you need one thing at a time
 * with the rest hidden, that is `Tabs`, not this.
 */
export const TonalDepthCarousel = forwardRef<HTMLDivElement, TonalDepthCarouselProps>(function TonalDepthCarousel(
  { label, children, hint = "Scroll →", className, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} className={cx("td-registry-carousel-wrap", className)}>
      <div className="td-carousel td-registry-carousel" tabIndex={0} role="region" aria-label={label}>
        {children}
      </div>
      {hint !== null ? (
        <div className="td-carousel-hint" aria-hidden="true">
          {hint}
        </div>
      ) : null}
    </div>
  );
});

export type TonalDepthCarouselCardTone = "brand" | "accent" | "green";

export interface TonalDepthCarouselCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** A small mono eyebrow above the title. */
  eyebrow?: ReactNode;
  /** The card's heading. */
  title: ReactNode;
  /** The eyebrow's colour. Default `"brand"`. */
  tone?: TonalDepthCarouselCardTone;
  /** A call-to-action line at the foot — "Read case study →". */
  cta?: ReactNode;
  /** The card body. */
  children?: ReactNode;
}

/**
 * A card sized for a `TonalDepthCarousel` — eyebrow, title, body and an optional CTA line,
 * on the design system's carved surface. `tone` colours the eyebrow; the title
 * is a plain element, not a heading, so a shelf of cards does not litter the
 * page outline with same-level headings.
 */
export const TonalDepthCarouselCard = forwardRef<HTMLDivElement, TonalDepthCarouselCardProps>(function TonalDepthCarouselCard(
  { eyebrow, title, tone = "brand", cta, children, className, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} data-tone={tone} className={cx("td-carousel-card", "td-registry-carousel-card", className)}>
      {eyebrow ? <div className="td-carousel-card-eyebrow">{eyebrow}</div> : null}
      <div className="td-carousel-card-title">{title}</div>
      {children ? <p className="td-carousel-card-text">{children}</p> : null}
      {cta ? <span className="td-carousel-card-cta">{cta}</span> : null}
    </div>
  );
});
