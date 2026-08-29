import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-profile-card.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * The two shapes the design system draws for a person.
 *
 * `row` is `05-cards/profile`: the mark beside the name, for a byline, an owner
 * or a contact. `stack` is `10-marketing/team`: the mark above the name with a
 * bio under it, for a wall of people. Same card, same parts, different reading
 * order — which is why there is one component rather than two.
 */
export type TonalDepthProfileCardLayout = "row" | "stack";

// The DOM `role` attribute is omitted so the prop can carry the person's job,
// which is what the design system calls it. The card is an `article` and has no
// business being relabelled as something else anyway.
export interface TonalDepthProfileCardProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "role"> {
  name: ReactNode;
  /** The line under the name — the role, set in mono small caps. */
  role?: ReactNode;
  /** Two letters, when there is no photograph. Ignored if `avatar` is given. */
  initials?: string;
  /** A photograph or a drawn mark. Wins over `initials`. */
  avatar?: ReactNode;
  /** The bio. */
  children?: ReactNode;
  /**
   * Controls at the foot of the card — an email button, social links. You
   * supply them, so they are real components rather than a shape invented here.
   */
  actions?: ReactNode;
  layout?: TonalDepthProfileCardLayout;
  /** Makes the name a link — and the whole card a target when there are no `actions`. */
  href?: string;
  /**
   * Hand your router the anchor. Given the class and the href, return the
   * element.
   */
  renderLink?: (props: { className: string; href: string; children: ReactNode }) => ReactNode;
}

/**
 * A person.
 *
 * **One card covers `05-cards/profile` and `10-marketing/team`.** They are the
 * same parts in a different reading order — mark, name, role, bio, controls —
 * so they are `layout="row"` and `layout="stack"` rather than two components
 * that would have to be corrected in step forever.
 *
 * The team card's avatar is a brand-to-accent gradient carrying white initials.
 * Filling with the brand colour is the one move the system forbids ([[L11]]), so
 * the mark here is the profile card's own: a disc carved from the surface with
 * the initials set in the display face. Its role line is papaya; a role is not a
 * category and a wall of eight people would put papaya on all of them, spending
 * the one signal the system reserves for meaning — so the role is ink.
 *
 * **The whole card is a target only when it carries no `actions`.** A full-card
 * overlay on top of an email button is an overlay that eats the button; with
 * actions present, `href` links the name alone.
 */
export const TonalDepthProfileCard = forwardRef<HTMLElement, TonalDepthProfileCardProps>(function TonalDepthProfileCard(
  { name, role, initials, avatar, children, actions, layout = "row", href, renderLink, className, ...props },
  ref,
) {
  const nameId = useId();
  const wholeCard = Boolean(href) && !actions;
  const linkClass = cx("td-mk-profile-namelink", wholeCard && "td-mk-profile-namelink--cover");
  const nameNode = href
    ? renderLink
      ? renderLink({ className: linkClass, href, children: name })
      : <a className={linkClass} href={href}>{name}</a>
    : name;
  return (
    <article
      {...props}
      ref={ref}
      aria-labelledby={nameId}
      className={cx("td-mk-profile", `td-mk-profile--${layout}`, wholeCard && "td-mk-profile--link", className)}
    >
      <span className="td-mk-profile-avatar" aria-hidden={avatar ? undefined : "true"}>
        {avatar ?? initials}
      </span>
      <div className="td-mk-profile-body">
        <h3 id={nameId} className="td-mk-profile-name">{nameNode}</h3>
        {role ? <p className="td-mk-profile-role">{role}</p> : null}
        {children ? <p className="td-mk-profile-bio">{children}</p> : null}
        {actions ? <div className="td-mk-profile-actions">{actions}</div> : null}
      </div>
    </article>
  );
});
