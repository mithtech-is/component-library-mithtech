import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import { AcceptIcon, CallIcon, CancelIcon, EmailIcon, LAMP_WEIGHT, WhatsAppIcon } from "./icons";
import "./button.css";

export type ButtonVariant =
  // Emphasis. `primary` is the design system's own primary button: the surface
  // housing with the lamp. `filled` is the papaya fill, which the system
  // reserves rather than reaches for ([[L11]]).
  | "primary" | "secondary" | "filled" | "outline" | "ghost" | "link"
  // Semantic — the fill carries the meaning
  | "destructive" | "accept" | "cancel" | "accent"
  // Channel — the lamp carries the meaning ([[L15]])
  | "whatsapp" | "whatsapp-quiet" | "call" | "email";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
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
 * Default marks for the semantic variants, so `<Button variant="accept">Approve</Button>`
 * is complete on its own. Pass `leading` to override any of them.
 *
 * `fill` weight, not by preference: a leading icon is a lamp, and a glow
 * traces the alpha edge of what it lights — an outline glyph glows as a
 * hollow outline and reads as a smudge. See icons.tsx.
 */
const defaultLeading: Partial<Record<ButtonVariant, ReactNode>> = {
  accept: <AcceptIcon weight={LAMP_WEIGHT} />,
  cancel: <CancelIcon weight={LAMP_WEIGHT} />,
  whatsapp: <WhatsAppIcon weight={LAMP_WEIGHT} />,
  "whatsapp-quiet": <WhatsAppIcon weight={LAMP_WEIGHT} />,
  call: <CallIcon weight={LAMP_WEIGHT} />,
  email: <EmailIcon weight={LAMP_WEIGHT} />,
};

const baseClass: Record<ButtonVariant, string> = {
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
const FILLED: ButtonVariant[] = ["filled", "destructive", "accept", "cancel", "accent", "whatsapp"];

/**
 * The variants that carry the status lamp unless told otherwise.
 *
 * Only `primary`. The design system draws its primary button with the lamp in
 * every example it ships, so requiring `dot` to get one made the library's
 * primary button a different object from the system's.
 */
const LAMP_BY_DEFAULT: ButtonVariant[] = ["primary"];

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
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
  const showDot = dot ?? LAMP_BY_DEFAULT.includes(variant);
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      style={glow ? { ...props.style, ["--td-lamp-glow" as string]: glow } : props.style}
      className={cx("td-react-button", baseClass[variant], `td-react-button--${size}`, `td-react-button--${variant}`, className)}
    >
      {loading ? <span className="td-react-spinner" aria-hidden="true" /> : null}
      {!loading && showDot ? <span className="td-lamp" aria-hidden="true" /> : null}
      {!loading && (leading ?? defaultLeading[variant])
        ? <span className="td-react-button-lamp" aria-hidden="true">{leading ?? defaultLeading[variant]}</span>
        : null}
      <span className={FILLED.includes(variant) ? "td-coloured-label" : "td-primary-label"}>
        {loading ? loadingLabel : children}
      </span>
      {!loading && trailing}
    </button>
  );
});
