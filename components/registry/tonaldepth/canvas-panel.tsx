"use client";

import { forwardRef, useEffect, useRef, type HTMLAttributes, type ReactNode, type SVGProps } from "react";
import "./tonaldepth-canvas-panel.css";
import { TonalDepthIconButton } from "./tonaldepth-icon-button";

const LAMP_WEIGHT = "fill" as const;

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * TonalDepth's own glyphs, copied in because a registry item is one
 * self-contained file. Filled and colour-neutral by construction, so the
 * component's lamp ladder moves them through `currentColor`.
 */
interface TdIconProps extends SVGProps<SVGSVGElement> {
  /** Edge length. `1em` so the glyph scales with the type it sits beside. */
  size?: number | string;
  /** The fill. `currentColor` so the lamp ramp can move it. */
  color?: string;
  /**
   * Accepted so a TD glyph is a drop-in at a call site passing
   * `weight={LAMP_WEIGHT}`. TD glyphs are filled by construction, so there is
   * nothing to switch — the prop is swallowed rather than forwarded, because
   * `weight` is not an SVG attribute and React would put it on the DOM.
   */
  weight?: string;
  /** Flip horizontally, matching Phosphor's prop of the same name. */
  mirrored?: boolean;
}

/** `fillRule` comes from `SVGProps`; pass `evenodd` where the artwork knocks a
 *  hole out of its own outline. */
interface TdGlyphProps extends TdIconProps {
  viewBox: string;
  d: string;
}

function TdGlyph({ viewBox, d, fillRule, size = "1em", color = "currentColor", weight, mirrored, ...props }: TdGlyphProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      fill={color}
      transform={mirrored ? "scale(-1, 1)" : undefined}
      {...props}
    >
      <path d={d} fillRule={fillRule} />
    </svg>
  );
}

// A bare cross, drawn as one filled polygon: two 40-unit bars crossing at the
// centre, tips at 30.4/225.6. Not a stroked path — the set is filled by
// construction, and a stroke cannot carry the lamp's glow.
const CLOSE = "M58.7,225.6 30.4,197.3 99.7,128 30.4,58.7 58.7,30.4 128,99.7 197.3,30.4 225.6,58.7 156.3,128 225.6,197.3 197.3,225.6 128,156.3Z";

/**
 * The dismiss mark. A bare cross.
 *
 * Phosphor's `X` cannot be used: at `fill` weight a stroke-only glyph renders
 * as a filled square PLATE with the mark knocked out of it. Its `XCircle` —
 * which this replaces — is a solid disc, and at the 13px a dismiss control
 * uses that reads as a hole punched in the surface rather than as a mark on
 * it, which is the one move the system forbids. The bar and the disc were
 * also the same glyph as CancelIcon, so dismissing a panel and refusing an
 * action looked identical.
 */
function TdClose(props: TdIconProps) {
  return <TdGlyph viewBox="0 0 256 256" d={CLOSE} {...props} />;
}

const CloseIcon = TdClose;

export interface TonalDepthCanvasPanelProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
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
export const TonalDepthCanvasPanel = forwardRef<HTMLElement, TonalDepthCanvasPanelProps>(function TonalDepthCanvasPanel(
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
      className={cx("td-registry-canvas-panel", "td-card-surface-static", "td-floating", className)}
    >
      <header className="td-registry-canvas-panel-head">
        <span className="td-registry-canvas-panel-title">{title}</span>
        {onClose ? (
          <TonalDepthIconButton
            ref={closeRef}
            icon={<CloseIcon weight={LAMP_WEIGHT} />}
            aria-label={closeLabel}
            onClick={onClose}
            className="td-registry-canvas-panel-close"
          />
        ) : null}
      </header>
      <div key={contentKey} className="td-registry-canvas-panel-body">{children}</div>
      {actions ? <div className="td-registry-canvas-panel-actions">{actions}</div> : null}
    </aside>
  );
});
