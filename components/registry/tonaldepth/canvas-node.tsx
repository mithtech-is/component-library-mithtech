import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-canvas-node.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthCanvasNodeProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  /** Where the node sits, in the world coordinates the canvas never interprets. */
  x: number;
  y: number;
  /** Its size in world units. Omit either and the node sizes to its content. */
  w?: number;
  h?: number;
  title: ReactNode;
  /** One line under the title — what it is, or what it does. */
  sub?: ReactNode;
  /**
   * The category this node belongs to, worn on its leading edge and passed on
   * to the panel that opens from it. Colour is category in this system and
   * never emphasis ([[L11]]).
   */
  accent?: string;
  /** The one being read. Marked by depth and by `aria-pressed`, not by a fill. */
  selected?: boolean;
  /**
   * Context rather than subject: still legible, still clickable, quieter. For
   * the siblings of whatever the reader has opened.
   */
  dimmed?: boolean;
  /** Anything the card carries besides its title — a sprite, a count, a chart. */
  children?: ReactNode;
}

/**
 * One thing on a `Canvas`: a card in world space that the reader can open.
 *
 * **It is a real `<button>`, and it wears the system's own card.** Both halves
 * matter. A node built as a `<div>` with an onClick is unreachable by keyboard
 * and invisible to a screen reader, which is most of a map's content gone; and
 * a node that draws its own rectangle is a second material inside a system
 * whose whole language is depth. This is `.td-card-surface` — the raised
 * plate, and the lift it takes on hover — with the button reset the card does
 * not carry, because a `<button>` brings its own font, alignment and border.
 *
 * **The accent is a bar, not a shadow.** The obvious way to draw a category
 * edge is `box-shadow: inset 3px 0 0 …`, and it is wrong: `box-shadow` is one
 * property, so an inset edge REPLACES the card's raise and the node comes out
 * flat. Every hand-built version of this makes that trade without noticing.
 * The edge here is a pseudo-element, so the card keeps its depth in every
 * state and the category rides on top of it.
 *
 * The title is set in the display face at its 20px floor (`td-display-sm`),
 * which is the size a card title in a map wants and the reason that class
 * exists.
 */
export const TonalDepthCanvasNode = forwardRef<HTMLButtonElement, TonalDepthCanvasNodeProps>(function TonalDepthCanvasNode(
  { x, y, w, h, title, sub, accent, selected, dimmed, className, children, style, type, ...props },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      type={type ?? "button"}
      aria-pressed={selected}
      data-accent={accent ? "" : undefined}
      data-dimmed={dimmed ? "" : undefined}
      style={{
        ...style,
        left: x,
        top: y,
        width: w,
        height: h,
        ...(accent ? { ["--td-canvas-node-accent" as string]: accent } : null),
      }}
      className={cx("td-card-surface", "td-registry-canvas-node", selected && "td-registry-canvas-node--selected", className)}
    >
      <span className="td-registry-canvas-node-title td-display-sm">{title}</span>
      {sub ? <span className="td-registry-canvas-node-sub">{sub}</span> : null}
      {children}
    </button>
  );
});
