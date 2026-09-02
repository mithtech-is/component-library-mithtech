import { type SVGProps } from "react";

/**
 * The TD icon set — the library's own glyphs, drawn here rather than taken
 * from Phosphor.
 *
 * TonalDepth is a Phosphor-first system and stays one. This module is the
 * override: where Phosphor has no glyph for a role, or where the one it has
 * reads badly at the size the system uses it, the role is drawn here and
 * `icons.ts` resolves it from TD instead. Everything TD does not define keeps
 * falling through to Phosphor, which remains the fallback for the whole set.
 *
 * ## Filled, always
 *
 * A glyph in here is a solid mark. The lamp pattern ([[L15]]) makes the icon
 * carry a control's whole state through its colour and a `drop-shadow` glow,
 * and a glow traces the alpha edge of what it lights — an outline glyph glows
 * as a hollow outline and reads as a smudge rather than a lit filament.
 *
 * ## Colour neutral, always
 *
 * Source artwork arrives with hardcoded fills — `#222222` on the cancel mark,
 * `#09244B` on the WhatsApp one. Every one of them is stripped to
 * `currentColor` on the way in. A glyph that keeps its own colour cannot be
 * moved by the lamp ramp, and it stops being a UI icon the moment the theme
 * changes under it.
 *
 * ## Adding one
 *
 * Add the glyph here, then point its role name at it in `icons.ts`. The
 * component takes Phosphor's prop shape — `size`, `color`, `weight`,
 * `mirrored` — so a TD glyph drops into a call site that was rendering a
 * Phosphor one without the call site knowing.
 */

export interface TdIconProps extends SVGProps<SVGSVGElement> {
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

/* A rating star. Phosphor has one, but the set needs it filled and solid at
   14px, where Phosphor's reads as an outline with a pinched centre. */
const STAR = "M239.2 97.4A16.4 16.4 0 0 0 224.6 86l-59.5-4.3l-22.9-55.5a16.4 16.4 0 0 0-30.4 0L88.9 81.7L29.4 86a16.4 16.4 0 0 0-9.3 28.8l45.5 39.4l-13.9 58.1a16.4 16.4 0 0 0 24.5 17.8l51-31.1l51 31.1a16.4 16.4 0 0 0 24.5-17.8l-13.9-58.1l45.5-39.4a16.4 16.4 0 0 0 4.9-17.4Z";

const CHECK_FAT = "M243.31,90.91l-128.4,128.4a16,16,0,0,1-22.62,0l-71.62-72a16,16,0,0,1,0-22.61l20-20a16,16,0,0,1,22.58,0L104,144.22l96.76-95.57a16,16,0,0,1,22.59,0l19.95,19.54A16,16,0,0,1,243.31,90.91Z";

const CANCEL = "M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12ZM16.1716 14.7574C16.6951 13.967 17 13.0191 17 12C17 9.23858 14.7614 7 12 7C10.9809 7 10.033 7.30488 9.24261 7.8284L16.1716 14.7574ZM7.8284 9.24261L14.7574 16.1716C13.967 16.6951 13.0191 17 12 17C9.23858 17 7 14.7614 7 12C7 10.9809 7.30488 10.033 7.8284 9.24261ZM12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5Z";

// A bare cross, drawn as one filled polygon: two 40-unit bars crossing at the
// centre, tips at 30.4/225.6. Not a stroked path — the set is filled by
// construction, and a stroke cannot carry the lamp's glow.
const CLOSE = "M58.7,225.6 30.4,197.3 99.7,128 30.4,58.7 58.7,30.4 128,99.7 197.3,30.4 225.6,58.7 156.3,128 225.6,197.3 197.3,225.6 128,156.3Z";

// The bar inside a window's minimise disc. Phosphor's `Minus` at `fill` is a
// square plate with the bar knocked out of it, and at the 6px a traffic light
// draws its mark that reads as a filled square, not a dash.
const MINUS_BAR = "M44,112H212a16,16,0,0,1,0,32H44a16,16,0,0,1,0-32Z";

// The zoom mark: two corner triangles pointing away from each other, which is
// what macOS draws in the green disc. Two subpaths in one fill — the hypotenuse
// of each faces the centre, so the pair reads as an arrow head in each corner
// rather than as a bowtie.
const EXPAND_CORNERS = "M36,36H132L36,132ZM220,220H124L220,124Z";

const WHATSAPP = "M12,2 C6.47715,2 2,6.47715 2,12 C2,13.8896 2.52505,15.6594 3.43756,17.1683 L2.54581,20.2002 C2.32023,20.9672 3.03284,21.6798 3.79975,21.4542 L6.83171,20.5624 C8.34058,21.475 10.1104,22 12,22 C17.5228,22 22,17.5228 22,12 C22,6.47715 17.5228,2 12,2 Z M9.73821,14.2627 C11.7607,16.2852 13.692,16.5518 14.3739,16.5769 C15.4111,16.6151 16.421,15.823 16.8147,14.9042 C16.9112,14.6792 16.8871,14.4085 16.7255,14.2014 C16.1782,13.5005 15.4373,12.9983 14.7134,12.4984 C14.4006,12.282 13.9705,12.349 13.7401,12.6555 L13.1394,13.5706 C13.0727,13.6721 12.9402,13.707 12.8348,13.6467 C12.4283,13.4143 11.8356,13.018 11.4092,12.5916 C10.9833,12.1657 10.6111,11.5998 10.4022,11.2195 C10.3473,11.1195 10.3777,10.996 10.4692,10.928 L11.3927,10.2422 C11.6681,10.0038 11.7165,9.59887 11.5138,9.30228 C11.065,8.64569 10.5422,7.8112 9.7855,7.25926 C9.57883,7.1085 9.3174,7.09158 9.10155,7.18408 C8.1817,7.5783 7.38574,8.58789 7.42398,9.62695 C7.44908,10.3089 7.71572,12.2402 9.73821,14.2627 Z";

/** The accept mark. A bare fat tick — Phosphor's circled check read as a badge. */
export function TdStar(props: TdIconProps) {
  return <TdGlyph viewBox="0 0 256 256" d={STAR} {...props} />;
}

export function TdCheckFat(props: TdIconProps) {
  return <TdGlyph viewBox="0 0 256 256" d={CHECK_FAT} {...props} />;
}

/** The cancel mark: a solid ring with the bar carved out of the disc inside it. */
export function TdCancel(props: TdIconProps) {
  return <TdGlyph viewBox="0 0 24 24" d={CANCEL} fillRule="evenodd" {...props} />;
}

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
export function TdClose(props: TdIconProps) {
  return <TdGlyph viewBox="0 0 256 256" d={CLOSE} {...props} />;
}

/** The minimise bar, for a window's amber disc. */
export function TdMinus(props: TdIconProps) {
  return <TdGlyph viewBox="0 0 256 256" d={MINUS_BAR} {...props} />;
}

/** The zoom mark, for a window's green disc: a triangle in each far corner. */
export function TdExpandCorners(props: TdIconProps) {
  return <TdGlyph viewBox="0 0 256 256" d={EXPAND_CORNERS} {...props} />;
}

/** WhatsApp. The handset is knocked out of the bubble, so the fill rule matters. */
export function TdWhatsApp(props: TdIconProps) {
  return <TdGlyph viewBox="0 0 24 24" d={WHATSAPP} fillRule="evenodd" {...props} />;
}
