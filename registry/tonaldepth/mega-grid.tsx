import { forwardRef, type HTMLAttributes } from "react";
import "./tonaldepth-mega-grid.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

// ── The card grid ──────────────────────────────────────────────────────────

export interface TonalDepthMegaGridProps extends HTMLAttributes<HTMLDivElement> {
  /** Smallest a card may get before the grid drops a column. Default 180. */
  min?: number;
}

/**
 * Cards in a well.
 *
 * The simplest panel: no rail, no selection, just the things on offer. It is a
 * `.td-mega-content` well rather than a bare grid, which is the part that is
 * easy to get wrong — a panel of cards sitting directly on the sheet has the
 * cards and their housing at the same depth, so nothing reads as contained.
 * Chrome is raised and what you are choosing between is recessed ([[L32]]).
 *
 * Give the cards an `href`. A card in a menu that cannot be clicked is a
 * picture of a menu.
 */
export const TonalDepthMegaGrid = forwardRef<HTMLDivElement, TonalDepthMegaGridProps>(function TonalDepthMegaGrid(
  { min = 180, className, style, children, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} className={cx("td-mega-content", "td-registry-mega-content", "td-registry-mega-grid", className)} style={{ ...style, ["--td-mega-card-min" as string]: `${min}px` }}>
      {children}
    </div>
  );
});

export interface TonalDepthMegaActionsProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * The CTA rail for a panel's `footer` slot.
 *
 * It belongs in the footer rather than in a column: in a column it spends a
 * third of the sheet on links that never change, and it scrolls away with the
 * content. In the footer it sits outside the scroll area, so it stays reachable
 * however far a column grows and all three columns carry navigation.
 */
export const TonalDepthMegaActions = forwardRef<HTMLDivElement, TonalDepthMegaActionsProps>(function TonalDepthMegaActions(
  { className, ...props }, ref,
) {
  return <div {...props} ref={ref} className={cx("td-mega-head-actions", "td-registry-mega-actions", className)} />;
});
