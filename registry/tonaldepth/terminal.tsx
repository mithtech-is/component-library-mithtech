import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-terminal.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * What a line is, which decides how it is set.
 *
 * These are the severities of a *run*, not the tokens of a language — that is
 * the whole difference between this and `CodeBlock`. `ok` and `error` are the
 * result; `dim` is the noise a build prints on the way.
 */
export type TonalDepthTerminalLineKind = "command" | "output" | "dim" | "info" | "ok" | "error";

export interface TonalDepthTerminalLine {
  kind?: TonalDepthTerminalLineKind;
  text: ReactNode;
}

export interface TonalDepthTerminalProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** What ran, and what it said. */
  lines: TonalDepthTerminalLine[];
  /** The window's title bar — "deploy · commercely · main". */
  title?: ReactNode;
  /** The prompt character put in front of a `command` line. Default `$`. */
  prompt?: string;
  /** Show a blinking cursor after the last line — the run is still going. */
  live?: boolean;
  /** Accessible name. Default "TonalDepthTerminal output". */
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
export const TonalDepthTerminal = forwardRef<HTMLDivElement, TonalDepthTerminalProps>(function TonalDepthTerminal(
  { lines, title, prompt = "$", live = false, label = "TonalDepthTerminal output", className, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} className={cx("td-registry-terminal", className)}>
      {title !== undefined ? (
        <div className="td-registry-terminal-head">
          <span className="td-registry-terminal-lights" aria-hidden="true">
            <span className="td-registry-terminal-light td-registry-terminal-light--r" />
            <span className="td-registry-terminal-light td-registry-terminal-light--y" />
            <span className="td-registry-terminal-light td-registry-terminal-light--g" />
          </span>
          <span className="td-registry-terminal-title">{title}</span>
        </div>
      ) : null}
      {/* `tabindex` and `role="region"` because the body scrolls: a scrollable
          area that cannot be focused cannot be scrolled from the keyboard. */}
      <div className="td-registry-terminal-body" role="region" aria-label={label} tabIndex={0}>
        {lines.map((line, index) => {
          const kind = line.kind ?? "output";
          return (
            <p className="td-registry-terminal-line" data-kind={kind} key={index}>
              {kind === "command" ? <span className="td-registry-terminal-prompt" aria-hidden="true">{prompt}</span> : null}
              <span className="td-registry-terminal-text">{line.text}</span>
            </p>
          );
        })}
        {live ? (
          <p className="td-registry-terminal-line" data-kind="command">
            <span className="td-registry-terminal-prompt" aria-hidden="true">{prompt}</span>
            <span className="td-registry-terminal-cursor" aria-hidden="true" />
          </p>
        ) : null}
      </div>
    </div>
  );
});
