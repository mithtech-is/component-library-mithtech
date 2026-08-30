"use client";

/**
 * The dropzone.
 *
 * There is no separate `ImageUpload`: it is this component with
 * `accept="image/*" preview`, because the reader does exactly the same thing —
 * hand over a file — and only what the zone draws afterwards differs. A second
 * component would have to be kept in step with this one's drag states, its
 * keyboard path and its rejection rules, for the sake of one thumbnail.
 */

import {
  forwardRef, useEffect, useRef, useState,
  type DragEvent, type InputHTMLAttributes, type ReactNode,
} from "react";
import { cx } from "./utils";
import { CloseIcon, FileIcon, LAMP_WEIGHT } from "./icons";
import "./upload.css";

export interface FileUploadProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "files" | "title"> {
  /** The chosen files. Controlled — pair with `onFilesChange`. */
  files?: File[];
  onFilesChange?: (files: File[]) => void;
  /** Headline inside the zone. */
  title?: ReactNode;
  /** The line under it — say the limits here, not in a tooltip. */
  hint?: ReactNode;
  /**
   * Draw a thumbnail for each image file. This is what makes the component an
   * image upload; it does nothing for a file the browser cannot render.
   */
  preview?: boolean;
  /** Refuse anything larger, in bytes. */
  maxSize?: number;
  invalid?: boolean;
  containerClassName?: string;
}

const formatSize = (bytes: number) =>
  bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(function FileUpload(
  {
    files, onFilesChange, title = "Drop a file here", hint = "or browse", preview = false,
    maxSize, multiple, accept, invalid = false, disabled, className, containerClassName,
    "aria-invalid": ariaInvalid, id, ...props
  },
  ref,
) {
  const [uncontrolled, setUncontrolled] = useState<File[]>([]);
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chosen = files ?? uncontrolled;
  const effectiveInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";

  const commit = (next: File[]) => {
    if (files === undefined) setUncontrolled(next);
    onFilesChange?.(next);
  };

  const accepted = (incoming: File[]) => {
    const tooBig = maxSize !== undefined ? incoming.filter(f => f.size > maxSize) : [];
    setRejected(tooBig.length ? `${tooBig[0]!.name} is larger than ${formatSize(maxSize!)}` : null);
    const ok = maxSize !== undefined ? incoming.filter(f => f.size <= maxSize) : incoming;
    return multiple ? [...chosen, ...ok] : ok.slice(0, 1);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setOver(false);
    if (disabled) return;
    commit(accepted([...event.dataTransfer.files]));
  };

  return (
    <div className={cx("td-react-upload", containerClassName)}>
      <div
        className="td-dropzone"
        data-state={over ? "over" : undefined}
        data-disabled={disabled || undefined}
        onDragOver={event => { event.preventDefault(); if (!disabled) setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <FileIcon className="td-dropzone-icon" weight={LAMP_WEIGHT} aria-hidden="true" />
        <span className="td-dropzone-title">{title}</span>
        <span className="td-dropzone-text">{hint}</span>
        {/*
          The input covers the zone rather than sitting beside it, so the whole
          plate is one target for the pointer and one stop for the keyboard —
          a visually-hidden input would leave the zone unreachable by Tab.
        */}
        <input
          {...props}
          ref={node => {
            inputRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          id={id}
          type="file"
          className={cx("td-dropzone-browse", className)}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          aria-invalid={effectiveInvalid || undefined}
          onChange={event => commit(accepted([...(event.target.files ?? [])]))}
        />
      </div>

      {rejected ? <p className="td-react-upload-reject" role="alert">{rejected}</p> : null}

      {chosen.length ? (
        <ul className="td-react-upload-list">
          {chosen.map(file => (
            <li className="td-react-upload-item" key={`${file.name}-${file.size}`}>
              {preview && file.type.startsWith("image/") ? <Thumb file={file} /> : null}
              <span className="td-react-upload-name">{file.name}</span>
              <span className="td-react-upload-size">{formatSize(file.size)}</span>
              <button
                type="button"
                className="td-taginput-x"
                aria-label={`Remove ${file.name}`}
                disabled={disabled}
                onClick={() => commit(chosen.filter(f => f !== file))}
              >
                <CloseIcon weight={LAMP_WEIGHT} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
});

/** An object URL for one picked image, revoked when the item goes. */
function Thumb({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url ? <img className="td-react-upload-thumb" src={url} alt="" /> : <span className="td-react-upload-thumb" />;
}
