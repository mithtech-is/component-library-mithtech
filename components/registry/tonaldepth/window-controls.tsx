import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type SVGProps } from "react";
import "./tonaldepth-window-controls.css";

const LAMP_WEIGHT = "fill" as const;

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * TonalDepth's own glyphs, copied in because a registry item is one
 * self-contained file. Filled and colour-neutral by construction, so the
 * component's lamp ladder moves them through `currentColor`.
 */
interface TdIconProps extends SVGProps<SVGSVGElement> {
  /** Edge length. `1em` so the glyph scales with the type it sits beside. */
  size?: number | string;
  /** The fill. `currentColor` so the lamp ramp can move it. */
  color?: string;
  /**
   * Accepted so a TD glyph is a drop-in at a call site passing
   * `weight={LAMP_WEIGHT}`. TD glyphs are filled by construction, so there is
   * nothing to switch — the prop is swallowed rather than forwarded, because
   * `weight` is not an SVG attribute and React would put it on the DOM.
   */
  weight?: string;
  /** Flip horizontally, matching Phosphor's prop of the same name. */
  mirrored?: boolean;
}

/** `fillRule` comes from `SVGProps`; pass `evenodd` where the artwork knocks a
 *  hole out of its own outline. */
interface TdGlyphProps extends TdIconProps {
  viewBox: string;
  d: string;
}

function TdGlyph({ viewBox, d, fillRule, size = "1em", color = "currentColor", weight, mirrored, ...props }: TdGlyphProps) {
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
      <path d={d} fillRule={fillRule} />
    </svg>
  );
}

// A bare cross, drawn as one filled polygon: two 40-unit bars crossing at the
// centre, tips at 30.4/225.6. Not a stroked path — the set is filled by
// construction, and a stroke cannot carry the lamp's glow.
const CLOSE = "M58.7,225.6 30.4,197.3 99.7,128 30.4,58.7 58.7,30.4 128,99.7 197.3,30.4 225.6,58.7 156.3,128 225.6,197.3 197.3,225.6 128,156.3Z";

// The bar inside a window's minimise disc. Phosphor's `Minus` at `fill` is a
// square plate with the bar knocked out of it, and at the 6px a traffic light
// draws its mark that reads as a filled square, not a dash.
/* The minimise dash. Shorter and half again as thick as a typographic minus:
   this is drawn at roughly 9px inside a 14px disc, and at that size a 32-unit
   bar on a 256 grid resolves to about one physical pixel — a hairline that
   disappears against a saturated fill. 44 units reads as a mark. */
const MINUS_BAR = "M50,106H206a22,22,0,0,1,0,44H50a22,22,0,0,1,0-44Z";

// The zoom mark: two corner triangles pointing away from each other, which is
// what macOS draws in the green disc. Two subpaths in one fill — the hypotenuse
// of each faces the centre, so the pair reads as an arrow head in each corner
// rather than as a bowtie.
//
// The legs are 116 units of 256 rather than 96. Two small triangles separated
// by a wide diagonal gutter read as specks at this size; growing them until
// the gutter is a stroke rather than a void makes the pair read as one
// diagonal gesture, which is what the mark means.
const EXPAND_CORNERS = "M30,30H146L30,146ZM226,226H110L226,110Z";

/**
 * The dismiss mark. A bare cross.
 *
 * Phosphor's `X` cannot be used: at `fill` weight a stroke-only glyph renders
 * as a filled square PLATE with the mark knocked out of it. Its `XCircle` —
 * which this replaces — is a solid disc, and at the 13px a dismiss control
 * uses that reads as a hole punched in the surface rather than as a mark on
 * it, which is the one move the system forbids. The bar and the disc were
 * also the same glyph as CancelIcon, so dismissing a panel and refusing an
 * action looked identical.
 */
function TdClose(props: TdIconProps) {
  return <TdGlyph viewBox="0 0 256 256" d={CLOSE} {...props} />;
}

/** The minimise bar, for a window's amber disc. */
function TdMinus(props: TdIconProps) {
  return <TdGlyph viewBox="0 0 256 256" d={MINUS_BAR} {...props} />;
}

/** The zoom mark, for a window's green disc: a triangle in each far corner. */
function TdExpandCorners(props: TdIconProps) {
  return <TdGlyph viewBox="0 0 256 256" d={EXPAND_CORNERS} {...props} />;
}

const CloseIcon = TdClose;
const WindowMinimiseIcon = TdMinus;
const WindowZoomIcon = TdExpandCorners;

