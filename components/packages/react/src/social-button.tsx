"use client";

import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import { cx } from "./utils";
import { XLogo, LinkedInLogo, GitHubLogo, GitLabLogo, YouTubeLogo, InstagramLogo, FacebookLogo, ThreadsLogo, WhatsAppLogo, TelegramLogo, DiscordLogo, SlackLogo, MastodonLogo, BlueskyLogo, MediumLogo, DribbbleLogo, BehanceLogo, RedditLogo } from "./td-brands";
import "./social-button.css";

/**
 * The platforms, and the colours their housings take.
 *
 * The MARKS are not drawn here — they live in `td-brands`, with every other
 * logo the library draws, and are pulled in by name. A component drawing its
 * own `<svg>` would be a second glyph set to keep current. Named imports
 * rather than the `BrandLogo` resolver, so a registry item carries the
 * eighteen marks it uses and not the three client marks it does not.
 *
 * The hexes are Simple Icons\' (simpleicons.org), which is the published source
 * for these and tracks the owners\' current marks — the set in `packages/core`
 * predates it and had drifted (Facebook still on the 2019 blue, Instagram on
 * the pre-2022 pink). The icons are CC0; the marks themselves remain their
 * owners\' trademarks, so do not restyle one past the inversions its owner
 * publishes.
 *
 * `dark` is that inversion, and only the marks whose brand colour is pure or
 * near black carry one: a black chip on a dark page is a hole, and every one
 * of them publishes white-on-black as the sanctioned alternative.
 */
const NETWORKS = {
  x: { title: "X", color: "#000000", Mark: XLogo, dark: "#FFFFFF", darkInk: "#000000" },
  linkedin: { title: "LinkedIn", color: "#0A66C2", Mark: LinkedInLogo },
  github: { title: "GitHub", color: "#181717", Mark: GitHubLogo, dark: "#FFFFFF", darkInk: "#181717" },
  gitlab: { title: "GitLab", color: "#FC6D26", Mark: GitLabLogo },
  youtube: { title: "YouTube", color: "#FF0000", Mark: YouTubeLogo },
  instagram: { title: "Instagram", color: "#FF0069", Mark: InstagramLogo },
  facebook: { title: "Facebook", color: "#0866FF", Mark: FacebookLogo },
  threads: { title: "Threads", color: "#000000", Mark: ThreadsLogo, dark: "#FFFFFF", darkInk: "#000000" },
  whatsapp: { title: "WhatsApp", color: "#25D366", Mark: WhatsAppLogo },
  telegram: { title: "Telegram", color: "#26A5E4", Mark: TelegramLogo },
  discord: { title: "Discord", color: "#5865F2", Mark: DiscordLogo },
  slack: { title: "Slack", color: "#4A154B", Mark: SlackLogo },
  mastodon: { title: "Mastodon", color: "#6364FF", Mark: MastodonLogo },
  bluesky: { title: "Bluesky", color: "#1185FE", Mark: BlueskyLogo },
  medium: { title: "Medium", color: "#000000", Mark: MediumLogo, dark: "#FFFFFF", darkInk: "#000000" },
  dribbble: { title: "Dribbble", color: "#EA4C89", Mark: DribbbleLogo },
  behance: { title: "Behance", color: "#1769FF", Mark: BehanceLogo },
  reddit: { title: "Reddit", color: "#FF4500", Mark: RedditLogo },
} as const;

export type SocialNetwork = keyof typeof NETWORKS;

/** Every network with a built-in mark, in the order the docs show them. */
export const SOCIAL_NETWORKS = Object.keys(NETWORKS) as SocialNetwork[];

export type SocialButtonSize = "sm" | "md" | "lg";

/**
 * `brand` puts the platform\'s colour on the housing, so the button reads as
 * the logo. `surface` is the carved neutral housing every other control uses
 * with the mark in the platform\'s colour — the form a long row wants, where
 * a dozen saturated chips would out-shout the page they sit on.
 */
export type SocialButtonTone = "brand" | "surface";

interface SocialButtonOwnProps {
  network: SocialNetwork;
  /** Renders an `a`. Without it the control is a `button`. */
  href?: string;
  size?: SocialButtonSize;
  tone?: SocialButtonTone;
  /**
   * The accessible name. Defaults to the network\'s own — name the person when
   * a page carries several rows of these ("Manoj on LinkedIn"), because a
   * screen reader reading "LinkedIn" four times says nothing about whose.
   */
  label?: string;
  /** Hands the anchor to a router, the way the rest of the library does. */
  renderLink?: (props: { className: string; href: string; "aria-label": string; children: ReactNode; style?: CSSProperties }) => ReactNode;
}

export type SocialButtonProps = SocialButtonOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement> & ButtonHTMLAttributes<HTMLButtonElement>, keyof SocialButtonOwnProps>;

/**
 * A social link as its own logo: an icon-only control whose housing carries the
 * platform\'s colour.
 *
 * **This is the one place a saturated fill is right**, and it is worth saying
 * why, because the system otherwise forbids filling a control with a brand
 * colour. That rule protects TonalDepth\'s own papaya: a page that fills with
 * it stops being able to say anything with it. These fills are not ours. A
 * reader finds LinkedIn by its blue before they have read anything, and a row
 * of neutral chips makes them read six labels to do what colour did at a
 * glance. The colour is the content here rather than emphasis laid over it.
 *
 * What does not change is the depth. The housing takes the same carve, the
 * same ladder and the same press as every other control, so a row of these
 * sits in the page rather than on it. `tone="surface"` is there for when the
 * colour would be too loud — the neutral housing with the mark in the
 * platform\'s colour, which is the quieter half of the same idea.
 */
export const SocialButton = forwardRef<HTMLAnchorElement & HTMLButtonElement, SocialButtonProps>(
  function SocialButton({ network, href, size = "md", tone = "brand", label, renderLink, className, style, ...props }, ref) {
    const entry = NETWORKS[network];
    const dark = "dark" in entry ? entry : null;
    const name = label ?? entry.title;

    const classes = cx("td-react-social", `td-react-social--${size}`, `td-react-social--${tone}`, className);
    const vars = {
      ...style,
      ["--td-social-color" as string]: entry.color,
      ["--td-social-ink" as string]: "#fff",
      ["--td-social-color-dark" as string]: dark ? dark.dark : entry.color,
      ["--td-social-ink-dark" as string]: dark ? dark.darkInk : "#fff",
    } as CSSProperties;

    /* `mono` so the mark follows the housing\'s ink rather than repainting
       itself in its own colour, and hidden from the accessibility tree because
       the control is already named — the mark would otherwise announce the
       platform a second time. */
    const Mark = entry.Mark;
    const glyph = <Mark mono className="td-react-social-mark" aria-hidden="true" role="presentation" aria-label={undefined} />;

    if (href !== undefined) {
      if (renderLink) return <>{renderLink({ className: classes, href, "aria-label": name, style: vars, children: glyph })}</>;
      return (
        <a {...props} ref={ref} href={href} aria-label={name} className={classes} style={vars}>
          {glyph}
        </a>
      );
    }

    return (
      <button {...props} ref={ref} type={props.type ?? "button"} aria-label={name} className={classes} style={vars}>
        {glyph}
      </button>
    );
  },
);
