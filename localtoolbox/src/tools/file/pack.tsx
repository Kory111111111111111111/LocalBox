// File category — 9 tools: archives, table conversions, hashing, stats.
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import Papa from "papaparse";
import { zipSync, type Zippable } from "fflate";
import ToolLayout from "../../components/ToolLayout";
import EditorPane from "../../components/EditorPane";
import Dropzone, { toDropped, type DroppedFile } from "../../components/Dropzone";
import { Note, NumField, OptionsBar, OutputArea, RunButton, SelField, StatGrid, Toggle } from "../../components/ui";
import { downloadBlob, formatBytes, zipFiles } from "../../lib/download";

// file-hash lives in the crypto pack; re-export it here so the slug resolves.
import { tools as cryptoTools } from "../crypto/pack";
const FileHashRedirect: ComponentType = cryptoTools["file-hash"];

// ── ZIP creator ──
export const ZipCreatorTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [level, setLevel] = useState(6);
  const create = async () => {
    if (!files.length) return;
    setBusy(true);
    try {
      const data: Zippable = {};
      for (const { file } of files) {
        data[file.name] = new Uint8Array(await file.arrayBuffer());
      }
      const zipped = zipSync(data, { level: level as 0 | 6 | 9 });
      downloadBlob("archive.zip", new Blob([zipped as unknown as BlobPart], { type: "application/zip" }));
    } finally {
      setBusy(false);
    }
  };
  const total = files.reduce((a, f) => a + f.file.size, 0);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <Dropzone files={files} onFiles={(f) => setFiles((old) => [...old, ...toDropped(f)])} onRemove={(id) => setFiles((old) => old.filter((x) => x.id !== id))} multiple hint="Any file types — zipped entirely in your browser" />
        <OptionsBar>
          <SelField label="Compression" value={String(level)} onChange={(v) => setLevel(Number(v))} options={[
            { value: "0", label: "Store (no compression)" }, { value: "6", label: "Balanced" }, { value: "9", label: "Maximum" },
          ]} />
          <RunButton onClick={create} busy={busy} disabled={!files.length} label={`Create ZIP (${files.length} files, ${formatBytes(total)})`} />
        </OptionsBar>
      </div>
    </ToolLayout>
  );
};

// ── CSV formatter ──
export const CsvFormatterTool: ComponentType = () => {
  const [text, setText] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const result = useMemo(() => {
    if (!text.trim()) return { out: "", error: null as string | null, stats: null as string | null };
    try {
      const parsed = Papa.parse<string[]>(text.trim(), { delimiter: delimiter === "auto" ? undefined : delimiter, skipEmptyLines: true });
      if (parsed.errors.length && parsed.data.length === 0) throw new Error(parsed.errors[0].message);
      const out = Papa.unparse(parsed.data, { delimiter: delimiter === "auto" ? "," : delimiter === ";" ? ";" : delimiter === "tab" ? "\t" : "," });
      const cols = parsed.data[0]?.length ?? 0;
      return { out, error: null, stats: `${parsed.data.length} rows × ${cols} columns` };
    } catch (e) {
      return { out: "", error: e instanceof Error ? e.message : String(e), stats: null };
    }
  }, [text, delimiter]);
  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} output={result.out} error={result.error} rows={10} filename="formatted.csv"
        options={
          <OptionsBar>
            <SelField label="Delimiter" value={delimiter} onChange={setDelimiter} options={[
              { value: "auto", label: "Auto-detect input" }, { value: ",", label: "Comma" }, { value: ";", label: "Semicolon" }, { value: "tab", label: "Tab" },
            ]} />
            {result.stats && <span className="text-xs text-ink-dim self-center ml-auto">{result.stats}</span>}
          </OptionsBar>
        } />
    </ToolLayout>
  );
};