/**
 * How large the discs are drawn.
 *
 * `md` is 14px, for a window chrome the reader is meant to reach for. `sm` is
 * 11px, for a specimen or a card-sized frame where a full-size cluster
 * out-shouts the title beside it.
 *
 * Both are a step above macOS's own 12px, and the mark inside is 0.64 of the
 * disc rather than 0.52. The platform can afford a smaller mark because it is
 * drawn by the compositor at the device's true resolution and its meaning is
 * already known to everyone using it; a mark in a component library is drawn
 * at whatever the page's scale happens to be, and it is the only thing telling
 * the three discs apart for a reader who cannot use the colour. At the old
 * ratio it came out around 6px, which is below the size a glyph on a 256 grid
 * keeps its shape at.
 */
export type TonalDepthWindowControlsSize = "sm" | "md";

/** The accessible names, so the cluster can speak a language other than English. */
export interface TonalDepthWindowControlsLabels {
  close: string;
  minimise: string;
  maximise: string;
}

export interface TonalDepthWindowControlsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  onClose?: () => void;
  onMinimise?: () => void;
  onMaximise?: () => void;
  /**
   * Whether the window this belongs to has focus. `true` by default.
   *
   * An unfocused window's discs go grey — the same three shapes in the same
   * three places, drained of colour. That is the platform's own behaviour and
   * it is also the honest one: the actions have not gone away, the window has
   * merely stopped being the one you are working in.
   */
  focused?: boolean;
  size?: TonalDepthWindowControlsSize;
  labels?: TonalDepthWindowControlsLabels;
  /** Names the cluster for a screen reader landing on it as a group. */
  label?: string;
}

const TonalDepthDEFAULT_LABELS: TonalDepthWindowControlsLabels = { close: "Close", minimise: "Minimise", maximise: "Maximise" };

interface TonalDepthDotProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind: "close" | "minimise" | "maximise";
}

function TonalDepthDot({ kind, ...props }: TonalDepthDotProps) {
  const Glyph = kind === "close" ? CloseIcon : kind === "minimise" ? WindowMinimiseIcon : WindowZoomIcon;
  return (
    <button
      {...props}
      type="button"
      className={cx("td-registry-windowcontrols-dot", `td-registry-windowcontrols-dot--${kind}`)}
    >
      <span className="td-registry-windowcontrols-mark" aria-hidden="true">
        <Glyph weight={LAMP_WEIGHT} />
      </span>
    </button>
  );
}

/**
 * The three window actions, as the traffic lights: close, minimise, maximise,
 * left to right.
 *
 * There was no component for this, so every consumer drew its own — its own
 * maximise glyph, reached for from whatever icon set was to hand, and its own
 * three colours picked off a screenshot. Three hardcoded hex values in a
 * consumer's stylesheet are three values that will not follow the system
 * anywhere, and a maximise mark drawn from an outline set renders as an empty
 * disc inside this library's round buttons ([[L15]]).
 *
 * **The colours are literals on purpose, and they are the only ones in the
 * library that are.** `#FF5F57` / `#FEBC2E` / `#28C840` are the platform's,
 * the way WhatsApp's green is WhatsApp's — an identity the system reports
 * rather than a colour it chooses, so they must not move when the brand does.
 * `Terminal` draws the same three as decoration in its head; this is the
 * interactive one, and a cluster that DOES something is a row of buttons.
 *
 * **Omitting a handler disables that disc, it does not remove it.** The three
 * lights are a shape people recognise by its silhouette, and a cluster that is
 * sometimes two wide and sometimes three reflows the title beside it. A window
 * that cannot be minimised shows a minimise disc that cannot be pressed, which
 * is what every platform does.
 *
 * The marks appear on hover of the CLUSTER, not of the disc under the pointer
 * — reaching for one light lights all three, so the reader can see what they
 * are aiming at before they commit. Each disc is a real `<button>` with a real
 * accessible name, so the colour is never the only thing carrying which is
 * which; under `forced-colors` the marks are drawn permanently, because there
 * the fills are the system's and no longer tell the three apart.
 */
export const TonalDepthWindowControls = forwardRef<HTMLDivElement, TonalDepthWindowControlsProps>(function TonalDepthWindowControls(
  { onClose, onMinimise, onMaximise, focused = true, size = "md", labels = TonalDepthDEFAULT_LABELS, label = "Window controls", className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      role="group"
      aria-label={label}
      data-focused={focused ? "true" : "false"}
      className={cx("td-registry-windowcontrols", `td-registry-windowcontrols--${size}`, className)}
    >
      <TonalDepthDot kind="close" aria-label={labels.close} onClick={onClose} disabled={!onClose} />
      <TonalDepthDot kind="minimise" aria-label={labels.minimise} onClick={onMinimise} disabled={!onMinimise} />
      <TonalDepthDot kind="maximise" aria-label={labels.maximise} onClick={onMaximise} disabled={!onMaximise} />
    </div>
  );
});
