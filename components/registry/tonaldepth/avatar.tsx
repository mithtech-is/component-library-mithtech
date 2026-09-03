"use client";

import { forwardRef, useState, type HTMLAttributes, type ImgHTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-avatar.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/** The edge lengths a person is drawn at. */
export type TonalDepthAvatarSize = "xs" | "sm" | "md" | "lg";

/** Whether the person is reachable right now. */
export type TonalDepthAvatarPresence = "online" | "busy" | "away" | "offline";

export interface TonalDepthAvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** The photograph. Falling back to initials when it fails to load. */
  src?: string;
  /**
   * The person's name. **Required**, even with a photograph: it is the
   * `alt` text, it is what a screen reader reads, and it is what the initials
   * are derived from when the image is missing or broken.
   */
  name: string;
  /** Overrides the derived initials — for a name the rule gets wrong. */
  initials?: string;
  size?: TonalDepthAvatarSize;
  /** A lamp on the rim. Omit where the answer is unknown; `offline` is a claim. */
  presence?: TonalDepthAvatarPresence;
  /** A glyph instead of initials — a team, a bot, a company. */
  icon?: ReactNode;
  imgProps?: ImgHTMLAttributes<HTMLImageElement>;
}

/**
 * Two letters, from the first and last word of a name.
 *
 * Deliberately not "first two characters": that gives "MA" for "Manoj Bhat"
 * and "AS" for "Asha Sundaram", so two colleagues collide the moment their
 * given names rhyme. First-and-last is what a person would pick.
 *
 * Grapheme-aware via `Intl.Segmenter` where it exists — a name beginning with
 * an emoji, a Devanagari cluster or a surrogate pair is one letter to a reader
 * and two code units to `slice`, and slicing it in half renders a replacement
 * character in the middle of somebody's name.
 */
export function TonalDepthinitialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  const first = (grapheme: string) => {
    if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
      const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
      return [...segmenter.segment(grapheme)][0]?.segment ?? "";
    }
    return [...grapheme][0] ?? "";
  };
  const head = first(words[0]);
  const tail = words.length > 1 ? first(words[words.length - 1]) : "";
  return (head + tail).toUpperCase();
}

/**
 * A person, at the size the row gives them.
 *
 * The photograph is a WELL. A face is content and content is recessed
 * ([[L32]]) — an avatar raised off the page reads as a button, which is the
 * one thing it is not unless the consumer wraps it in one.
 *
 * **`name` is required even when there is a photograph.** It is the `alt`
 * text, it is what the initials fall back to, and it is what a screen reader
 * announces. An avatar with no name is a decorative circle claiming to be a
 * person.
 *
 * **Initials are the fallback, not a lesser state.** They are derived from the
 * first and last word, so two people whose given names rhyme do not collide,
 * and taken grapheme-by-grapheme so a name that starts outside the Latin
 * range is not cut in half.
 *
 * **Presence is a lamp, not a dot.** It reads through the same ramp every
 * other lit thing in the system uses, and it carries a word for anyone who
 * cannot see the colour — a green circle alone says nothing.
 */
export const TonalDepthAvatar = forwardRef<HTMLSpanElement, TonalDepthAvatarProps>(function TonalDepthAvatar(
  { src, name, initials, size = "md", presence, icon, imgProps, className, ...props },
  ref,
) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  const mark = initials ?? TonalDepthinitialsOf(name);
  return (
    <span
      {...props}
      ref={ref}
      data-size={size}
      className={cx("td-registry-avatar", className)}
      title={props.title ?? name}
    >
      {showImage ? (
        <img
          {...imgProps}
          className="td-registry-avatar-img"
          src={src}
          alt={name}
          /* A broken src falls back to initials rather than to a broken-image
             glyph. The most common cause is a signed URL that has expired,
             which is not the reader's problem to look at. */
          onError={() => setFailed(true)}
        />
      ) : icon ? (
        <span className="td-registry-avatar-icon" aria-hidden="true">{icon}</span>
      ) : (
        <span className="td-registry-avatar-initials" aria-hidden="true">{mark}</span>
      )}
      {/* The name reaches a screen reader even when the visible content is
          initials or a glyph, both of which are hidden. */}
      {showImage ? null : <span className="td-registry-avatar-sr">{name}</span>}
      {presence ? (
        <span className="td-registry-avatar-presence" data-presence={presence}>
          <span className="td-registry-avatar-presence-lamp" aria-hidden="true" />
          <span className="td-registry-avatar-sr">{TonalDepthPRESENCE_LABEL[presence]}</span>
        </span>
      ) : null}
    </span>
  );
});

const TonalDepthPRESENCE_LABEL: Record<TonalDepthAvatarPresence, string> = {
  online: "Online",
  busy: "Busy",
  away: "Away",
  offline: "Offline",
};

export interface TonalDepthAvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Beyond this many, the rest become a +N counter. */
  max?: number;
  size?: TonalDepthAvatarSize;
  /** How many there are in total, when more exist than were passed. */
  total?: number;
}

/**
 * A row of people, overlapped.
 *
 * The overlap is what makes it a group rather than a list, and the order it
 * stacks in is deliberate: earlier faces sit ON TOP of later ones, so the row
 * reads left to right the way the names would. Doing it the other way — which
 * is what `z-index` does by default — makes the last person the most present,
 * and the eye reads the row backwards.
 *
 * `+N` is a count, not a person: it takes the same well but no presence lamp
 * and no name, because it is not one.
 */
export const TonalDepthAvatarGroup = forwardRef<HTMLDivElement, TonalDepthAvatarGroupProps>(function TonalDepthAvatarGroup(
  { max = 4, size = "md", total, className, children, ...props },
  ref,
) {
  const people = Array.isArray(children) ? children.flat() : [children];
  const shown = people.filter(Boolean).slice(0, max);
  const hidden = (total ?? people.filter(Boolean).length) - shown.length;
  return (
    <div {...props} ref={ref} data-size={size} className={cx("td-registry-avatargroup", className)}>
      {shown.map((person, index) => (
        /* Explicit descending z-index rather than DOM order: the default puts
           the LAST sibling on top, which stacks the row right to left. */
        <span className="td-registry-avatargroup-slot" key={index} style={{ zIndex: shown.length - index }}>
          {person}
        </span>
      ))}
      {hidden > 0 ? (
        <span className="td-registry-avatargroup-slot" style={{ zIndex: 0 }}>
          <span className="td-registry-avatar td-registry-avatar--more" data-size={size}>
            <span className="td-registry-avatar-initials">+{hidden}</span>
          </span>
        </span>
      ) : null}
    </div>
  );
});
