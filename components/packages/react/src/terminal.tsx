import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./terminal.css";

/**
 * What a line is, which decides how it is set.
 *
 * These are the severities of a *run*, not the tokens of a language — that is
 * the whole difference between this and `CodeBlock`. `ok` and `error` are the
 * result; `dim` is the noise a build prints on the way.
 */
export type TerminalLineKind = "command" | "output" | "dim" | "info" | "ok" | "error";

export interface TerminalLine {
  kind?: TerminalLineKind;
  text: ReactNode;
}

export interface TerminalProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** What ran, and what it said. */
  lines: TerminalLine[];
  /** The window's title bar — "deploy · commercely · main". */
  title?: ReactNode;
  /** The prompt character put in front of a `command` line. Default `$`. */
  prompt?: string;
  /** Show a blinking cursor after the last line — the run is still going. */
  live?: boolean;
  /** Accessible name. Default "Terminal output". */
  label?: string;
}

/**
 * A transcript of something that ran.
 *
 * Not `CodeBlock`, and the test is what the reader does with it. A code block
 * is source: you copy it and run it, which is why it carries a `CopyChip` and a
 * language. A terminal is the record of a run that already happened: you read
 * it to find out what it said. Copying a transcript — prompts, spinners,
 * timings and all — is not a thing anyone wants, so there is no copy control.
 *
 * It does not run anything, does not stream, and does not interpret ANSI escape
 * codes. Give it lines with a `kind`; the component sets them.
 */
export const Terminal = forwardRef<HTMLDivElement, TerminalProps>(function Terminal(
  { lines, title, prompt = "$", live = false, label = "Terminal output", className, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} className={cx("td-react-terminal", className)}>
      {title !== undefined ? (
        <div className="td-react-terminal-head">
          <span className="td-react-terminal-lights" aria-hidden="true">
            <span className="td-react-terminal-light td-react-terminal-light--r" />
            <span className="td-react-terminal-light td-react-terminal-light--y" />
            <span className="td-react-terminal-light td-react-terminal-light--g" />
          </span>
          <span className="td-react-terminal-title">{title}</span>
        </div>
      ) : null}
      {/* `tabindex` and `role="region"` because the body scrolls: a scrollable
          area that cannot be focused cannot be scrolled from the keyboard. */}
      <div className="td-react-terminal-body" role="region" aria-label={label} tabIndex={0}>
        {lines.map((line, index) => {
          const kind = line.kind ?? "output";
          return (
            <p className="td-react-terminal-line" data-kind={kind} key={index}>
              {kind === "command" ? <span className="td-react-terminal-prompt" aria-hidden="true">{prompt}</span> : null}
              <span className="td-react-terminal-text">{line.text}</span>
            </p>
          );
        })}
        {live ? (
          <p className="td-react-terminal-line" data-kind="command">
            <span className="td-react-terminal-prompt" aria-hidden="true">{prompt}</span>
            <span className="td-react-terminal-cursor" aria-hidden="true" />
          </p>
        ) : null}
      </div>
    </div>
  );
});
