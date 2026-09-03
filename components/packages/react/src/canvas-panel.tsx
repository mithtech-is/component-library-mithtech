"use client";

import { forwardRef, useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import { IconButton } from "./icon-button";
import { CloseIcon, LAMP_WEIGHT } from "./icons";
import "./canvas-panel.css";

export interface CanvasPanelProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  open: boolean;
  onClose?: () => void;
  title: ReactNode;
  /**
   * The category this panel belongs to, worn as a hue on its reading edge.
   * Colour is category in this system and never emphasis ([[L11]]), so pass
   * the hue of the thing on the map that opened it — not a mood.
   */
  accent?: string;
  /**
   * Actions pinned to the foot, OUTSIDE the scroll region: the way out of
   * whatever is open and the way deeper into it. Put inside the body they
   * scroll away exactly when the reader has finished reading and wants them.
   */
  actions?: ReactNode;
  /**
   * `absolute` pins to the canvas it belongs to — the normal case, and what a
   * fixed-height canvas wants. `fixed` pins to the viewport, for a tall
   * scrolling scene where the canvas itself is taller than the screen.
   */
  placement?: "absolute" | "fixed";
  side?: "right" | "left";
  closeLabel?: string;
  /**
   * Remounts the body with a cross-fade when it changes — for a panel that
   * stays open while the reader picks a different thing on the map. Without
   * it, swapping the content in place reads as the text jumping.
   */
  contentKey?: string;
  children: ReactNode;
}

/**
 * The reading panel that explains what the reader just opened on a `Canvas`.
 *
 * A head that holds its place, a body that scrolls, and actions pinned to the
 * foot. Three parts, because that is what a panel of explanation IS once it is
 * longer than the canvas is tall — and the middle one is the part every
 * hand-built version gets wrong.
 *
 * **It floats OVER the canvas, and that is why it carries `td-floating`.** A
 * `Frame`'s well flattens anything inside it that brings its own plate, which
 * is right for a plate the well houses and fatal for one positioned above it:
 * the panel goes transparent and the map runs through its text. The first
 * consumer to hit that abandoned the panel entirely and rebuilt the column,
 * the gap and the padding by hand. The class is the opt-out, and this
 * component carries it so no caller has to know the rule exists.
 *
 * **The body is a real scroll region.** It is `flex: 1 1 0; min-height: 0`
 * inside a fixed-height column, which is the pair of declarations a scroll
 * region needs and the pair that is always missing — a body sized to its
 * content pushes the actions out of the panel and the overflow is clipped in
 * silence. See the Scroll regions page for the same failure one level up.
 *
 * Not a `Dialog`: nothing here is modal. The map stays live behind it, and the
 * reader is expected to keep driving the map while this is open — that is the
 * whole point of a panel rather than a modal.
 */
export const CanvasPanel = forwardRef<HTMLElement, CanvasPanelProps>(function CanvasPanel(
  { open, onClose, title, accent, actions, placement = "absolute", side = "right", closeLabel = "Close panel", contentKey, className, children, ...props },
  ref,
) {
  const closeRef = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  const panelRef = useRef<HTMLElement | null>(null);

  /* The accent is a runtime value, so it reaches the element as a custom
     property rather than through a cast on the style prop. */
  useEffect(() => {
    if (accent) panelRef.current?.style.setProperty("--td-canvas-panel-accent", accent);
  }, [accent, open]);

  /* Focus moves in on open, and on every swap, so a keyboard reader lands
     where the answer is rather than being left out on the map. */
  useEffect(() => {
    if (open) closeRef.current?.focus({ preventScroll: true });
  }, [open, contentKey]);

  if (!open) return null;

  return (
    <aside
      {...props}
      ref={node => {
        panelRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      aria-label={typeof title === "string" ? title : undefined}
      data-placement={placement}
      data-side={side}
      className={cx("td-react-canvas-panel", "td-card-surface-static", "td-floating", className)}
    >
      <header className="td-react-canvas-panel-head">
        <span className="td-react-canvas-panel-title">{title}</span>
        {onClose ? (
          <IconButton
            ref={closeRef}
            icon={<CloseIcon weight={LAMP_WEIGHT} />}
            aria-label={closeLabel}
            onClick={onClose}
            className="td-react-canvas-panel-close"
          />
        ) : null}
      </header>
      <div key={contentKey} className="td-react-canvas-panel-body">{children}</div>
      {actions ? <div className="td-react-canvas-panel-actions">{actions}</div> : null}
    </aside>
  );
});
