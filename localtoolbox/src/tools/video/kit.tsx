// Shared workbench for ffmpeg-backed tools: dropzone → options → run → download(s).
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import ToolLayout from "../../components/ToolLayout";
import Dropzone, { toDropped, type DroppedFile } from "../../components/Dropzone";
import { Note, ProgressBar, RunButton } from "../../components/ui";
import { downloadBlob, formatBytes, zipFiles } from "../../lib/download";
import { cleanup, getFFmpeg, onFFmpegProgress, readFileBlob, sanitizeName, writeFile } from "./ff";

export type FFResult = { name: string; blob: Blob }[];

export type FFToolConfig<S extends object> = {
  accept: string;
  hint?: string;
  multiple?: boolean;
  minFiles?: number;
  /** Probe data about the first input (duration seconds) when available. */
  controls?: (s: S, set: (patch: Partial<S>) => void, probe: { duration: number } | null) => ReactNode;
  /** Return ffmpeg args (already includes -i inputs) and expected outputs. `ff` lets you write auxiliary files (e.g. concat lists). */
  run: (files: File[], s: S, ctx: { probe: { duration: number } | null; ff: import("@ffmpeg/ffmpeg").FFmpeg }) => Promise<{ args: string[]; outputs: string[] }>;
  outName?: (s: S, firstFile: File) => string;
  previewMime?: string;
  initNote?: ReactNode;
};

export function makeFFmpegTool<S extends object>(cfg: FFToolConfig<S>): ComponentType {
  return function FFmpegWorkbench() {
    const [files, setFiles] = useState<DroppedFile[]>([]);
    const [state, setState] = useState<S>({} as S);
    const [busy, setBusy] = useState(false);
    const [phase, setPhase] = useState("");
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<FFResult>([]);
    const [engineNote, setEngineNote] = useState("");
    const probeRef = useRef<{ duration: number } | null>(null);
    const objectUrls = useRef<string[]>([]);

    useEffect(() => () => objectUrls.current.forEach((u) => URL.revokeObjectURL(u)), []);

    const set = (patch: Partial<S>) => setState((s) => ({ ...s, ...patch }));

    const execute = async () => {
      const list = files.map((f) => f.file);
      const min = cfg.minFiles ?? 1;
      if (list.length < min) { setError(`Add at least ${min} file${min > 1 ? "s" : ""}.`); return; }
      setBusy(true);
      setError(null);
      setResults([]);
      setProgress(0);
      setPhase("Preparing…");
      let usedNames: string[] = [];
      try {
        const ff = await getFFmpeg((msg) => setEngineNote(msg));
        const off = onFFmpegProgress((ratio) => setProgress(Math.max(0, Math.min(1, ratio))));
        try {
          usedNames = [];
          for (const f of list) usedNames.push(await writeFile(ff, f.name, f));
          setPhase("Processing…");
          const { args, outputs } = await cfg.run(list, state, { probe: probeRef.current, ff });
          await ff.exec(args);
          const out: FFResult = [];
          for (const name of outputs) {
            out.push({ name: sanitizeName(name), blob: await readFileBlob(ff, name) });
          }
          objectUrls.current.forEach((u) => URL.revokeObjectURL(u));
          objectUrls.current = out.map((r) => URL.createObjectURL(r.blob));
          setResults(out);
          setPhase("Done.");
        } finally {
          off();
          await cleanup(ff, usedNames);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
      setBusy(false);
    };

    const download = () => {
      if (results.length === 1) downloadBlob(results[0].name, results[0].blob);
      else if (results.length > 1) {
        (async () => {
          const entries: Record<string, Uint8Array> = {};
          for (const r of results) entries[r.name] = new Uint8Array(await r.blob.arrayBuffer());
          downloadBlob("output.zip", zipFiles(entries));
        })();
      }
    };

    // lazy duration probe (HTMLVideoElement metadata) for the first file
    useEffect(() => {
      const first = files[0]?.file;
      if (!first) { probeRef.current = null; return; }
      const url = URL.createObjectURL(first);
      const el = document.createElement(first.type.startsWith("audio") ? "audio" : "video");
      el.preload = "metadata";
      el.onloadedmetadata = () => {
        probeRef.current = { duration: el.duration };
        setPhase((p) => p); // trigger rerender
        URL.revokeObjectURL(url);
      };
      el.onerror = () => URL.revokeObjectURL(url);
      el.src = url;
    }, [files]);

    return (
      <ToolLayout>
        <div className="flex flex-col gap-4">
          <Dropzone files={files} onFiles={(f) => setFiles(cfg.multiple ? [...files, ...toDropped(f)] : toDropped(f))} onRemove={cfg.multiple ? (id) => setFiles((old) => old.filter((x) => x.id !== id)) : undefined} multiple={cfg.multiple} accept={cfg.accept} hint={cfg.hint} />
          {cfg.initNote}
          {cfg.controls && <div className="card p-3.5 flex flex-wrap items-end gap-3">{cfg.controls(state, set, files.length ? probeRef.current : null)}</div>}
          {error && <Note kind="error">{error}</Note>}
          <div className="flex flex-wrap items-center gap-3">
            <RunButton onClick={execute} busy={busy} label="Process" />
            {results.length > 0 && (
              <button className="btn-primary" onClick={download}>
                Download {results.length > 1 ? `ZIP (${results.length} files)` : results[0].name}
              </button>
            )}
            {results.length === 1 && <span className="text-xs text-ink-dim">{formatBytes(results[0].blob.size)}</span>}
          </div>
          {busy && (
            <div className="flex flex-col gap-1.5">
              <ProgressBar value={progress || 0.03} label={`${phase} ${progress > 0.02 ? `(${Math.round(progress * 100)}%)` : ""}`} />
              {engineNote && <span className="text-[11px] text-ink-dim">{engineNote}</span>}
            </div>
          )}
          {results.length > 1 && (
            <ul className="card divide-y divide-border-subtle overflow-hidden text-[13px]">
              {results.map((r) => (
                <li key={r.name} className="flex items-center gap-3 px-3 py-2">
                  <span className="flex-1 truncate font-mono">{r.name}</span>
                  <span className="text-ink-dim text-xs">{formatBytes(r.blob.size)}</span>
                  <button className="btn-ghost !px-2 !py-0.5 text-xs" onClick={() => downloadBlob(r.name, r.blob)}>Save</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ToolLayout>
    );
  };
}