// ── CSV → HTML table ──
export const CsvToTableTool: ComponentType = () => {
  const [text, setText] = useState("");
  const [header, setHeader] = useState(true);
  const parsed = useMemo(() => {
    if (!text.trim()) return null;
    const res = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true });
    return res.data as string[][];
  }, [text]);
  const html = useMemo(() => {
    if (!parsed || parsed.length === 0) return "";
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const body = parsed.slice(header ? 1 : 0);
    const thead = header ? `<thead>\n  <tr>${parsed[0].map((c) => `<th>${esc(c)}</th>`).join("")}</tr>\n</thead>\n` : "";
    return `<table>\n${thead}<tbody>\n${body.map((row) => `  <tr>${row.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("\n")}\n</tbody>\n</table>`;
  }, [parsed, header]);
  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} output={html} rows={9} filename="table.html" mime="text/html"
        options={<OptionsBar><Toggle label="First row is a header" checked={header} onChange={setHeader} /></OptionsBar>}
        outputNode={
          <div className="flex flex-col gap-2">
            {parsed && parsed.length > 0 && (
              <div className="card overflow-auto max-h-72">
                <table className="w-full text-[13px]">
                  {header && (
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wide text-ink-dim border-b border-border">
                        {parsed[0].map((c, i) => <th key={i} className="px-3 py-1.5">{c}</th>)}
                      </tr>
                    </thead>
                  )}
                  <tbody className="divide-y divide-border-subtle">
                    {parsed.slice(header ? 1 : 0).map((row, i) => (
                      <tr key={i} className="hover:bg-surface-2">{row.map((c, j) => <td key={j} className="px-3 py-1">{c}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <OutputArea text={html} filename="table.html" rows={4} label="HTML" mime="text/html" />
          </div>
        } />
    </ToolLayout>
  );
};

// ── JSON → table ──
export const JsonToTableTool: ComponentType = () => {
  const [text, setText] = useState("");
  const parsed = useMemo(() => {
    if (!text.trim()) return null;
    try { return JSON.parse(text); } catch { return undefined; }
  }, [text]);
  const rows = useMemo(() => {
    if (!parsed) return null;
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    if (!arr.length || typeof arr[0] !== "object") return null;
    const cols = [...new Set(arr.flatMap((o) => Object.keys(o as object)))];
    return { cols, data: arr as Record<string, unknown>[] };
  }, [parsed]);
  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} rows={9} inputLabel="JSON (array of objects)" filename="table.html"
        error={parsed === undefined ? "Invalid JSON" : null}
        sample={JSON.stringify([{ id: 1, name: "Merge PDF", local: true }, { id: 2, name: "Word Counter", local: true }], null, 2)}
        outputNode={
          rows ? (
            <div className="card overflow-auto max-h-96">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-ink-dim border-b border-border">
                    {rows.cols.map((c) => <th key={c} className="px-3 py-1.5">{c}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {rows.data.map((row, i) => (
                    <tr key={i} className="hover:bg-surface-2">
                      {rows.cols.map((c) => <td key={c} className="px-3 py-1 font-mono">{row[c] === undefined ? "—" : typeof row[c] === "object" ? JSON.stringify(row[c]) : String(row[c])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="card p-6 text-sm text-ink-dim">Provide an array of flat objects to render a table.</div>
        } />
    </ToolLayout>
  );
};

// ── Excel / CSV → JSON (SheetJS-style via community xlsx is heavyweight; use Papa for CSV, minimal XLSX reader for .xlsx) ──
export const ExcelToJsonTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [out, setOut] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState("");
  const [sheets, setSheets] = useState<string[]>([]);
  const dataRef = useRef<Record<string, Record<string, unknown>[]>>({});

  const process = async () => {
    const file = files[0]?.file;
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      if (/\.csv$/i.test(file.name) || file.type === "text/csv") {
        const text = await file.text();
        const res = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
        dataRef.current = { Sheet1: res.data as Record<string, unknown>[] };
        setSheets(["Sheet1"]);
        setSheet("Sheet1");
        setOut(JSON.stringify(res.data, null, 2));
      } else {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
        const data: Record<string, Record<string, unknown>[]> = {};
        for (const name of wb.SheetNames) {
          data[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: null }) as Record<string, unknown>[];
        }
        dataRef.current = data;
        setSheets(wb.SheetNames);
        setSheet(wb.SheetNames[0] ?? "");
        setOut(JSON.stringify(data[wb.SheetNames[0]] ?? [], null, 2));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setOut("");
    }
    setBusy(false);
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <Dropzone files={files} onFiles={(f) => setFiles(toDropped(f))} accept=".xlsx,.xls,.csv" hint=".xlsx, legacy .xls, or CSV" />
        <RunButton onClick={process} busy={busy} disabled={!files.length} label="Convert to JSON" />
        {error && <Note kind="error">{error}</Note>}
        {sheets.length > 1 && (
          <OptionsBar>
            <SelField label="Sheet" value={sheet} onChange={(s) => { setSheet(s); setOut(JSON.stringify(dataRef.current[s] ?? [], null, 2)); }} options={sheets.map((s) => ({ value: s, label: s }))} />
          </OptionsBar>
        )}
        {out && <OutputArea text={out} filename="converted.json" rows={12} label={`JSON (${(dataRef.current[sheet] ?? []).length} rows)`} />}
      </div>
    </ToolLayout>
  );
};

// ── SQL INSERT → CSV ──
export const SqlToCsvTool: ComponentType = () => {
  const [text, setText] = useState("");
  const result = useMemo(() => {
    if (!text.trim()) return { csv: "", error: null as string | null, rows: 0 };
    try {
      const rows: string[][] = [];
      let columns: string[] | null = null;
      // match INSERT INTO tbl (cols) VALUES (...), (...); — tolerant of quotes and backticks
      const insertRe = /insert\s+(?:or\s+\w+\s+)?into\s+[`"[]?[\w.]+[`"\]]?\s*(?:\(([^)]+)\))?\s*values\s*/gi;
      let match: RegExpExecArray | null;
      const segments: { start: number; cols: string | null }[] = [];
      while ((match = insertRe.exec(text)) !== null) segments.push({ start: match.index + match[0].length, cols: match[1] ?? null });
      if (segments.length === 0) throw new Error("No INSERT INTO … VALUES statements found.");
      if (segments[0].cols) columns = segments[0].cols.split(",").map((c) => c.trim().replace(/[`"'\[\]]/g, ""));
      const parseTuple = (s: string): string[] => {
        const out: string[] = [];
        let cur = "";
        let inStr: string | null = null;
        for (let i = 0; i < s.length; i++) {
          const ch = s[i];
          if (inStr) {
            if (ch === inStr && s[i + 1] === inStr) { cur += ch; i++; }
            else if (ch === inStr) inStr = null;
            else cur += ch;
          } else if (ch === "'" || ch === '"') inStr = ch;
          else if (ch === "(") { /* nested start — capture verbatim */ cur += ch; }
          else if (ch === ",") { out.push(cur.trim()); cur = ""; }
          else cur += ch;
        }
        out.push(cur.trim());
        return out.map((v) => {
          if (/^null$/i.test(v)) return "";
          if (/^'.*'$/.test(v)) return v.slice(1, -1).replace(/''/g, "'");
          return v;
        });
      };
      for (let si = 0; si < segments.length; si++) {
        const end = si + 1 < segments.length ? text.lastIndexOf("(", segments[si + 1].start) : text.length;
        const body = text.slice(segments[si].start, end);
        const tupleRe = /\(((?:[^()']|'[^']*')*)\)/g;
        let tm: RegExpExecArray | null;
        while ((tm = tupleRe.exec(body)) !== null) {
          rows.push(parseTuple(tm[1]));
        }
      }
      const cols = columns ?? rows[0]?.map((_, i) => `col${i + 1}`) ?? [];
      return { csv: Papa.unparse({ fields: cols, data: rows }), error: null, rows: rows.length };
    } catch (e) {
      return { csv: "", error: e instanceof Error ? e.message : String(e), rows: 0 };
    }
  }, [text]);
  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} output={result.csv} error={result.error} rows={10} filename="extracted.csv"
        sample={"INSERT INTO tools (id, name, local) VALUES\n  (1, 'Merge PDF', 1),\n  (2, 'Word Counter', 1);"}
        outputNode={
          <div className="flex flex-col gap-2">
            {result.rows > 0 && <span className="text-xs text-ink-dim">{result.rows} data rows extracted</span>}
            <OutputArea text={result.csv} filename="extracted.csv" rows={6} label="CSV" />
          </div>
        } />
    </ToolLayout>
  );
};

// ── File size calculator ──
export const FileSizeCalcTool: ComponentType = () => {
  const [value, setValue] = useState(500);
  const [unit, setUnit] = useState("MB");
  const [perSecond, setPerSecond] = useState(50);
  const factor: Record<string, number> = { b: 1, kb: 1e3, mb: 1e6, gb: 1e9, tb: 1e12, kib: 1024, mib: 1024 ** 2, gib: 1024 ** 3, tib: 1024 ** 4 };
  const bytes = value * (factor[unit] ?? 1);
  const units: [string, string][] = [["bit", "bits"], ["B", "bytes"], ["kB", "kilobytes"], ["MB", "megabytes"], ["GB", "gigabytes"], ["TB", "terabytes"], ["KiB", "kibibytes"], ["MiB", "mebibytes"], ["GiB", "gibibytes"]];
  const decimals: Record<string, number> = { bit: 0, B: 0, kB: 2, MB: 2, GB: 3, TB: 4, KiB: 1, MiB: 2, GiB: 3 };
  const map: Record<string, number> = { bit: bytes * 8, B: bytes, kB: bytes / 1e3, MB: bytes / 1e6, GB: bytes / 1e9, TB: bytes / 1e12, KiB: bytes / 1024, MiB: bytes / 1024 ** 2, GiB: bytes / 1024 ** 3 };
  void units;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="Amount" value={value} onChange={(v) => setValue(v || 0)} />
          <SelField label="Unit" value={unit} onChange={setUnit} options={["b", "kb", "mb", "gb", "tb", "kib", "mib", "gib", "tib"].map((u) => ({ value: u, label: u.toUpperCase() }))} />
          <NumField label="Transfer speed (MB/s)" value={perSecond} onChange={(v) => setPerSecond(Math.max(1, v || 1))} />
        </OptionsBar>
        <StatGrid items={[
          { label: "Bytes", value: map.B.toLocaleString(), strong: true },
          { label: "Kilobytes (kB)", value: map.kB.toLocaleString(undefined, { maximumFractionDigits: 2 }) },
          { label: "Megabytes (MB)", value: map.MB.toLocaleString(undefined, { maximumFractionDigits: 3 }) },
          { label: "Gigabytes (GB)", value: map.GB.toLocaleString(undefined, { maximumFractionDigits: 4 }) },
          { label: "Mebibytes (MiB)", value: map.MiB.toLocaleString(undefined, { maximumFractionDigits: 2 }) },
          { label: "Bits", value: map.bit.toLocaleString() },
          { label: `Transfer at ${perSecond} MB/s`, value: map.B === 0 ? "—" : `${(map.MB / perSecond).toFixed(1)}s (~${(map.MB / perSecond / 60).toFixed(1)} min)` },
          { label: "MP3 minutes (128 kbps)", value: `${(bytes / 16000 / 60).toFixed(1)} min` },
        ]} />
        <Note>Decimal units (kB/MB/GB = 1000-based) vs binary units (KiB/MiB/GiB = 1024-based) — drive makers and OSes disagree, which is why a "1 TB" drive shows ~931 GB.</Note>
      </div>
    </ToolLayout>
  );
};

// ── File statistics ──
export const TextFileStatsTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [stats, setStats] = useState<null | { name: string; size: number; lines: number; words: number; chars: number; longest: number; blank: number }>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const file = files[0]?.file;
    if (!file) { setStats(null); return; }
    (async () => {
      try {
        const text = await file.text();
        const lines = text.split(/\r?\n/);
        setStats({
          name: file.name, size: file.size,
          lines: lines.length,
          words: (text.match(/\S+/g) ?? []).length,
          chars: text.length,
          longest: lines.reduce((a, l) => Math.max(a, l.length), 0),
          blank: lines.filter((l) => !l.trim()).length,
        });
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [files]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <Dropzone files={files} onFiles={(f) => setFiles(toDropped(f))} accept="text/*,.txt,.md,.csv,.json,.log" hint="Text files (txt, md, csv, json, logs…)" />
        {error && <Note kind="error">{error}</Note>}
        {stats && (
          <StatGrid items={[
            { label: "File", value: stats.name.slice(0, 22), strong: true },
            { label: "Size", value: formatBytes(stats.size) },
            { label: "Lines", value: stats.lines.toLocaleString(), strong: true },
            { label: "Words", value: stats.words.toLocaleString() },
            { label: "Characters", value: stats.chars.toLocaleString() },
            { label: "Longest line", value: `${stats.longest.toLocaleString()} chars` },
            { label: "Blank lines", value: stats.blank.toLocaleString() },
            { label: "Avg line length", value: stats.lines ? `${Math.round(stats.chars / stats.lines)} chars` : "—" },
          ]} />
        )}
      </div>
    </ToolLayout>
  );
};

// ── Archive extract helper (ZIP) — bonus used by none of the slugs; keep private ──
export const tools: Record<string, ComponentType> = {
  "zip-creator": ZipCreatorTool,
  "csv-formatter": CsvFormatterTool,
  "csv-to-table": CsvToTableTool,
  "json-to-table": JsonToTableTool,
  "excel-to-json": ExcelToJsonTool,
  "sql-to-csv": SqlToCsvTool,
  "file-size-calc": FileSizeCalcTool,
  "text-file-stats": TextFileStatsTool,
  "file-hash": FileHashRedirect,
};
