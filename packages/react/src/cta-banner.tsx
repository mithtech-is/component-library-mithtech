import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./cta-banner.css";

export interface CtaBannerProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Pass library Buttons. The banner supplies placement, not button styling. */
  actions?: ReactNode;
  /** A reassurance or a standing fact, set beneath the actions. */
  assurance?: ReactNode;
  align?: "split" | "center";
}

export const CtaBanner = forwardRef<HTMLElement, CtaBannerProps>(function CtaBanner(
  { eyebrow, title, description, actions, assurance, align = "split", className, ...props },
  ref,
) {
  const titleId = useId();
  return (
    <section {...props} ref={ref} aria-labelledby={titleId} className={cx("td-mk-cta", `td-mk-cta--${align}`, className)}>
      <div className="td-mk-cta-body">
        {eyebrow ? <p className="td-mk-cta-eyebrow">{eyebrow}</p> : null}
        <h2 id={titleId} className="td-mk-cta-title">{title}</h2>
        {description ? <p className="td-mk-cta-description">{description}</p> : null}
      </div>
      {actions || assurance ? (
        <div className="td-mk-cta-side">
          {actions ? <div className="td-mk-cta-actions">{actions}</div> : null}
          {assurance ? <p className="td-mk-cta-assurance">{assurance}</p> : null}
        </div>
      ) : null}
    </section>
  );
});
