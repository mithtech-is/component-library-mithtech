import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./icon-button.css";

/**
 * The lamp's colour. `neutral` is the surface button whose lamp lights green;
 * `papaya`/`azure`/`invert` are filled housings whose lamp lights white; the
 * channel tones carry each platform's own fill.
 *
 * Every channel also has a `-quiet` form: a surface housing — carved, not
 * filled — whose lamp lights that platform's own colour. That is the form a
 * footer's social row wants, and a row of solid platform-coloured discs is
 * the one thing the system does not do ([[L11]]).
 */
export type IconButtonTone =
  | "neutral" | "papaya" | "azure" | "invert"
  | "whatsapp" | "facebook" | "instagram" | "x" | "linkedin" | "youtube"
  | "whatsapp-quiet" | "facebook-quiet" | "instagram-quiet" | "x-quiet" | "linkedin-quiet" | "youtube-quiet";

const tones: Record<IconButtonTone, string> = {
  neutral: "",
  papaya: "td-glowicon--papaya",
  azure: "td-glowicon--azure",
  invert: "td-glowicon--invert",
  whatsapp: "td-glowicon--wa",
  "whatsapp-quiet": "td-glowicon--wa-inv",
  facebook: "td-glowicon--fb",
  instagram: "td-glowicon--ig",
  x: "td-glowicon--x",
  linkedin: "td-glowicon--li",
  youtube: "td-glowicon--yt",
  "facebook-quiet": "td-glowicon--fb-inv",
  "instagram-quiet": "td-glowicon--ig-inv",
  "x-quiet": "td-glowicon--x-inv",
  "linkedin-quiet": "td-glowicon--li-inv",
  "youtube-quiet": "td-glowicon--yt-inv",
};

interface IconButtonOwnProps {
  /** The lamp. Must be a filled glyph — an outline cannot read as a lit filament. */
  icon: ReactNode;
  /** Present turns the round button into a pill. The label holds its ink in every state. */
  label?: ReactNode;
  tone?: IconButtonTone;
  /** Renders an anchor instead of a button. */
  href?: string;
  /**
   * The colour this lamp lights, overriding the tone's own. Any CSS colour —
   * the glow is mixed from it at the strengths in `--td-glow-*`, so a custom
   * colour still rides the same ladder.
   */
  glow?: string;
}

export type IconButtonProps = IconButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "href">;

export const IconButton = forwardRef<HTMLButtonElement & HTMLAnchorElement, IconButtonProps>(
  function IconButton({ icon, label, tone = "neutral", href, glow, className, type, ...props }, ref) {
    // `0` is a legitimate label, so presence is checked rather than truthiness.
    const hasLabel = label !== undefined && label !== null;
    if (!hasLabel && !props["aria-label"] && !props["aria-labelledby"]) {
      // An icon-only control has no text node, so without one of these it
      // reaches a screen reader as an unnamed button. Unconditional rather than
      // dev-only: it only fires on a real defect, and the package carries no
      // build-time environment flag to gate it on.
      console.warn("IconButton: an icon-only button needs `aria-label` (or `aria-labelledby`), or a `label`.");
    }
    const classes = cx("td-glowicon", "td-react-iconbutton", tones[tone], hasLabel && "td-glowicon--text", className);
    const style = glow ? { ...props.style, ["--td-lamp-glow" as string]: glow } : props.style;
    const content = (
      <>
        <span className="td-react-iconbutton-lamp" aria-hidden="true">{icon}</span>
        {hasLabel ? <span className="td-glowicon-label">{label}</span> : null}
      </>
    );
    if (href !== undefined) {
      return <a {...props} ref={ref} href={href} className={classes} style={style}>{content}</a>;
    }
    return (
      <button {...props} ref={ref} type={type ?? "button"} className={classes} style={style}>
        {content}
      </button>
    );
  },
);
