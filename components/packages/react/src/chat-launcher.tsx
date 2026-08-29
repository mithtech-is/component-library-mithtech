"use client";

// The panel is open/closed state and the launcher watches for Escape.
import { forwardRef, useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import { ChatCircleIcon, CloseIcon, LAMP_WEIGHT } from "./icons";
import "./chat-launcher.css";

export interface AiHaloProps extends HTMLAttributes<HTMLSpanElement> {
  /** Off stops the shine dead. The ring stays, unlit, so nothing reflows. */
  active?: boolean;
  /**
   * Seconds for one revolution. Slower reads as considered; faster reads as
   * busy. The default is 3.2 — a quarter quicker than the 4 it started at,
   * because the light only runs while somebody is engaging with the control
   * and a lap that outlasts the hover never completes.
   *
   * The same knob is a CSS custom property, `--td-ai-speed`, for the cases
   * where the halo is not yours to pass a prop to — a `ChatLauncher` in
   * somebody else's layout, say. Set it on any ancestor.
   */
  speed?: number;
  /**
   * The halo's corner radius, which must match the control it wraps.
   *
   * It cannot be read from the child in CSS, so it is stated here. Default
   * `12px` is a `Button`'s; pass `999px` for a pill and `50%` for a disc. Get
   * it wrong and the bright arc of the sweep pokes out past the corners, which
   * reads as a smear rather than a light travelling an edge.
   */
  radius?: string;
  children: ReactNode;
}

/**
 * The revolving shine that marks a control as an AI affordance.
 *
 * Wrap any control — a `Button`, an `IconButton`, the chat launcher — and it
 * gains a light travelling round its edge. It is **light, not a fill**: the
 * control underneath keeps its own carved surface and its own depth ladder, and
 * the halo sits behind it in the same stacking context. Nothing about the
 * control's material changes ([[L11]]).
 *
 * The colour is the two the system already owns — azure into papaya — so the
 * halo says *this one is different* without introducing a palette. It is the
 * one continuously moving thing the library ships, and it earns that by being
 * the signal itself rather than decoration on a signal.
 *
 * **It stops completely under `prefers-reduced-motion`.** The ring stays, lit
 * and still, so the control is still marked; only the travel goes. A shine that
 * merely slows is the same shine.
 */
export const AiHalo = forwardRef<HTMLSpanElement, AiHaloProps>(function AiHalo(
  { active = true, speed = 3.2, radius = "12px", children, className, style, ...props },
  ref,
) {
  return (
    <span
      {...props}
      ref={ref}
      data-active={active ? "true" : undefined}
      style={{ ...style, ["--td-ai-speed" as string]: `${speed}s`, ["--td-ai-radius" as string]: radius }}
      className={cx("td-react-aihalo", className)}
    >
      {/* THE CAST, as its own element rather than a `drop-shadow`.

          `filter` is applied BEFORE `mask` in the painting order, so a
          drop-shadow on the masked ring was itself clipped by the ring — the
          coloured shadow was being drawn and then thrown away, which is why
          none of it showed. A parent's blur applies to what its child has
          already been masked into, so the glow is a ring rather than a wedge,
          and it sits behind the control so only the part outside the button is
          seen. */}
      <span className="td-react-aihalo-cast" aria-hidden="true" />
      {children}
    </span>
  );
});

export type ChatPresence = "online" | "away" | "offline";

export interface ChatLauncherProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** The launcher's visible text. Drop it for a round, wordless launcher. */
  label?: ReactNode;
  /** The panel's heading. */
  title?: ReactNode;
  /** One line under the title — who answers, and how fast. */
  description?: ReactNode;
  /** Whether anyone is actually there. It is a lamp, so say the truth. */
  presence?: ChatPresence;
  /** What each presence reads as. Announced, not only coloured. */
  presenceLabel?: Record<ChatPresence, string>;
  /** Marks it as an AI channel: the launcher takes the revolving shine. */
  ai?: boolean;
  /** Seconds for one revolution of that shine. Only read when `ai` is on. */
  aiSpeed?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The conversation. A transcript, a form, an embedded widget — yours. */
  children?: ReactNode;
  /** Pinned under the conversation: the composer, a set of openers. */
  footer?: ReactNode;
  closeLabel?: string;
  /** Where it sits. `end` is the reading direction's end — right in English. */
  side?: "start" | "end";
  /**
   * Who is answering — a photograph, a brand mark, initials.
   *
   * The launcher icon and the avatar are separate on purpose: a chat bubble
   * says *this is a conversation*, and a face says *this is a person*. A
   * launcher carrying a real face is answered more often than one carrying a
   * glyph, which is the whole reason support widgets show one.
   */
  avatar?: ReactNode;
  /**
   * Unread messages waiting. A **resolved count**, never a bare dot.
   *
   * "3" tells a reader whether to stop what they are doing; a dot tells them
   * only that something happened. `0` and `undefined` both draw nothing.
   */
  unread?: number;
  /**
   * A line that appears beside the launcher before it is opened — the opening
   * move, not an advert.
   *
   * Say what this is for and hand the reader something concrete to reply to.
   * It is dismissible, and dismissing it does not open the panel.
   */
  teaser?: ReactNode;
  /** Accessible name for the teaser's dismiss control. */
  teaserDismissLabel?: string;
  /**
   * Pin it to the corner of the viewport.
   *
   * On by default, which is what a chat launcher is. Turn it off and it renders
   * in normal flow — for a support block inside a page, and for showing more
   * than one of these at a time, which is impossible while they all pin to the
   * same corner.
   */
  pinned?: boolean;
}

