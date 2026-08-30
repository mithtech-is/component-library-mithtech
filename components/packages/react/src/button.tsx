import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type CSSProperties, type DOMAttributes, type ReactNode, type Ref } from "react";
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

interface ButtonOwnProps {
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
  /**
   * Renders an `<a>` instead of a `<button>`, with the same housing, the same
   * lamp and the same ladder. Every primary call to action on a marketing page
   * is a link, and without this the consumer hand-writes an
   * `<a className="td-primary">` with its own `<span className="td-lamp">`
   * inside — the design system's primary control, reimplemented at the call
   * site ([[L16]]).
   *
   * `type` is not emitted on the anchor. A **disabled** or **loading** link
   * falls back to `<button disabled>` — see the component's own doc comment.
   */
  href?: string;
  /**
   * Hand your router the anchor. Given the class and the href, return the
   * element. Without it every call to action is a document load.
   *
   * Only `className`, `href`, `style` and `children` reach it, the same four
   * `SocialButton` passes — `target`, `rel`, `onClick` and the `aria-*` you
   * gave the Button do **not**. Put those on your own element. `style` carries
   * the `glow` colour, so spread it or the lamp lights the variant's colour
   * instead of yours.
   *
   * Ignored without `href`, and ignored when the link is disabled or loading:
   * a router link that cannot be followed is worse than no link.
   */
  renderLink?: (props: { className: string; href: string; style?: CSSProperties; children: ReactNode }) => ReactNode;
}

/**
 * Everything native passes through, from both elements — `onClick`, `form`,
 * `name` and `value` from the button, `target`, `rel` and `download` from the
 * anchor. `type` comes from the button alone, so the anchor cannot be given
 * one.
 *
 * The EVENT HANDLERS come from the button alone too, and that is deliberate.
 * Intersecting the two sets gives `onClick` the type
 * `MouseEventHandler<HTMLButtonElement> & MouseEventHandler<HTMLAnchorElement>`,
 * which nothing can satisfy: a handler already written against
 * `MouseEvent<HTMLButtonElement>` — every one in this package, and every one a
 * consumer has — stops type-checking the moment `href` is added to the props.
 * A handler that needs the anchor reads `event.currentTarget` as an
 * `HTMLElement` and casts, which is one caller's problem rather than everyone's.
 */
export type ButtonProps = ButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonOwnProps | "type" | keyof DOMAttributes<HTMLAnchorElement>>;

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
 * `primary` and `filled` — the two buttons that carry the weight of a screen.
 * The design system draws its primary button with the lamp in every example it
 * ships, so requiring `dot` to get one made the library's primary button a
 * different object from the system's; and the papaya fill is the loudest thing
 * the system says, so it gets the same lamp rather than being the one emphatic
 * control with nothing reporting its state.
 *
 * On the fill the lamp lights white, because papaya on papaya is invisible —
 * that pairing is in `button.css` and is why the fill needs no lamp colour of
 * its own.
 */
const LAMP_BY_DEFAULT: ButtonVariant[] = ["primary", "filled"];

/**
 * The default control for any action — and, with `href`, for any action that
 * is a navigation.
 *
 * **A disabled or loading link renders as `<button disabled>`, not as an
 * anchor.** `disabled` is not something HTML gives an `<a>`, and the whole
 * disabled ladder this system ships — the flattened housing, the dead lamp,
 * the suppressed hover — is written at `:disabled`, which an anchor can never
 * match. An `<a aria-disabled="true">` would therefore keep the full lit press
 * ladder and read as pressable while doing nothing, which is the worse of the
 * two failures. The button form is genuinely unfocusable and unactivatable and
 * already carries every one of those rules. `renderLink` is not called in that
 * state for the same reason.
 *
 * The ref is a UNION of the two elements, not the intersection `IconButton`
 * and `SocialButton` use. An intersection is what you want to hand to a `<a>`
 * and a `<button>` internally, but it is the wrong thing to ASK a caller for:
 * `Ref<HTMLButtonElement>` — which is what every wrapper in this package and
 * every consumer already holds — is not assignable to
 * `Ref<HTMLButtonElement & HTMLAnchorElement>`, so adding `href` to this
 * component would have broken `ConfirmButton` and everything like it. The
 * union accepts both and costs one cast at each element instead.
 */
export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    loading = false,
    loadingLabel = "Loading",
    leading,
    dot,
    glow,
    trailing,
    href,
    renderLink,
    disabled,
    className,
    children,
    type,
    ...props
  },
  ref,
) {
  const showDot = dot ?? LAMP_BY_DEFAULT.includes(variant);
  const inert = disabled || loading;
  const classes = cx("td-react-button", baseClass[variant], `td-react-button--${size}`, `td-react-button--${variant}`, className);
  const style = glow ? { ...props.style, ["--td-lamp-glow" as string]: glow } : props.style;
  const content = (
    <>
      {loading ? <span className="td-react-spinner" aria-hidden="true" /> : null}
      {!loading && showDot ? <span className="td-lamp" aria-hidden="true" /> : null}
      {!loading && (leading ?? defaultLeading[variant])
        ? <span className="td-react-button-lamp" aria-hidden="true">{leading ?? defaultLeading[variant]}</span>
        : null}
      <span className={FILLED.includes(variant) ? "td-coloured-label" : "td-primary-label"}>
        {loading ? loadingLabel : children}
      </span>
      {!loading && trailing}
    </>
  );

  if (href !== undefined && !inert) {
    if (renderLink) return <>{renderLink({ className: classes, href, style, children: content })}</>;
    /* The rest props are typed against the button — see `ButtonProps` — so the
       handlers among them are `…EventHandler<HTMLButtonElement>`. They are the
       same handlers either way; only the element in `currentTarget` differs. */
    const anchorProps = props as unknown as AnchorHTMLAttributes<HTMLAnchorElement>;
    return <a {...anchorProps} ref={ref as Ref<HTMLAnchorElement>} href={href} className={classes} style={style}>{content}</a>;
  }

  return (
    <button
      {...props}
      ref={ref as Ref<HTMLButtonElement>}
      type={type ?? "button"}
      disabled={inert}
      aria-busy={loading || undefined}
      style={style}
      className={classes}
    >
      {content}
    </button>
  );
});
