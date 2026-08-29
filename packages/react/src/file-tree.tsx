"use client";

// Expanding a folder is open/closed state, so the module is a client boundary.
import { forwardRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import { ChevronRightIcon, FileIcon, FolderIcon, LAMP_WEIGHT } from "./icons";
import "./file-tree.css";

export interface FileTreeNode {
  /** Stable key, what `activeId` is matched against, and what `open` speaks in. */
  id: string;
  name: ReactNode;
  /** The machine face at the end of the row — a format, a size, a count. */
  meta?: ReactNode;
  /** Makes a file row a link. A folder row is its own expander and ignores it. */
  href?: string;
  /** Present makes the node a folder. An empty array is an empty folder. */
  children?: FileTreeNode[];
}

/** What `renderLink` is handed for a file row that carries an `href`. */
export interface FileTreeLinkProps {
  className: string;
  href: string;
  children: ReactNode;
  "data-kind": "file";
  "data-active"?: "true";
  "aria-current"?: "true";
}

export interface FileTreeProps extends Omit<HTMLAttributes<HTMLElement>, "onSelect"> {
  nodes: FileTreeNode[];
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
  onSelect?: (node: FileTreeNode) => void;
  /**
   * Hand your router the anchor. Given the class, the href and the row's own
   * state attributes, return the element. Only file rows with an `href` use it.
   */
  renderLink?: (props: FileTreeLinkProps) => ReactNode;
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
export const FileTree = forwardRef<HTMLElement, FileTreeProps>(function FileTree(
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

  const renderNode = (node: FileTreeNode) => {
    const isFolder = Array.isArray(node.children);
    const isOpen = isFolder && openIds.includes(node.id);
    const isActive = !isFolder && node.id === activeId;
    const rowClass = cx("td-tree-row", "td-react-tree-row");
    // The gutter holds the chevron's column open on a file row, so names line
    // up down a level rather than stepping in and out with the folders.
    const body = (
      <>
        {isFolder
          ? <ChevronRightIcon className="td-tree-chevron td-react-tree-chevron" weight={LAMP_WEIGHT} aria-hidden="true" />
          : <span className="td-react-tree-gutter" aria-hidden="true" />}
        {isFolder
          ? <FolderIcon className="td-tree-icon td-react-tree-icon" weight={LAMP_WEIGHT} aria-hidden="true" />
          : <FileIcon className="td-tree-icon td-react-tree-icon" weight={LAMP_WEIGHT} aria-hidden="true" />}
        <span className="td-tree-name td-react-tree-name">{node.name}</span>
        {node.meta !== undefined ? <span className="td-tree-meta td-react-tree-meta">{node.meta}</span> : null}
      </>
    );
    const fileProps: FileTreeLinkProps = {
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
      <li className="td-react-tree-node" key={node.id}>
        {row}
        {isFolder ? (
          <ul className="td-tree-children td-react-tree-children" hidden={!isOpen}>
            {node.children?.map(renderNode)}
          </ul>
        ) : null}
      </li>
    );
  };

  return (
    <nav {...props} ref={ref} aria-label={label} className={cx("td-tree", "td-react-tree", className)}>
      <ul className="td-react-tree-list">{nodes.map(renderNode)}</ul>
    </nav>
  );
});
