"use client";

import { forwardRef, useEffect, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-undobar.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthUndoBarProps extends HTMLAttributes<HTMLDivElement> {
  /** The message — what was done, e.g. `"Invoice INV-0231 archived."` */
  children: ReactNode;
  /** Called when the reader presses Undo. The caller then removes the bar. */
  onUndo: () => void;
  /**
   * Called when the timer empties with no undo — the action commits for good.
   * The caller then removes the bar. Optional: sometimes the action already
   * happened and committing is just letting it stand.
   */
  onCommit?: () => void;
  /** Seconds before the action commits. Default 6. */
  duration?: number;
  /** The undo control's label. Default `"Undo"`. */
  undoLabel?: string;
}

/**
 * The reversible-action bar — the answer to "are you sure?" that does not stop
 * the reader. Do the destructive-but-reversible thing immediately, then show
 * this: the papaya hairline drains, and when it empties the action commits;
 * Undo puts it back.
 *
 * The raised bar, the timer hairline and the undo control are the base
 * `.td-undobar*` in `tonaldepth-core` ([[L16]]). **The commit is driven by a
 * timer, not by the hairline's animation** — so it still fires for a reader who
 * has asked for no motion, where the countdown does not animate.
 *
 * **Not a `Dialog` confirmation.** A confirm modal blocks the page to ask
 * permission before acting; this acts first and offers a way back, which is
 * faster for everyone and interrupts no one. **Not a `Toast`**, which only
 * announces and auto-dismisses — it carries no reversible action or timer.
 */
export const TonalDepthUndoBar = forwardRef<HTMLDivElement, TonalDepthUndoBarProps>(function TonalDepthUndoBar(
  { children, onUndo, onCommit, duration = 6, undoLabel = "Undo", className, style, ...props },
  ref,
) {
  const done = useRef(false);
  const onUndoRef = useRef(onUndo);
  onUndoRef.current = onUndo;
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (done.current) return;
      done.current = true;
      onCommitRef.current?.();
    }, duration * 1000);
    return () => window.clearTimeout(id);
  }, [duration]);

  const handleUndo = () => {
    // The guard stops a commit that is already in flight from also firing if the
    // caller is a beat slow to unmount the bar.
    if (done.current) return;
    done.current = true;
    onUndoRef.current();
  };

  return (
    <div
      {...props}
      ref={ref}
      role="status"
      className={cx("td-undobar", "td-registry-undobar", className)}
      style={{ ["--td-undobar-duration"]: `${duration}s`, ...style } as CSSProperties}
    >
      <span>{children}</span>
      <button type="button" className="td-undobar-undo" onClick={handleUndo}>
        {undoLabel}
      </button>
      <span className="td-undobar-timer" aria-hidden="true" />
    </div>
  );
});
