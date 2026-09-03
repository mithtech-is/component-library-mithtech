"use client";

import { forwardRef, useState, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-file-tree.css";

const LAMP_WEIGHT = "fill" as const;

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * Microsoft's Fluent System Icons, filled weight, copied in because a registry
 * item is one self-contained file. Vendored from `@fluentui/svg-icons` and
 * stripped to `currentColor`, so the component's lamp ladder moves them.
 */
interface FluentIconProps extends SVGProps<SVGSVGElement> {
  /** Edge length. `1em` so the glyph scales with the type it sits beside. */
  size?: number | string;
  /** The fill. `currentColor` so the lamp ramp can move it. */
  color?: string;
  /**
   * Swallowed, not forwarded. Fluent marks are filled by construction, so
   * there is nothing to switch — but call sites pass `weight={LAMP_WEIGHT}`
   * and `weight` is not an SVG attribute, so React would put it on the DOM.
   */
  weight?: string;
  /** Flip horizontally, for a mark that points. */
  mirrored?: boolean;
}

interface FluentGlyphProps extends FluentIconProps {
  viewBox: string;
  d: string;
}

function FluentGlyph({ viewBox, d, size = "1em", color = "currentColor", weight, mirrored, ...props }: FluentGlyphProps) {
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
      <path d={d} />
    </svg>
  );
}

/** `chevron_right_24_filled` */
function ChevronRightIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M8.3 4.3a1 1 0 0 0 0 1.4l6.29 6.3-6.3 6.3a1 1 0 1 0 1.42 1.4l7-7a1 1 0 0 0 0-1.4l-7-7a1 1 0 0 0-1.42 0" {...props} />;
}

/** `document_24_filled` */
function FileIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M12 2v6c0 1.1.9 2 2 2h6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4c0-1.1.9-2 2-2zm1.5.5V8c0 .28.22.5.5.5h5.5z" {...props} />;
}

/** `folder_24_filled` */
function FolderIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M2 8V6.25C2 4.45 3.46 3 5.25 3h2.88c.6 0 1.17.24 1.59.66l1.53 1.53-2.6 2.59a.8.8 0 0 1-.52.22zm0 1.5v8.25C2 19.55 3.46 21 5.25 21h13.5c1.8 0 3.25-1.46 3.25-3.25v-9c0-1.8-1.46-3.25-3.25-3.25h-5.69L9.72 8.84c-.42.42-1 .66-1.6.66z" {...props} />;
}

export interface TonalDepthFileTreeNode {
  /** Stable key, what `activeId` is matched against, and what `open` speaks in. */
  id: string;
  name: ReactNode;
  /** The machine face at the end of the row — a format, a size, a count. */
  meta?: ReactNode;
  /** Makes a file row a link. A folder row is its own expander and ignores it. */
  href?: string;
  /** Present makes the node a folder. An empty array is an empty folder. */
  children?: TonalDepthFileTreeNode[];
}

/** What `renderLink` is handed for a file row that carries an `href`. */
export interface TonalDepthFileTreeLinkProps {
  className: string;
  href: string;
  children: ReactNode;
  "data-kind": "file";
  "data-active"?: "true";
  "aria-current"?: "true";
}

export interface TonalDepthFileTreeProps extends Omit<HTMLAttributes<HTMLElement>, "onSelect"> {
  nodes: TonalDepthFileTreeNode[];
  /** Names the tree for a screen reader. Set it when a page has more than one. */
  label?: string;
  /** The file currently being read. That row rests recessed. */
  activeId?: string;
  /** Folder ids open on first render. Ignored once `open` is passed. */
  defaultOpen?: string[];
  /** Controlled open folder ids. */
  open?: string[];
  onOpenChange?: (open: string[]) => void;
  /** Fires when a file row is chosen. A folder row expands instead. */
  onSelect?: (node: TonalDepthFileTreeNode) => void;
  /**
   * Hand your router the anchor. Given the class, the href and the row's own
   * state attributes, return the element. Only file rows with an `href` use it.
   */
  renderLink?: (props: TonalDepthFileTreeLinkProps) => ReactNode;
}

