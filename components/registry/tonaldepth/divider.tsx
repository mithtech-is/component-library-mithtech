import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-divider.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/** Which way the seam runs. */
export type TonalDepthDividerOrientation = "horizontal" | "vertical";

/**
 * How deep the parting is.
 *
 * - `seam` — the default. The surface parts: a shade cut into it and the light
 *   catching the lip below.
 * - `hairline` — a single quiet rule, for a dense list where a full seam on
 *   every row would corrugate the plate.
 */
export type TonalDepthDividerWeight = "seam" | "hairline";

export interface TonalDepthDividerProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: TonalDepthDividerOrientation;
  weight?: TonalDepthDividerWeight;
  /**
   * Words in the middle of the seam — "or", "since 2019", a date in a feed.
   *
   * Supplying it changes what the element IS: a labelled divider is a heading
   * for what follows, so it stops being `role="separator"` and the label is
   * left readable. An unlabelled one is decoration and is hidden from screen
   * readers, because a reader does not need to be told a line exists.
   */
  label?: ReactNode;
  /** Pulls the seam in from both ends, so it reads as a groove rather than a cut. */
  inset?: boolean;
}

/**
 * The parting between two things.
 *
 * **A boundary in this system is a carved seam, never a tinted band** ([[L03]]).
 * A line drawn on a surface sits ON it; a seam is the surface itself parting,
 * and it takes two hairlines to make one — the shade cut into the plate, and
 * the light catching the lip below it. Every component that needed a boundary
 * has been re-deriving that pair by hand: `Faq` between its questions, the
 * drawer above its footer, `MegaColumns` under its columns. This is the one
 * place to keep it.
 *
 * `inset` is worth knowing about. A rule that runs the full width of a plate
 * divides it into two plates; the same rule pulled in from both ends reads as
 * a groove in one plate. Which you want depends on whether the two sides are
 * still the same object.
 */
export const TonalDepthDivider = forwardRef<HTMLDivElement, TonalDepthDividerProps>(function TonalDepthDivider(
  { orientation = "horizontal", weight = "seam", label, inset = false, className, ...props },
  ref,
) {
  const labelled = label !== undefined && label !== null;
  return (
    <div
      {...props}
      ref={ref}
      /* Labelled, it is a heading for what comes next and has to be readable.
         Bare, it is decoration — announcing "separator" on every rule in a long
         list is noise a screen reader cannot skip. */
      role={labelled ? undefined : "separator"}
      aria-hidden={labelled ? undefined : true}
      aria-orientation={!labelled && orientation === "vertical" ? "vertical" : undefined}
      data-orientation={orientation}
      data-weight={weight}
      data-inset={inset || undefined}
      className={cx("td-registry-divider", labelled && "td-registry-divider--labelled", className)}
    >
      {labelled ? <span className="td-registry-divider-label">{label}</span> : null}
    </div>
  );
});
