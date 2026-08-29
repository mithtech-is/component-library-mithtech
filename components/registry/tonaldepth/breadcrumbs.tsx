import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-breadcrumbs.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * The three forms the design system draws, on one prop.
 *
 * `chevron` and `slash` differ only in the mark between crumbs. `condensed` is
 * the third shipped form — chevrons inside a housed bar — and it is a value here
 * rather than a second `housed` prop on purpose: the design system draws
 * exactly these three, and a separator-times-housing cross product would let a
 * caller build a slash-in-a-bar that has never been drawn.
 */
export type TonalDepthBreadcrumbSeparator = "chevron" | "slash" | "condensed";

export interface TonalDepthBreadcrumbItem {
  label: ReactNode;
  /** Ignored on the last item — see the note about the current page. */
  href?: string;
}

export interface TonalDepthBreadcrumbsProps extends HTMLAttributes<HTMLElement> {
  items: TonalDepthBreadcrumbItem[];
  separator?: TonalDepthBreadcrumbSeparator;
  /** Names the navigation landmark. Default "Breadcrumb". */
  label?: string;
  /**
   * Hand your router the anchor. Given the class and the href, return the
   * element. The last crumb never reaches it — it is not a link.
   */
  renderLink?: (props: { className: string; href: string; children: ReactNode }) => ReactNode;
}

/**
 * Where this page sits, and the way back up.
 *
 * **The last crumb is not a link.** It is the page the reader is already on, so
 * an `href` on it is ignored: a link to where you already are is not a
 * destination, and it would make the crumb's recessed rest read as a control
 * that does nothing when pressed. It carries `aria-current="page"` instead.
 *
 * Every other crumb takes the row press ([[L34]]) — hover sinks it, the press
 * sinks it deeper. The design system's own trail tinted a hovered crumb with a
 * surface step and washed the current one in 14% brand inside the housed form;
 * neither is reproduced, because a crumb being pointed at is not a category
 * ([[L11]]).
 *
 * The separator is drawn in CSS as a typographic mark rather than as an icon.
 * It is punctuation between two words, not a glyph that means something.
 */
export const TonalDepthBreadcrumbs = forwardRef<HTMLElement, TonalDepthBreadcrumbsProps>(function TonalDepthBreadcrumbs(
  { items, separator = "chevron", label = "Breadcrumb", renderLink, className, ...props },
  ref,
) {
  const last = items.length - 1;
  return (
    <nav {...props} ref={ref} aria-label={label} className={cx("td-bc", "td-registry-bc", `td-registry-bc--${separator}`, className)}>
      <ol className="td-registry-bc-list">
        {items.map((item, index) => {
          const isCurrent = index === last;
          const itemClass = cx("td-bc-item", "td-registry-bc-item");
          return (
            <li className="td-registry-bc-crumb" key={index}>
              {index > 0 ? <span className="td-bc-sep td-registry-bc-sep" aria-hidden="true" /> : null}
              {isCurrent || !item.href
                ? <span className={itemClass} aria-current={isCurrent ? "page" : undefined}>{item.label}</span>
                : renderLink
                  ? renderLink({ className: itemClass, href: item.href, children: item.label })
                  : <a className={itemClass} href={item.href}>{item.label}</a>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});
