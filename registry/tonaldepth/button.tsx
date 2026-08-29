import { forwardRef, type ButtonHTMLAttributes, type ReactNode, type SVGProps } from "react";
import { PhoneIcon as CallIcon, EnvelopeSimpleIcon as EmailIcon } from "@phosphor-icons/react";
import "./tonaldepth-button.css";

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

const CHECK_FAT = "M243.31,90.91l-128.4,128.4a16,16,0,0,1-22.62,0l-71.62-72a16,16,0,0,1,0-22.61l20-20a16,16,0,0,1,22.58,0L104,144.22l96.76-95.57a16,16,0,0,1,22.59,0l19.95,19.54A16,16,0,0,1,243.31,90.91Z";

const CANCEL = "M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12ZM16.1716 14.7574C16.6951 13.967 17 13.0191 17 12C17 9.23858 14.7614 7 12 7C10.9809 7 10.033 7.30488 9.24261 7.8284L16.1716 14.7574ZM7.8284 9.24261L14.7574 16.1716C13.967 16.6951 13.0191 17 12 17C9.23858 17 7 14.7614 7 12C7 10.9809 7.30488 10.033 7.8284 9.24261ZM12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5Z";

const WHATSAPP = "M12,2 C6.47715,2 2,6.47715 2,12 C2,13.8896 2.52505,15.6594 3.43756,17.1683 L2.54581,20.2002 C2.32023,20.9672 3.03284,21.6798 3.79975,21.4542 L6.83171,20.5624 C8.34058,21.475 10.1104,22 12,22 C17.5228,22 22,17.5228 22,12 C22,6.47715 17.5228,2 12,2 Z M9.73821,14.2627 C11.7607,16.2852 13.692,16.5518 14.3739,16.5769 C15.4111,16.6151 16.421,15.823 16.8147,14.9042 C16.9112,14.6792 16.8871,14.4085 16.7255,14.2014 C16.1782,13.5005 15.4373,12.9983 14.7134,12.4984 C14.4006,12.282 13.9705,12.349 13.7401,12.6555 L13.1394,13.5706 C13.0727,13.6721 12.9402,13.707 12.8348,13.6467 C12.4283,13.4143 11.8356,13.018 11.4092,12.5916 C10.9833,12.1657 10.6111,11.5998 10.4022,11.2195 C10.3473,11.1195 10.3777,10.996 10.4692,10.928 L11.3927,10.2422 C11.6681,10.0038 11.7165,9.59887 11.5138,9.30228 C11.065,8.64569 10.5422,7.8112 9.7855,7.25926 C9.57883,7.1085 9.3174,7.09158 9.10155,7.18408 C8.1817,7.5783 7.38574,8.58789 7.42398,9.62695 C7.44908,10.3089 7.71572,12.2402 9.73821,14.2627 Z";

/** The accept mark. A bare fat tick — Phosphor's circled check read as a badge. */
function TdCheckFat(props: TdIconProps) {
  return <TdGlyph viewBox="0 0 256 256" d={CHECK_FAT} {...props} />;
}

/** The cancel mark: a solid ring with the bar carved out of the disc inside it. */
function TdCancel(props: TdIconProps) {
  return <TdGlyph viewBox="0 0 24 24" d={CANCEL} fillRule="evenodd" {...props} />;
}

/** WhatsApp. The handset is knocked out of the bubble, so the fill rule matters. */
function TdWhatsApp(props: TdIconProps) {
  return <TdGlyph viewBox="0 0 24 24" d={WHATSAPP} fillRule="evenodd" {...props} />;
}

const AcceptIcon = TdCheckFat;
const CancelIcon = TdCancel;
const WhatsAppIcon = TdWhatsApp;

export type TonalDepthButtonVariant =
  // Emphasis. `primary` is the design system's own primary button: the surface
  // housing with the lamp. `filled` is the papaya fill, which the system
  // reserves rather than reaches for ([[L11]]).
  | "primary" | "secondary" | "filled" | "outline" | "ghost" | "link"
  // Semantic — the fill carries the meaning
  | "destructive" | "accept" | "cancel" | "accent"
  // Channel — the lamp carries the meaning ([[L15]])
  | "whatsapp" | "whatsapp-quiet" | "call" | "email";

export type TonalDepthButtonSize = "sm" | "md" | "lg";

