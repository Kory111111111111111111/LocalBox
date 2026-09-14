// Small form + output primitives shared by tool workbenches.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy, Download, AlertTriangle, Info } from "lucide-react";
import { copyToClipboard, downloadText } from "../lib/download";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <button
      type="button"
      className="btn-ghost !py-1 !px-2 text-xs"
      onClick={async () => {
        if (await copyToClipboard(text)) {
          setDone(true);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setDone(false), 1400);
        }
      }}
      disabled={!text}
    >
      {done ? <Check size={12} className="text-success" /> : <Copy size={12} />}
      {done ? "Copied" : label}
    </button>
  );
}

export function DownloadTextButton({
  text,
  filename,
  label = "Download",
  mime = "text/plain;charset=utf-8",
}: {
  text: string;
  filename: string;
  label?: string;
  mime?: string;
}) {
  return (
    <button
      type="button"
      className="btn-ghost !py-1 !px-2 text-xs"
      disabled={!text}
      onClick={() => downloadText(filename, text, mime)}
    >
      <Download size={12} />
      {label}
    </button>
  );
}

/** Mono output box with copy/download toolbar. */
export function OutputArea({
  text,
  filename,
  mime,
  rows = 8,
  label = "Output",
  empty = "Output will appear here.",
}: {
  text: string;
  filename?: string;
  mime?: string;
  rows?: number;
  label?: string;
  empty?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="label !mb-0">{label}</span>
        <span className="ml-auto flex gap-1.5">
          <CopyButton text={text} />
          {filename && <DownloadTextButton text={text} filename={filename} mime={mime} />}
        </span>
      </div>
      <div
        className="card p-3 font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-all min-h-16"
        style={{ minHeight: `${rows * 1.2}rem` }}
        aria-live="polite"
      >
        {text || <span className="text-ink-dim">{empty}</span>}
      </div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-ink-dim mt-1">{hint}</span>}
    </label>
  );
}

export function NumField({
  label, value, onChange, min, max, step = 1, hint,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="number"
        className="input"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.valueAsNumber)}
      />
    </Field>
  );
}

export function SelField<T extends string>({
  label, value, onChange, options, hint,
}: {
  label: string; value: T; onChange: (v: T) => void;
  options: { value: T; label: string }[]; hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Field>
  );
}

export function Toggle({
  label, checked, onChange, hint,
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string;
}) {
  return (
    <label className="flex items-start gap-2.5 py-1 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-[var(--color-accent)] w-4 h-4"
      />
      <span className="text-sm">
        {label}
        {hint && <span className="block text-[11px] text-ink-dim">{hint}</span>}
      </span>
    </label>
  );
}

export function Note({ kind = "info", children }: { kind?: "info" | "warn" | "error"; children: ReactNode }) {
  const cls =
    kind === "warn"
      ? "border-warning/30 bg-warning/10 text-warning"
      : kind === "error"
        ? "border-danger/30 bg-danger/10 text-danger"
        : "border-info/30 bg-info/10 text-info";
  const Icon = kind === "info" ? Info : AlertTriangle;
  return (
    <div className={`flex items-start gap-2 rounded-tool-sm border px-3 py-2 text-[13px] ${cls}`}>
      <Icon size={14} className="mt-0.5 shrink-0" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

/** Key/value stat row grid for calculators. */
export function StatGrid({ items }: { items: { label: string; value: ReactNode; strong?: boolean }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {items.map((s, i) => (
        <div key={i} className="card px-3 py-2.5">
          <div className="text-[11px] text-ink-dim uppercase tracking-wide">{s.label}</div>
          <div className={`mt-0.5 font-mono ${s.strong ? "text-lg text-accent" : "text-sm text-ink"}`}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Horizontal options bar used by most tools. */
export function OptionsBar({ children }: { children: ReactNode }) {
  return <div className="card p-3.5 flex flex-wrap items-end gap-3">{children}</div>;
}

export function RunButton({
  onClick, busy = false, label = "Run", disabled = false,
}: {
  onClick: () => void; busy?: boolean; label?: string; disabled?: boolean;
}) {
  return (
    <button className="btn-primary" onClick={onClick} disabled={busy || disabled}>
      {busy && (
        <span
          className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"
          aria-hidden
        />
      )}
      {busy ? "Working…" : label}
    </button>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-ink-muted">
      <div
        className="h-1.5 flex-1 rounded-full bg-surface-3 overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(value * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full bg-accent transition-[width]" style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }} />
      </div>
      {label && <span className="tabular-nums shrink-0">{label}</span>}
    </div>
  );
}
