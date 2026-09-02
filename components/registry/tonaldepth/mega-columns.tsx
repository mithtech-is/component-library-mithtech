import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-mega-columns.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/** How a panel hands an TonalDepthanchor to the consumer's router. */
export type TonalDepthMegaLinkRenderer = (props: { className?: string; href: string; children: ReactNode }) => ReactNode;

const TonalDepthanchor = (render: TonalDepthMegaLinkRenderer | undefined, href: string, children: ReactNode, className?: string) =>
  render ? render({ className, href, children }) : <a className={className}

// ── The linked columns ─────────────────────────────────────────────────────

export interface TonalDepthMegaLink {
  href: string;
  title: ReactNode;
  /** The line under the title. What the reader gets for the click. */
  detail?: ReactNode;
  /** A filled glyph, in its own tile. */
  icon?: ReactNode;
}

export interface TonalDepthMegaSection {
  id: string;
  /** The column heading — a category in small caps, not a sentence. */
  label: ReactNode;
  links: TonalDepthMegaLink[];
}

export interface TonalDepthMegaColumnsProps extends HTMLAttributes<HTMLDivElement> {
  sections: TonalDepthMegaSection[];
  /**
   * The panel's argument, in the first column — a `TonalDepthMegaFeature`, or anything
   * else that earns the width. Omit it and the sections take the whole sheet.
   */
  feature?: ReactNode;
  /** A rail across the foot: app badges, a standing offer, a last link. */
  footer?: ReactNode;
  renderLink?: TonalDepthMegaLinkRenderer;
}

/**
 * A feature beside titled columns of links — the widest panel, and the one for
 * a menu that has to teach as well as navigate.
 *
 * `MegaCascade` is for depth and `MegaTabs` is for options that need a
 * paragraph each. This is for **breadth**: two or three columns of destinations
 * a reader scans rather than drills into, with one panel on the left making the
 * case for the section as a whole.
 *
 * Every column is a well, and each link is a row that presses. The section
 * headings are marked with a short papaya rule rather than a rule across the
 * column — a full-width line is a divider, and these are labels.
 */
export const TonalDepthMegaColumns = forwardRef<HTMLDivElement, TonalDepthMegaColumnsProps>(function TonalDepthMegaColumns(
  { sections, feature, footer, renderLink, className, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} className={cx("td-registry-mega-columns", Boolean(feature) && "td-registry-mega-columns--featured", className)}>
      {feature ? <div className="td-registry-mega-feature-slot">{feature}</div> : null}
      <div className="td-registry-mega-cols">
        {sections.map(section => (
          <section className="td-registry-mega-col" key={section.id}>
            <h4 className="td-registry-mega-col-label">{section.label}</h4>
            <ul className="td-registry-mega-links">
              {section.links.map(link => (
                <li key={link.href + String(link.title)}>
                  {TonalDepthanchor(renderLink, link.href, (
                    <>
                      {link.icon ? <span className="td-mega-op-icon td-registry-mega-op-icon">{link.icon}</span> : null}
                      <span className="td-registry-mega-link-copy">
                        <strong>{link.title}</strong>
                        {link.detail ? <span>{link.detail}</span> : null}
                      </span>
                    </>
                  ), "td-registry-mega-link")}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {footer ? <div className="td-registry-mega-footer">{footer}</div> : null}
    </div>
  );
});

// ── The feature panel ──────────────────────────────────────────────────────

export interface TonalDepthMegaFeatureProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Small caps above the title — the question the panel answers. */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** A filled glyph in a tile above the eyebrow. */
  icon?: ReactNode;
  children?: ReactNode;
  /**
   * A numbered sequence, threaded on a rail. For the "here is how this works"
   * a menu sometimes has to carry before anything else makes sense.
   */
  steps?: ReactNode[];
  /** The way in. One control — a panel with two calls to action has none. */
  action?: ReactNode;
}

/**
 * The panel that makes the case, for `TonalDepthMegaColumns`' first column.
 *
 * **It is not a coloured card.** The shape this is drawn from fills the panel
 * with a brand green and sets white on it; filling with the brand colour is the
 * one move this system forbids ([[L11]]). It is a well instead — the argument
 * is content, and content is recessed ([[L32]]) — with papaya arriving as ink
 * on the eyebrow and the step numbers, which is where the emphasis was doing
 * real work in the original.
 *
 * The steps are lamps in sockets on a rail, the same anatomy `Timeline` uses,
 * because a numbered sequence and a phase sequence are the same object read at
 * different scales.
 */
export const TonalDepthMegaFeature = forwardRef<HTMLDivElement, TonalDepthMegaFeatureProps>(function TonalDepthMegaFeature(
  { eyebrow, title, icon, children, steps, action, className, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} className={cx("td-registry-mega-feature", className)}>
      {icon ? <span className="td-registry-mega-feature-icon">{icon}</span> : null}
      {eyebrow ? <p className="td-registry-mega-feature-eyebrow">{eyebrow}</p> : null}
      <h4 className="td-registry-mega-feature-title">{title}</h4>
      {children ? <p className="td-registry-mega-feature-body">{children}</p> : null}
      {steps?.length ? (
        <ol className="td-registry-mega-steps">
          {steps.map((step, index) => (
            <li className="td-registry-mega-step" key={index}>
              <span className="td-registry-mega-step-n" aria-hidden="true">{index + 1}</span>
              <span className="td-registry-mega-step-copy">{step}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {action ? <div className="td-registry-mega-feature-action">{action}</div> : null}
    </div>
  );
});
