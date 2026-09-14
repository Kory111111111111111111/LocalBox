import { useRef, useState, type ReactNode } from "react";
import { UploadCloud, X } from "lucide-react";
import { formatBytes } from "../lib/download";

export type DroppedFile = { file: File; id: string };

let idc = 0;
export const toDropped = (files: File[]): DroppedFile[] =>
  files.map((file) => ({ file, id: `f${++idc}` }));

export default function Dropzone({
  files,
  onFiles,
  onRemove,
  multiple = false,
  accept,
  hint,
}: {
  files: DroppedFile[];
  onFiles: (files: File[]) => void;
  onRemove?: (id: string) => void;
  multiple?: boolean;
  accept?: string;
  hint?: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCount = useRef(0);
  const [over, setOver] = useState(false);

  return (
    <div
      className={`rounded-tool border-2 border-dashed px-6 py-10 min-h-44 text-center transition-colors cursor-pointer ${
        over ? "border-border-focus bg-accent-muted" : "border-border bg-surface-3 hover:border-ink-dim"
      }`}
      onDragEnter={(e) => {
        e.preventDefault();
        dragCount.current += 1;
        setOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        dragCount.current = Math.max(0, dragCount.current - 1);
        if (dragCount.current === 0) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragCount.current = 0;
        setOver(false);
        const dropped = Array.from(e.dataTransfer.files);
        if (dropped.length) onFiles(multiple ? dropped : [dropped[0]]);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Drop files here or click to browse"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple={multiple}
        accept={accept}
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? []);
          if (picked.length) onFiles(multiple ? picked : [picked[0]]);
          e.target.value = "";
        }}
      />
      <UploadCloud size={22} className="mx-auto text-ink-dim mb-2" />
      <div className="text-sm text-ink">
        Drop {multiple ? "files" : "a file"} here or <span className="text-accent">click to browse</span>
      </div>
      {hint && <div className="text-xs text-ink-dim mt-1">{hint}</div>}
      {files.length > 0 && (
        <ul className="mt-4 text-left space-y-1.5" onClick={(e) => e.stopPropagation()}>
          {files.map(({ file, id }) => (
            <li
              key={id}
              className="flex items-center gap-2 rounded-tool-sm border border-border bg-surface px-2.5 py-1.5 text-[13px]"
            >
              <span className="truncate flex-1">{file.name}</span>
              <span className="text-ink-dim text-xs tabular-nums shrink-0">{formatBytes(file.size)}</span>
              {onRemove && (
                <button
                  type="button"
                  className="text-ink-dim hover:text-danger transition-colors"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => onRemove(id)}
                >
                  <X size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