/**
 * A repository or docs tree.
 *
 * Every row takes the row press the system gives every row ([[L34]]) — hover
 * sinks it, the press sinks it deeper, and the file being read rests recessed.
 * The design system's own tree washed the active row in 12% brand; a row being
 * pointed at or read is not a category, so the wash is deliberately not
 * reproduced and papaya arrives as ink ([[L11]]).
 *
 * **The chevron is a direction mark, not a lamp.** It turns to say which way the
 * folder is facing and steps its ink; it never glows, because a glow is how this
 * system reports state and the state here is already carried by the depth.
 *
 * **It is a nested list of disclosures, not an ARIA tree widget.** Every row is a
 * real button or anchor in the tab order, with `aria-expanded` on the folders —
 * there is no roving tabstop and no arrow-key navigation. A file browser that
 * needs those is a different component; this is the sidebar shape.
 */
export const TonalDepthFileTree = forwardRef<HTMLElement, TonalDepthFileTreeProps>(function TonalDepthFileTree(
  { nodes, label, activeId, defaultOpen = [], open, onOpenChange, onSelect, renderLink, className, ...props },
  ref,
) {
  const [uncontrolled, setUncontrolled] = useState<string[]>(defaultOpen);
  const openIds = open ?? uncontrolled;

  const toggle = (id: string) => {
    const next = openIds.includes(id) ? openIds.filter(x => x !== id) : [...openIds, id];
    if (open === undefined) setUncontrolled(next);
    onOpenChange?.(next);
  };

  const renderNode = (node: TonalDepthFileTreeNode) => {
    const isFolder = Array.isArray(node.children);
    const isOpen = isFolder && openIds.includes(node.id);
    const isActive = !isFolder && node.id === activeId;
    const rowClass = cx("td-tree-row", "td-registry-tree-row");
    // The gutter holds the chevron's column open on a file row, so names line
    // up down a level rather than stepping in and out with the folders.
    const body = (
      <>
        {isFolder
          ? <ChevronRightIcon className="td-tree-chevron td-registry-tree-chevron" weight={LAMP_WEIGHT} aria-hidden="true" />
          : <span className="td-registry-tree-gutter" aria-hidden="true" />}
        {isFolder
          ? <FolderIcon className="td-tree-icon td-registry-tree-icon" weight={LAMP_WEIGHT} aria-hidden="true" />
          : <FileIcon className="td-tree-icon td-registry-tree-icon" weight={LAMP_WEIGHT} aria-hidden="true" />}
        <span className="td-tree-name td-registry-tree-name">{node.name}</span>
        {node.meta !== undefined ? <span className="td-tree-meta td-registry-tree-meta">{node.meta}</span> : null}
      </>
    );
    const fileProps: TonalDepthFileTreeLinkProps = {
      className: rowClass,
      href: node.href ?? "",
      children: body,
      "data-kind": "file",
      "data-active": isActive ? "true" : undefined,
      "aria-current": isActive ? "true" : undefined,
    };

    let row: ReactNode;
    if (isFolder) {
      row = (
        <button type="button" className={rowClass} data-kind="folder" data-open={isOpen ? "true" : undefined} aria-expanded={isOpen} onClick={() => toggle(node.id)}>
          {body}
        </button>
      );
    } else if (node.href && renderLink) {
      row = renderLink(fileProps);
    } else if (node.href) {
      row = <a {...fileProps} onClick={() => onSelect?.(node)} />;
    } else {
      const { href: _href, ...rest } = fileProps;
      row = <button type="button" {...rest} onClick={() => onSelect?.(node)} />;
    }

    return (
      <li className="td-registry-tree-node" key={node.id}>
        {row}
        {isFolder ? (
          <ul className="td-tree-children td-registry-tree-children" hidden={!isOpen}>
            {node.children?.map(renderNode)}
          </ul>
        ) : null}
      </li>
    );
  };

  return (
    <nav {...props} ref={ref} aria-label={label} className={cx("td-tree", "td-registry-tree", className)}>
      <ul className="td-registry-tree-list">{nodes.map(renderNode)}</ul>
    </nav>
  );
});
