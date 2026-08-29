import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-filament-button.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * The filament's colour when lit. These are the system's categories — a
 * filament that took any hex would be a filament that could break the palette
 * ([[L11]]: colour is category).
 */
export type TonalDepthFilamentTone = "green" | "brand" | "accent" | "error";

/** Which edge the filament runs along. */
export type TonalDepthFilamentEdge = "start" | "top";

/** The housing's size. `sm` is the collapsed-rail form. */
export type TonalDepthFilamentSize = "sm" | "md";

export interface TonalDepthFilamentButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** The label. Omit for the icon-only rail form, and pass `aria-label` instead. */
  label?: ReactNode;
  /** A filled glyph. An outline cannot read as lit. */
  icon?: ReactNode;
  /**
   * Lit and held — the tab whose panel is open. This is the fourth state, and
   * it is distinct from hover and from press: the filament stays on when the
   * pointer leaves.
   */
  active?: boolean;
  tone?: TonalDepthFilamentTone;
  /**
   * `start` runs the filament down the inline-start edge — the vertical tab.
   * `top` lays it along the top edge, for a horizontal bar.
   */
  edge?: TonalDepthFilamentEdge;
  size?: TonalDepthFilamentSize;
  /**
   * The colour this filament lights, overriding the tone's own. Any CSS
   * colour — the glow is mixed from it at the strengths in `--td-filament-*`,
   * so a custom colour still rides the same four-state ladder.
   */
  glow?: string;
}

/**
 * A tab that reports its state with a lit filament rather than a fill.
 *
 * The filament is the design system's lamp stretched along one edge: off at
 * rest, dim on hover, full when the tab is active, and brightest for the
 * moment of the press. Four states, one strip.
 *
 * The housing takes the depth ladder and the label holds its ink throughout —
 * only the filament changes colour ([[L15]]). Nothing is ever filled with the
 * tone; the colour arrives as light on the strip and, when active, as ink on
 * the glyph.
 */
export const TonalDepthFilamentButton = forwardRef<HTMLButtonElement, TonalDepthFilamentButtonProps>(function TonalDepthFilamentButton(
  { label, icon, active = false, tone = "green", edge = "start", size = "md", glow, className, type, ...props },
  ref,
) {
  const hasLabel = label !== undefined && label !== null;
  if (!hasLabel && !props["aria-label"] && !props["aria-labelledby"]) {
    // An icon-only rail button has no text node, so without one of these it
    // reaches a screen reader unnamed. Matches IconButton's contract.
    console.warn("TonalDepthFilamentButton: an icon-only button needs `aria-label` (or `aria-labelledby`), or a `label`.");
  }
  return (
    <button
      {...props}
      ref={ref}
      type={type ?? "button"}
      // `aria-pressed` is what makes the held state real for a screen reader;
      // the lit filament is only its visual half.
      aria-pressed={active}
      data-active={active ? "true" : undefined}
      style={glow ? { ...props.style, ["--td-filament-ink" as string]: glow } : props.style}
      className={cx(
        "td-registry-filament",
        `td-registry-filament--${edge}`,
        `td-registry-filament--${size}`,
        `td-registry-filament--${tone}`,
        active && "td-registry-filament--on",
        !hasLabel && "td-registry-filament--bare",
        className,
      )}
    >
      {/* Three parts, and two of them move independently — the anatomy of
          `.td-mega-option`, which is the design this component is a component
          OF ([[L33]]).

          The STRIP is the filament: it never moves or grows, it only lights.
          The ROW is one button: it takes the depth ladder and sinks as it is
          reached for. The TILE is the other: it rides ABOVE the row at rest
          and sinks with it, keeping a shadow in every state so it always reads
          as its own control inside the row — and its glyph is the lamp, which
          lights by COLOUR alone. No glow behind it: the housing never glows
          and the glyph carries no shadow. */}
      <span className="td-registry-filament-strip" aria-hidden="true" />
      {icon ? <span className="td-registry-filament-icon" aria-hidden="true">{icon}</span> : null}
      {hasLabel ? <span className="td-registry-filament-label">{label}</span> : null}
    </button>
  );
});
