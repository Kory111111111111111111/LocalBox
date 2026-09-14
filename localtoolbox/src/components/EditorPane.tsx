// Classic input -> output text workbench used by most text/dev tools.
import { useState, type ReactNode } from "react";
import { Eraser, Sparkles } from "lucide-react";
import { CopyButton, DownloadTextButton } from "./ui";

export default function EditorPane({
  value,
  onChange,
  output,
  inputLabel = "Input",
  outputLabel = "Output",
  placeholder = "Paste or type your text here…",
  sample,
  sampleLabel = "Sample",
  filename,
  mime,
  rows = 10,
  options,
  outputNode,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  output?: string;
  inputLabel?: string;
  outputLabel?: string;
  placeholder?: string;
  sample?: string;
  sampleLabel?: string;
  filename?: string;
  mime?: string;
  rows?: number;
  options?: ReactNode;
  outputNode?: ReactNode;
  error?: string | null;
}) {
  const [touched, setTouched] = useState(false);
  return (
    <>
      {options}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="label !mb-0">{inputLabel}</span>
            <span className="ml-auto flex gap-1.5">
              {sample && (
                <button
                  className="btn-ghost !py-1 !px-2 text-xs"
                  onClick={() => {
                    onChange(sample);
                    setTouched(true);
                  }}
                >
                  <Sparkles size={12} />
                  {sampleLabel}
                </button>
              )}
              <button
                className="btn-ghost !py-1 !px-2 text-xs"
                onClick={() => onChange("")}
                disabled={!value}
              >
                <Eraser size={12} />
                Clear
              </button>
            </span>
          </div>
          <textarea
            className="textarea"
            rows={rows}
            value={value}
            placeholder={placeholder}
            aria-label={inputLabel}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
          />
          <div className="text-[11px] text-ink-dim">
            {value.length.toLocaleString()} characters · {value ? value.split("\n").length.toLocaleString() : 0} lines
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="label !mb-0">{outputLabel}</span>
            {output !== undefined && (
              <span className="ml-auto flex gap-1.5">
                <CopyButton text={output} />
                {filename && <DownloadTextButton text={output} filename={filename} mime={mime} />}
              </span>
            )}
          </div>
          {error ? (
            <div
              className="card p-3 font-mono text-[13px] whitespace-pre-wrap border-danger/40 text-danger"
              style={{ minHeight: `${rows * 1.2}rem` }}
              role="alert"
            >
              {error}
            </div>
          ) : outputNode ?? (
            <div
              className="card p-3 font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-all overflow-auto"
              style={{ minHeight: `${rows * 1.2}rem` }}
              aria-live="polite"
            >
              {output || <span className="text-ink-dim">{touched ? "" : "Output will appear here."}</span>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