export interface TonalDepthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TonalDepthButtonVariant;
  size?: TonalDepthButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  /**
   * The lamp. A leading icon carries the button's state — unlit at rest, lit
   * on hover, brighter on press — while the label holds its ink throughout
   * ([[L15]]). Pass a Phosphor icon at `fill` weight; an outline cannot read
   * as a lit filament.
   */
  leading?: ReactNode;
  /** Directional marks (a chevron, an arrow). Not a lamp — it does not signal state. */
  trailing?: ReactNode;
  /**
   * The small status lamp — a 7px disc that sits before the label, grey glass
   * at rest and lit on hover and press.
   *
   * **On by default for `primary` and off for everything else**, because the
   * lamp is what a primary button *is* in this design system — every example
   * in `01-buttons/primary` carries one. Pass `dot={false}` to drop it, or
   * `dot` to add it to any other variant that reports a live state.
   */
  dot?: boolean;
  /**
   * The colour this button's lamp lights, overriding the variant's own. Any
   * CSS colour. The glow is mixed from it at the strengths in
   * `--td-glow-*`, so a custom colour still rides the same ladder.
   */
  glow?: string;
}

/**
 * Default marks for the semantic variants, so `<TonalDepthButton variant="accept">Approve</TonalDepthButton>`
 * is complete on its own. Pass `leading` to override any of them.
 *
 * `fill` weight, not by preference: a leading icon is a lamp, and a glow
 * traces the alpha edge of what it lights — an outline glyph glows as a
 * hollow outline and reads as a smudge. See icons.tsx.
 */
const TonalDepthdefaultLeading: Partial<Record<TonalDepthButtonVariant, ReactNode>> = {
  accept: <AcceptIcon weight={LAMP_WEIGHT} />,
  cancel: <CancelIcon weight={LAMP_WEIGHT} />,
  whatsapp: <WhatsAppIcon weight={LAMP_WEIGHT} />,
  "whatsapp-quiet": <WhatsAppIcon weight={LAMP_WEIGHT} />,
  call: <CallIcon weight={LAMP_WEIGHT} />,
  email: <EmailIcon weight={LAMP_WEIGHT} />,
};

const TonalDepthbaseClass: Record<TonalDepthButtonVariant, string> = {
  primary: "td-primary",
  secondary: "td-primary",
  filled: "td-coloured",
  outline: "td-primary",
  ghost: "td-primary",
  link: "td-primary",
  destructive: "td-coloured",
  accept: "td-coloured",
  cancel: "td-coloured",
  accent: "td-coloured",
  whatsapp: "td-coloured",
  "whatsapp-quiet": "td-primary",
  call: "td-primary",
  email: "td-primary",
};

/** Which variants carry a filled housing, and so a white label and lamp. */
const TonalDepthFILLED: TonalDepthButtonVariant[] = ["filled", "destructive", "accept", "cancel", "accent", "whatsapp"];

/**
 * The variants that carry the status lamp unless told otherwise.
 *
 * Only `primary`. The design system draws its primary button with the lamp in
 * every example it ships, so requiring `dot` to get one made the library's
 * primary button a different object from the system's.
 */
const TonalDepthLAMP_BY_DEFAULT: TonalDepthButtonVariant[] = ["primary"];

export const TonalDepthButton = forwardRef<HTMLButtonElement, TonalDepthButtonProps>(function TonalDepthButton(
  {
    variant = "secondary",
    size = "md",
    loading = false,
    loadingLabel = "Loading",
    leading,
    dot,
    glow,
    trailing,
    disabled,
    className,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  const showDot = dot ?? TonalDepthLAMP_BY_DEFAULT.includes(variant);
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      style={glow ? { ...props.style, ["--td-lamp-glow" as string]: glow } : props.style}
      className={cx("td-registry-button", TonalDepthbaseClass[variant], `td-registry-button--${size}`, `td-registry-button--${variant}`, className)}
    >
      {loading ? <span className="td-registry-spinner" aria-hidden="true" /> : null}
      {!loading && showDot ? <span className="td-lamp" aria-hidden="true" /> : null}
      {!loading && (leading ?? TonalDepthdefaultLeading[variant])
        ? <span className="td-registry-button-lamp" aria-hidden="true">{leading ?? TonalDepthdefaultLeading[variant]}</span>
        : null}
      <span className={TonalDepthFILLED.includes(variant) ? "td-coloured-label" : "td-primary-label"}>
        {loading ? loadingLabel : children}
      </span>
      {!loading && trailing}
    </button>
  );
});