/**
 * The floating chat launcher, and its panel.
 *
 * **It is not a `Dialog`, and that is the whole design.** A dialog scrims the
 * page, traps focus and demands an answer before anything else happens. Live
 * chat is the opposite: the reader keeps reading, keeps scrolling, and the
 * conversation waits. So there is no scrim, no focus trap and no `aria-modal`
 * — Escape closes it and focus returns to the launcher, and that is all the
 * containment a side panel should have.
 *
 * **The presence lamp is a lamp** ([[L25]]): a lens in a socket carved from the
 * launcher, lit green when someone is there and unlit grey when nobody is. It
 * is never a coloured disc, and the state is in text for a screen reader as
 * well as in the light — a status carried by colour alone is a status half the
 * readers cannot read.
 *
 * The design system's own floating button is a solid papaya pill with white
 * text and a pulsing white dot. Filling with the brand colour is the one move
 * the system forbids ([[L11]]), so this is the carved surface every other
 * control uses, with papaya as ink.
 */
export const ChatLauncher = forwardRef<HTMLDivElement, ChatLauncherProps>(function ChatLauncher(
  { label = "Chat with us", title = "Chat with us", description, presence = "online", presenceLabel, ai = false, aiSpeed, open, defaultOpen = false, onOpenChange, children, footer, closeLabel = "Close chat", side = "end", avatar, unread, teaser, teaserDismissLabel = "Dismiss", pinned = true, className, ...props },
  ref,
) {
  const base = useId();
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const [teaserGone, setTeaserGone] = useState(false);
  const isOpen = open ?? uncontrolled;
  const launcher = useRef<HTMLButtonElement>(null);
  const presenceText = presenceLabel ?? { online: "Online now", away: "Away", offline: "Offline" };

  const setOpen = (next: boolean) => {
    if (open === undefined) setUncontrolled(next);
    onOpenChange?.(next);
  };

  // Escape closes and hands focus back. No trap: the page stays usable, which
  // is the difference between a chat panel and a dialog.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      launcher.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const button = (
    <button
      ref={launcher}
      type="button"
      className={cx("td-react-chat-launcher", !label && "td-react-chat-launcher--bare")}
      aria-expanded={isOpen}
      aria-controls={`${base}-panel`}
      onClick={() => setOpen(!isOpen)}
    >
      {avatar
        ? <span className="td-react-chat-avatar" aria-hidden="true">{avatar}</span>
        : <ChatCircleIcon className="td-react-chat-glyph" weight={LAMP_WEIGHT} aria-hidden="true" />}
      <span className="td-react-chat-lamp" data-presence={presence} aria-hidden="true" />
      {label ? <span className="td-react-chat-launcher-label">{label}</span> : null}
      {/* A resolved count, never a bare dot: "3" tells the reader whether to
          stop what they are doing, and a dot tells them only that something
          happened. */}
      {unread ? <span className="td-react-chat-unread">{unread > 99 ? "99+" : unread}<span className="td-react-visually-hidden"> unread</span></span> : null}
      {/* The presence is in text too. A state carried by colour alone is a
          state half the readers cannot read. */}
      <span className="td-react-visually-hidden">{presenceText[presence]}</span>
    </button>
  );

  return (
    <div
      {...props}
      ref={ref}
      data-side={side}
      data-open={isOpen ? "true" : undefined}
      className={cx("td-react-chat", pinned ? "td-react-chat--pinned" : "td-react-chat--inline", className)}
    >
      <div
        id={`${base}-panel`}
        className="td-react-chat-panel"
        role="dialog"
        aria-label={typeof title === "string" ? title : undefined}
        hidden={!isOpen}
      >
        <header className="td-react-chat-head">
          <span className="td-react-chat-lamp" data-presence={presence} aria-hidden="true" />
          <div className="td-react-chat-identity">
            <p className="td-react-chat-title">{title}</p>
            <p className="td-react-chat-presence">{presenceText[presence]}{description ? <> · {description}</> : null}</p>
          </div>
          <button type="button" className="td-react-chat-close" aria-label={closeLabel} onClick={() => { setOpen(false); launcher.current?.focus(); }}>
            <CloseIcon weight={LAMP_WEIGHT} aria-hidden="true" />
          </button>
        </header>
        <div className="td-react-chat-body">{children}</div>
        {footer ? <div className="td-react-chat-footer">{footer}</div> : null}
      </div>
      {/* The opening move, beside the launcher rather than inside it. Dismissing
          it is not opening the panel — a reader who says "not now" has said
          something, and reopening the conversation for them ignores it. */}
      {teaser && !isOpen && !teaserGone ? (
        <div className="td-react-chat-teaser">
          <p className="td-react-chat-teaser-text">{teaser}</p>
          <button type="button" className="td-react-chat-close" aria-label={teaserDismissLabel} onClick={() => setTeaserGone(true)}>
            <CloseIcon weight={LAMP_WEIGHT} aria-hidden="true" />
          </button>
        </div>
      ) : null}
      {ai ? <AiHalo radius="var(--td-radius-pill, 999px)" speed={aiSpeed}>{button}</AiHalo> : button}
    </div>
  );
});
