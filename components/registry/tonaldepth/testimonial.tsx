import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-testimonial.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

// `role` is the person's job title here, which collides with the ARIA
// attribute of the same name — the same trade ProfileCard makes.
export interface TonalDepthTestimonialProps extends Omit<HTMLAttributes<HTMLElement>, "cite" | "role"> {
  /** What they said. The component supplies the quote marks. */
  children: ReactNode;
  /** Who said it. */
  name: ReactNode;
  /** Their role and where — "CTO · Rajesh & Co". Set in mono caps. */
  role?: ReactNode;
  /**
   * Two or three letters for the avatar tile. Ignored when `avatar` is passed.
   *
   * Initials rather than a photo is the default on purpose: a wall of six
   * headshots at 40px is six unreadable faces, and the tiles read as one
   * material.
   */
  initials?: string;
  /** A photograph or a logo, in place of the initials tile. */
  avatar?: ReactNode;
  /** Where the quote is published — a URL for the `cite` attribute. */
  source?: string;
}

/**
 * A quotation with its attribution.
 *
 * Not `ProfileCard`. A profile card is about the person — you go to it to find
 * out who someone is, and the card is theirs. A testimonial is about the claim;
 * the person is the evidence for it, which is why the quote is set at reading
 * size and the name is set at 12px underneath. Swap them round and it becomes a
 * team card with a long bio.
 *
 * The opening quote mark is drawn by the stylesheet, so do not type one into
 * `children` — two quote marks read as a nested quotation.
 */
export const TonalDepthTestimonial = forwardRef<HTMLElement, TonalDepthTestimonialProps>(function TonalDepthTestimonial(
  { children, name, role, initials, avatar, source, className, ...props },
  ref,
) {
  return (
    <figure {...props} ref={ref} className={cx("td-registry-testimonial", className)}>
      <blockquote className="td-registry-testimonial-quote" cite={source}>
        {children}
      </blockquote>
      <figcaption className="td-registry-testimonial-meta">
        {avatar ?? (initials ? <span className="td-registry-testimonial-avatar" aria-hidden="true">{initials}</span> : null)}
        <span className="td-registry-testimonial-who">
          <span className="td-registry-testimonial-name">{name}</span>
          {role !== undefined ? <span className="td-registry-testimonial-role">{role}</span> : null}
        </span>
      </figcaption>
    </figure>
  );
});

export interface TonalDepthTestimonialGridProps extends HTMLAttributes<HTMLDivElement> {
  /** Narrowest a column may get before the grid drops one. Default 320. */
  min?: number;
}

/**
 * Testimonials laid out in columns that wrap.
 *
 * The cards stretch to the tallest in the row rather than sizing to their own
 * quote, so the attribution lines up across the row — a row of cards whose
 * names sit at four different heights reads as four unrelated things.
 */
export const TonalDepthTestimonialGrid = forwardRef<HTMLDivElement, TonalDepthTestimonialGridProps>(function TonalDepthTestimonialGrid(
  { min = 320, className, style, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={cx("td-registry-testimonial-grid", className)}
      style={{ ...style, ["--td-testimonial-min" as string]: `${min}px` }}
    />
  );
});
