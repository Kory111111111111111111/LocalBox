// PDF category — pdf-lib (write) + pdfjs-dist (read/render), all client-side.
import { useEffect, useRef, useState, type ComponentType } from "react";
import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import ToolLayout from "../../components/ToolLayout";
import Dropzone, { toDropped, type DroppedFile } from "../../components/Dropzone";
import { CopyButton, Field, Note, NumField, OptionsBar, ProgressBar, RunButton, SelField, Toggle } from "../../components/ui";
import { downloadBlob, formatBytes, zipFiles } from "../../lib/download";
import { OutputArea } from "../../components/ui";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

type Busy = { on: boolean; label: string; progress?: number };

// ── shared helpers ──
async function fileBytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}
async function renderPageToCanvas(bytes: Uint8Array, pageNumber: number, scale = 2, password?: string): Promise<HTMLCanvasElement> {
  const doc = await pdfjsLib.getDocument({ data: bytes.slice(0), password }).promise;
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport }).promise;
  await doc.destroy();
  return canvas;
}
async function rasterizePdf(bytes: Uint8Array, opts: { quality: number; scale: number; grayscale?: boolean; password?: string; onProgress?: (p: number) => void }): Promise<PDFDocument> {
  const src = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const pageCount = src.getPageCount();
  for (let i = 1; i <= pageCount; i++) {
    const canvas = await renderPageToCanvas(bytes, i, opts.scale, opts.password);
    let blob: Blob;
    if (opts.grayscale) {
      const g = document.createElement("canvas");
      g.width = canvas.width;
      g.height = canvas.height;
      const gctx = g.getContext("2d")!;
      gctx.drawImage(canvas, 0, 0);
      const data = gctx.getImageData(0, 0, g.width, g.height);
      for (let p = 0; p < data.data.length; p += 4) {
        const l = 0.299 * data.data[p] + 0.587 * data.data[p + 1] + 0.114 * data.data[p + 2];
        data.data[p] = data.data[p + 1] = data.data[p + 2] = l;
      }
      gctx.putImageData(data, 0, 0);
      blob = await new Promise<Blob>((res) => g.toBlob((b) => res(b!), "image/jpeg", opts.quality));
    } else {
      blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", opts.quality));
    }
    const img = await out.embedJpg(new Uint8Array(await blob.arrayBuffer()));
    const { width, height } = src.getPage(i).getSize();
    const page = out.addPage([width, height]);
    page.drawImage(img, { x: 0, y: 0, width, height });
    opts.onProgress?.(i / pageCount);
  }
  return out;
}
async function parseRanges(spec: string, max: number): Promise<number[]> {
  const pages = new Set<number>();
  for (const part of spec.split(",")) {
    const p = part.trim();
    if (!p) continue;
    if (p.includes("-")) {
      const [a, b] = p.split("-").map((n) => parseInt(n, 10));
      if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error(`Invalid page range: “${p}”`);
      for (let i = Math.max(1, a); i <= Math.min(max, b); i++) pages.add(i);
    } else {
      const n = parseInt(p, 10);
      if (!Number.isFinite(n)) throw new Error(`Invalid page number: “${p}”`);
      if (n >= 1 && n <= max) pages.add(n);
    }
  }
  return [...pages].sort((a, b) => a - b);
}
function saveDoc(doc: PDFDocument, name: string) {
  return doc.save().then((bytes) => downloadBlob(name, new Blob([bytes as unknown as BlobPart], { type: "application/pdf" })));
}

// ── single-file PDF workbench shell ──
function PdfShell({ children, acceptFiles = false, files, onFiles, busy }: {
  children: React.ReactNode; acceptFiles?: boolean; files?: DroppedFile[]; onFiles?: (f: File[]) => void; busy?: Busy;
}) {
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        {acceptFiles && files && onFiles !== undefined && (
          <Dropzone files={files} onFiles={onFiles} multiple accept="application/pdf,.pdf" hint="PDF files only — processed on your device" />
        )}
        {children}
        {busy?.on && <ProgressBar value={busy.progress ?? 0.05} label={busy.label} />}
      </div>
    </ToolLayout>
  );
}

// ── 1. Merge PDF ──
export const PdfMergeTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [busy, setBusy] = useState<Busy | null>(null);
  const [error, setError] = useState<string | null>(null);

  const merge = async () => {
    if (files.length < 2) { setError("Add at least two PDFs to merge."); return; }
    setError(null);
    setBusy({ on: true, label: "Merging…", progress: 0 });
    try {
      const out = await PDFDocument.create();
      for (let i = 0; i < files.length; i++) {
        const src = await PDFDocument.load(await fileBytes(files[i].file), { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
        setBusy({ on: true, label: `Merging ${i + 1}/${files.length}…`, progress: (i + 1) / files.length });
      }
      await saveDoc(out, "merged.pdf");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(null);
  };
  const move = (i: number, dir: -1 | 1) => {
    setFiles((old) => {
      const j = i + dir;
      if (j < 0 || j >= old.length) return old;
      const copy = [...old];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };
  return (
    <PdfShell acceptFiles files={files} onFiles={(f) => setFiles((old) => [...old, ...toDropped(f)])} busy={busy ?? undefined}>
      {files.length > 0 && (
        <ul className="card divide-y divide-border-subtle overflow-hidden text-[13px]">
          {files.map(({ file, id }, i) => (
            <li key={id} className="flex items-center gap-2 px-3 py-2">
              <span className="text-ink-dim tabular-nums w-5">{i + 1}.</span>
              <span className="flex-1 truncate">{file.name}</span>
              <span className="text-ink-dim text-xs">{formatBytes(file.size)}</span>
              <button className="btn-ghost !px-1.5 !py-0.5 text-xs" aria-label="Move up" onClick={() => move(i, -1)}>↑</button>
              <button className="btn-ghost !px-1.5 !py-0.5 text-xs" aria-label="Move down" onClick={() => move(i, 1)}>↓</button>
            </li>
          ))}
        </ul>
      )}
      {error && <Note kind="error">{error}</Note>}
      <div className="flex items-center gap-3">
        <RunButton onClick={merge} busy={!!busy} disabled={files.length < 2} label={`Merge ${files.length || ""} PDFs`.trim()} />
        <button className="btn-ghost" onClick={() => setFiles([])} disabled={!files.length}>Clear list</button>
        <span className="text-xs text-ink-dim">Order in the list = order in the merged file.</span>
      </div>
    </PdfShell>
  );
};

// ── 2. Split PDF ──
export const PdfSplitTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [mode, setMode] = useState<"ranges" | "each">("each");
  const [ranges, setRanges] = useState("1-2, 3");
  const [busy, setBusy] = useState<Busy | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    const file = files[0]?.file;
    if (!file) { setError("Add a PDF first."); return; }
    setError(null);
    setBusy({ on: true, label: "Reading…", progress: 0.1 });
    try {
      const bytes = await fileBytes(file);
      const src = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: true });
      const total = src.getPageCount();
      let groups: number[][] = [];
      if (mode === "each") {
        groups = Array.from({ length: total }, (_, i) => [i + 1]);
      } else {
        const parts = ranges.split(";").map((s) => s.trim()).filter(Boolean);
        if (parts.length === 0) parts.push(ranges);
        for (const part of parts) groups.push(await parseRanges(part, total));
      }
      const outputs: Record<string, Uint8Array | string> = {};
      let i = 0;
      for (const group of groups) {
        if (group.length === 0) continue;
        const out = await PDFDocument.create();
        const copied = await out.copyPages(src, group.map((n) => n - 1));
        copied.forEach((p) => out.addPage(p));
        outputs[`split-${String(++i).padStart(2, "0")}-pages-${group[0]}${group.length > 1 ? `-${group[group.length - 1]}` : ""}.pdf`] = await out.save();
        setBusy({ on: true, label: `Building part ${i}…`, progress: i / groups.length });
      }
      if (Object.keys(outputs).length === 1) {
        const [name, bytesOut] = Object.entries(outputs)[0];
        downloadBlob(name, new Blob([bytesOut as unknown as BlobPart], { type: "application/pdf" }));
      } else {
        downloadBlob("split-pdf.zip", zipFiles(outputs));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(null);
  };
  return (
    <PdfShell acceptFiles files={files} onFiles={(f) => setFiles(toDropped(f))} busy={busy ?? undefined}>
      <OptionsBar>
        <SelField label="Split mode" value={mode} onChange={setMode} options={[{ value: "each", label: "One PDF per page" }, { value: "ranges", label: "Custom ranges" }]} />
        {mode === "ranges" && (
          <Field label="Ranges ( ; between files, e.g. 1-3; 4; 5-8)">
            <input className="input !w-72" value={ranges} onChange={(e) => setRanges(e.target.value)} placeholder="1-3; 4; 5-8" />
          </Field>
        )}
      </OptionsBar>
      {error && <Note kind="error">{error}</Note>}
      <RunButton onClick={run} busy={!!busy} disabled={!files.length} label="Split PDF" />
      <Note>Multiple outputs are bundled into a ZIP. Everything happens in your browser — the file is never uploaded.</Note>
    </PdfShell>
  );
};

// ── 3. Compress PDF ──
export const PdfCompressTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [quality, setQuality] = useState(60);
  const [scale, setScale] = useState(1.5);
  const [busy, setBusy] = useState<Busy | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    const file = files[0]?.file;
    if (!file) return;
    setError(null);
    setResult(null);
    setBusy({ on: true, label: "Compressing…", progress: 0 });
    try {
      const bytes = await fileBytes(file);
      const out = await rasterizePdf(bytes, {
        quality: quality / 100, scale,
        onProgress: (p) => setBusy({ on: true, label: "Compressing…", progress: p }),
      });
      const saved = await out.save();
      downloadBlob("compressed.pdf", new Blob([saved as unknown as BlobPart], { type: "application/pdf" }));
      setResult(`${formatBytes(file.size)} → ${formatBytes(saved.length)} (${saved.length < file.size ? "−" : "+"}${Math.abs(100 - (saved.length / file.size) * 100).toFixed(0)}%)`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(null);
  };
  return (
    <PdfShell acceptFiles files={files} onFiles={(f) => setFiles(toDropped(f))} busy={busy ?? undefined}>
      <OptionsBar>
        <NumField label="JPEG quality %" value={quality} min={10} max={95} onChange={setQuality} hint="Lower = smaller file, softer pages" />
        <NumField label="Render scale" value={scale} min={0.5} max={3} step={0.25} onChange={setScale} hint="1.5 keeps text readable at print size" />
      </OptionsBar>
      {error && <Note kind="error">{error}</Note>}
      <div className="flex items-center gap-3">
        <RunButton onClick={run} busy={!!busy} disabled={!files.length} label="Compress" />
        {result && <span className="text-sm text-success">{result}</span>}
      </div>
      <Note kind="warn">This compressor rasterizes pages (text becomes images). It works best for scans and image-heavy documents. Text-only PDFs may not shrink — and won't stay searchable after compression.</Note>
    </PdfShell>
  );
};

// ── 4. PDF to text ──
export const PdfToTextTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [busy, setBusy] = useState<Busy | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    const file = files[0]?.file;
    if (!file) return;
    setError(null);
    setText("");
    setBusy({ on: true, label: "Extracting text…", progress: 0.1 });
    try {
      const bytes = await fileBytes(file);
      const doc = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
      const parts: string[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        let last = 0;
        let pageText = "";
        for (const item of content.items as { str: string; transform: number[]; width: number }[]) {
          const y = item.transform?.[5] ?? 0;
          if (last && Math.abs(y - last) > 2) pageText += "\n";
          pageText += item.str;
          if (item.width && item.str && !item.str.endsWith(" ")) pageText += " ";
          last = y;
        }
        parts.push(`── Page ${i} ──\n${pageText.replace(/[ \t]+\n/g, "\n").trim()}`);
        setBusy({ on: true, label: `Page ${i}/${doc.numPages}`, progress: i / doc.numPages });
      }
      await doc.destroy();
      setText(parts.join("\n\n"));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(null);
  };
  return (
    <PdfShell acceptFiles files={files} onFiles={(f) => setFiles(toDropped(f))} busy={busy ?? undefined}>
      {error && <Note kind="error">{error}</Note>}
      <RunButton onClick={run} busy={!!busy} disabled={!files.length} label="Extract text" />
      {text && <OutputArea text={text} filename="extracted.txt" rows={14} label={`Extracted text (${text.length.toLocaleString()} characters)`} />}
      <Note>Scanned PDFs (images of text) contain no text layer — for those, the result will be empty. The Transcribe tool can help with audio/video, but OCR for scans isn't in this build yet.</Note>
    </PdfShell>
  );
};

// ── 5. Rotate PDF ──
export const PdfRotateTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [angle, setAngle] = useState(90);
  const [pages, setPages] = useState("all");
  const [busy, setBusy] = useState<Busy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    const file = files[0]?.file;
    if (!file) return;
    setError(null);
    setBusy({ on: true, label: "Rotating…", progress: 0.5 });
    try {
      const doc = await PDFDocument.load(await fileBytes(file), { ignoreEncryption: true });
      const list = pages.trim() === "all" ? doc.getPageIndices().map((i) => i + 1) : await parseRanges(pages, doc.getPageCount());
      list.forEach((n) => {
        const page = doc.getPage(n - 1);
        page.setRotation(degrees((page.getRotation().angle + angle) % 360));
      });
      await saveDoc(doc, "rotated.pdf");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(null);
  };
  return (
    <PdfShell acceptFiles files={files} onFiles={(f) => setFiles(toDropped(f))} busy={busy ?? undefined}>
      <OptionsBar>
        <SelField label="Rotation" value={String(angle)} onChange={(v) => setAngle(Number(v))} options={[{ value: "90", label: "90° clockwise" }, { value: "180", label: "180°" }, { value: "270", label: "90° counter-clockwise" }]} />
        <Field label="Pages (all or e.g. 1,3-5)">
          <input className="input !w-40" value={pages} onChange={(e) => setPages(e.target.value)} />
        </Field>
      </OptionsBar>
      {error && <Note kind="error">{error}</Note>}
      <RunButton onClick={run} busy={!!busy} disabled={!files.length} label="Rotate & download" />
    </PdfShell>
  );
};

// ── 6. Watermark ──
export const PdfWatermarkTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [text, setText] = useState("CONFIDENTIAL");
  const [size, setSize] = useState(48);
  const [opacity, setOpacity] = useState(25);
  const [color, setColor] = useState("#888888");
  const [angle, setAngle] = useState(45);
  const [busy, setBusy] = useState<Busy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    const file = files[0]?.file;
    if (!file) return;
    setError(null);
    setBusy({ on: true, label: "Stamping…", progress: 0.5 });
    try {
      const doc = await PDFDocument.load(await fileBytes(file), { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const r = parseInt(color.slice(1, 3), 16) / 255;
      const g = parseInt(color.slice(3, 5), 16) / 255;
      const b = parseInt(color.slice(5, 7), 16) / 255;
      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const tw = font.widthOfTextAtSize(text, size);
        page.drawText(text, {
          x: (width - tw * 0.7) / 2,
          y: height / 2 - size,
          size,
          font,
          color: rgb(r, g, b),
          opacity: opacity / 100,
          rotate: degrees(angle),
        });
      }
      await saveDoc(doc, "watermarked.pdf");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(null);
  };
  return (
    <PdfShell acceptFiles files={files} onFiles={(f) => setFiles(toDropped(f))} busy={busy ?? undefined}>
      <OptionsBar>
        <Field label="Watermark text">
          <input className="input !w-52" value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <NumField label="Font size" value={size} min={8} max={200} onChange={setSize} />
        <NumField label="Opacity %" value={opacity} min={5} max={100} onChange={setOpacity} />
        <NumField label="Angle (°)" value={angle} min={0} max={360} onChange={setAngle} />
        <label className="block">
          <span className="label">Color</span>
          <input type="color" className="w-10 h-8 rounded-tool-sm border border-border bg-surface-3" value={color} onChange={(e) => setColor(e.target.value)} />
        </label>
      </OptionsBar>
      {error && <Note kind="error">{error}</Note>}
      <RunButton onClick={run} busy={!!busy} disabled={!files.length} label="Add watermark" />
      <Note>The watermark is drawn as real PDF text on every page — no server round-trip, no watermark on your privacy.</Note>
    </PdfShell>
  );
};

// ── 7. Page numbers ──
export const PdfPageNumbersTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [position, setPosition] = useState("bottom-center");
  const [startAt, setStartAt] = useState(1);
  const [format, setFormat] = useState("n");
  const [total, setTotal] = useState(false);
  const [skipFirst, setSkipFirst] = useState(false);
  const [busy, setBusy] = useState<Busy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    const file = files[0]?.file;
    if (!file) return;
    setError(null);
    setBusy({ on: true, label: "Numbering…", progress: 0.5 });
    try {
      const doc = await PDFDocument.load(await fileBytes(file), { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const last = startAt + pages.length - 1;
      pages.forEach((page, i) => {
        if (skipFirst && i === 0) return;
        const n = startAt + i;
        const label = format === "n" ? `${n}` : format === "n-of-total" ? `${n} / ${last}` : format === "page-n" ? `Page ${n}` : `Page ${n} of ${last}`;
        void total;
        const { width, height } = page.getSize();
        const tw = font.widthOfTextAtSize(label, 10);
        const isBottom = position.startsWith("bottom");
        const x = position.endsWith("left") ? 36 : position.endsWith("right") ? width - tw - 36 : (width - tw) / 2;
        const y = isBottom ? 24 : height - 34;
        page.drawText(label, { x, y, size: 10, font, color: rgb(0.35, 0.35, 0.35) });
      });
      await saveDoc(doc, "numbered.pdf");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(null);
  };
  return (
    <PdfShell acceptFiles files={files} onFiles={(f) => setFiles(toDropped(f))} busy={busy ?? undefined}>
      <OptionsBar>
        <SelField label="Position" value={position} onChange={setPosition} options={[
          { value: "bottom-center", label: "Bottom center" }, { value: "bottom-left", label: "Bottom left" }, { value: "bottom-right", label: "Bottom right" },
          { value: "top-center", label: "Top center" }, { value: "top-left", label: "Top left" }, { value: "top-right", label: "Top right" },
        ]} />
        <NumField label="Start numbering at" value={startAt} min={1} onChange={setStartAt} />
        <SelField label="Format" value={format} onChange={setFormat} options={[{ value: "n", label: "1" }, { value: "n-of-total", label: "1 / 12" }, { value: "page-n", label: "Page 1" }, { value: "page-n-of-total", label: "Page 1 of 12" }]} />
        <Toggle label="Skip the first page (cover)" checked={skipFirst} onChange={setSkipFirst} />
      </OptionsBar>
      {error && <Note kind="error">{error}</Note>}
      <RunButton onClick={run} busy={!!busy} disabled={!files.length} label="Add page numbers" />
    </PdfShell>
  );
};

// ── 8. Metadata ──
export const PdfMetadataTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [meta, setMeta] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy | null>(null);
  useEffect(() => {
    (async () => {
      const file = files[0]?.file;
      if (!file) { setMeta({}); return; }
      try {
        setError(null);
        const doc = await PDFDocument.load(await fileBytes(file), { ignoreEncryption: true });
        setMeta({
          Title: doc.getTitle() ?? "",
          Author: doc.getAuthor() ?? "",
          Subject: doc.getSubject() ?? "",
          Keywords: (doc.getKeywords() ?? "").toString(),
          Creator: doc.getCreator() ?? "",
          Producer: doc.getProducer() ?? "",
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setMeta({});
      }
    })();
  }, [files]);
  const save = async () => {
    const file = files[0]?.file;
    if (!file) return;
    setBusy({ on: true, label: "Saving…", progress: 0.6 });
    try {
      const doc = await PDFDocument.load(await fileBytes(file), { ignoreEncryption: true });
      doc.setTitle(meta.Title ?? "");
      doc.setAuthor(meta.Author ?? "");
      doc.setSubject(meta.Subject ?? "");
      doc.setKeywords(meta.Keywords ? meta.Keywords.split(/,\s*/) : []);
      doc.setCreator(meta.Creator ?? "");
      doc.setProducer("LocalToolBox");
      doc.setModificationDate(new Date());
      await saveDoc(doc, "metadata-updated.pdf");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(null);
  };
  const fields: [keyof typeof meta, string][] = [["Title", "Title"], ["Author", "Author"], ["Subject", "Subject"], ["Keywords", "Keywords (comma-separated)"], ["Creator", "Creator (app)"]];
  return (
    <PdfShell acceptFiles files={files} onFiles={(f) => setFiles(toDropped(f))} busy={busy ?? undefined}>
      {error && <Note kind="error">{error}</Note>}
      {files.length > 0 && (
        <div className="card p-4 grid sm:grid-cols-2 gap-3">
          {fields.map(([key, label]) => (
            <Field key={key} label={label}>
              <input className="input" value={meta[key] ?? ""} onChange={(e) => setMeta((m) => ({ ...m, [key]: e.target.value }))} />
            </Field>
          ))}
          <div className="sm:col-span-2 flex items-center gap-3">
            <RunButton onClick={save} busy={!!busy} label="Save metadata to new PDF" />
            <span className="text-xs text-ink-dim">Current producer: {meta.Producer || "—"}</span>
          </div>
        </div>
      )}
    </PdfShell>
  );
};

// ── 9. Unlock PDF (known password) ──
export const PdfUnlockTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [password, setPassword] = useState("");
  const [flatten, setFlatten] = useState(true);
  const [busy, setBusy] = useState<Busy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    const file = files[0]?.file;
    if (!file) return;
    setError(null);
    setBusy({ on: true, label: "Opening…", progress: 0.1 });
    try {
      const bytes = await fileBytes(file);
      const doc = await pdfjsLib.getDocument({ data: bytes.slice(0), password: password || undefined }).promise;
      const pageCount = doc.numPages;
      await doc.destroy();
      if (!flatten) {
        // try a direct copy when restrictions allow it
        const out = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: true });
        const fresh = await PDFDocument.create();
        const pages = await fresh.copyPages(out, out.getPageIndices());
        pages.forEach((p) => fresh.addPage(p));
        await saveDoc(fresh, "unlocked.pdf");
      } else {
        const out = await rasterizePdf(bytes, {
          quality: 0.92, scale: 2, password: password || undefined,
          onProgress: (p) => setBusy({ on: true, label: `Rebuilding page…`, progress: p }),
        });
        await saveDoc(out, "unlocked.pdf");
      }
      void pageCount;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.includes("password") || password === "" ? "Wrong or missing password — this tool only removes protection when you know the password." : msg);
    }
    setBusy(null);
  };
  return (
    <PdfShell acceptFiles files={files} onFiles={(f) => setFiles(toDropped(f))} busy={busy ?? undefined}>
      <OptionsBar>
        <Field label="PDF password">
          <input className="input !w-56" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="The password you already know" />
        </Field>
        <Toggle label="Flatten to images (always works)" checked={flatten} onChange={setFlatten} hint="Off = try to keep selectable text (works only on some PDFs)" />
      </OptionsBar>
      {error && <Note kind="error">{error}</Note>}
      <RunButton onClick={run} busy={!!busy} disabled={!files.length} label="Remove password" />
      <Note>This is not cracking. It decrypts a PDF with the password you provide and rebuilds it without encryption — handy when a viewer keeps pestering you for a password you own.</Note>
    </PdfShell>
  );
};

// ── 10. Grayscale ──
export const PdfGrayscaleTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [busy, setBusy] = useState<Busy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    const file = files[0]?.file;
    if (!file) return;
    setError(null);
    setBusy({ on: true, label: "Converting…", progress: 0 });
    try {
      const out = await rasterizePdf(await fileBytes(file), {
        quality: 0.9, scale: 2, grayscale: true,
        onProgress: (p) => setBusy({ on: true, label: "Converting…", progress: p }),
      });
      await saveDoc(out, "grayscale.pdf");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(null);
  };
  return (
    <PdfShell acceptFiles files={files} onFiles={(f) => setFiles(toDropped(f))} busy={busy ?? undefined}>
      {error && <Note kind="error">{error}</Note>}
      <RunButton onClick={run} busy={!!busy} disabled={!files.length} label="Convert to grayscale" />
      <Note>Pages are rasterized to grayscale images, which also flattens annotations and form fields.</Note>
    </PdfShell>
  );
};

// ── 11. Crop ──
export const PdfCropTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [top, setTop] = useState(10);
  const [right, setRight] = useState(10);
  const [bottom, setBottom] = useState(10);
  const [left, setLeft] = useState(10);
  const [unit, setUnit] = useState<"percent" | "pt">("percent");
  const [busy, setBusy] = useState<Busy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    const file = files[0]?.file;
    if (!file) return;
    setError(null);
    setBusy({ on: true, label: "Cropping…", progress: 0.6 });
    try {
      const doc = await PDFDocument.load(await fileBytes(file), { ignoreEncryption: true });
      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const m = (v: number, base: number) => (unit === "percent" ? (v / 100) * base : v);
        page.setCropBox(
          m(left, width),
          m(bottom, height),
          width - m(left, width) - m(right, width),
          height - m(bottom, height) - m(top, height),
        );
      }
      await saveDoc(doc, "cropped.pdf");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(null);
  };
  return (
    <PdfShell acceptFiles files={files} onFiles={(f) => setFiles(toDropped(f))} busy={busy ?? undefined}>
      <OptionsBar>
        <SelField label="Units" value={unit} onChange={setUnit} options={[{ value: "percent", label: "% of page" }, { value: "pt", label: "Points (1/72 in)" }]} />
        <NumField label="Top" value={top} min={0} onChange={setTop} />
        <NumField label="Right" value={right} min={0} onChange={setRight} />
        <NumField label="Bottom" value={bottom} min={0} onChange={setBottom} />
        <NumField label="Left" value={left} min={0} onChange={setLeft} />
      </OptionsBar>
      {error && <Note kind="error">{error}</Note>}
      <RunButton onClick={run} busy={!!busy} disabled={!files.length} label="Crop pages" />
    </PdfShell>
  );
};

// ── 12. Redact PDF ──
type RedactBox = { page: number; x: number; y: number; w: number; h: number };
export const PdfRedactTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [boxes, setBoxes] = useState<RedactBox[]>([]);
  const [flatten, setFlatten] = useState(true);
  const [busy, setBusy] = useState<Busy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    (async () => {
      const file = files[0]?.file;
      if (!file) { setRendered(null); setPageCount(0); setBoxes([]); return; }
      try {
        setError(null);
        const bytes = await fileBytes(file);
        const doc = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
        setPageCount(doc.numPages);
        setPage((p) => Math.min(p, doc.numPages));
        const canvas = await renderPageToCanvas(bytes, Math.min(page, doc.numPages), 1.5);
        setRendered(canvas);
        await doc.destroy();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, page]);

  const toPdf = (clientX: number, clientY: number) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    const sx = rendered!.width / rect.width;
    const sy = rendered!.height / rect.height;
    return { x: (clientX - rect.left) * sx, y: (clientY - rect.top) * sy };
  };

  const apply = async () => {
    const file = files[0]?.file;
    if (!file) return;
    setError(null);
    setBusy({ on: true, label: "Redacting…", progress: 0.2 });
    try {
      const bytes = await fileBytes(file);
      const src = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: true });
      const scale = 1.5; // must match preview render scale
      for (const b of boxes.filter((b) => b.page === page)) {
        const pg = src.getPage(b.page - 1);
        const { height } = pg.getSize();
        const canvasH = rendered!.height;
        // convert canvas coords (top-left origin) to PDF coords (bottom-left origin)
        const pdfY = height - ((b.y + b.h) / scale);
        pg.drawRectangle({ x: b.x / scale, y: pdfY, width: b.w / scale, height: b.h / scale, color: rgb(0, 0, 0) });
      }
      let final = src;
      if (flatten) {
        // ensure hidden text can't be recovered: rebuild pages as images
        const saved = await src.save();
        final = await rasterizePdf(saved, { quality: 0.92, scale: 2 });
      }
      await saveDoc(final, "redacted.pdf");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(null);
  };

  return (
    <PdfShell acceptFiles files={files} onFiles={(f) => setFiles(toDropped(f))} busy={busy ?? undefined}>
      {error && <Note kind="error">{error}</Note>}
      {files.length > 0 && rendered && (
        <>
          <OptionsBar>
            <NumField label={`Page (1–${pageCount})`} value={page} min={1} max={pageCount} onChange={(v) => setPage(Math.max(1, Math.min(pageCount, v || 1)))} />
            <Toggle label="Flatten pages after redacting (guaranteed removal)" checked={flatten} onChange={setFlatten} hint="Rebuilds pages as images so the hidden text is truly gone" />
            <RunButton onClick={apply} busy={!!busy} disabled={boxes.length === 0} label={`Redact ${boxes.length} area${boxes.length === 1 ? "" : "s"}`} />
          </OptionsBar>
          <div
            ref={wrapRef}
            className="relative card overflow-hidden select-none cursor-crosshair"
            onMouseDown={(e) => {
              if (e.button !== 0) return;
              dragRef.current = toPdf(e.clientX, e.clientY);
              setBoxes((b) => [...b, { page, x: dragRef.current!.x, y: dragRef.current!.y, w: 0, h: 0 }]);
            }}
            onMouseMove={(e) => {
              if (!dragRef.current) return;
              const p = toPdf(e.clientX, e.clientY);
              setBoxes((old) => {
                const copy = [...old];
                const lastBox = copy[copy.length - 1];
                copy[copy.length - 1] = {
                  ...lastBox,
                  w: Math.abs(p.x - lastBox.x),
                  h: Math.abs(p.y - lastBox.y),
                  x: Math.min(p.x, lastBox.x),
                  y: Math.min(p.y, lastBox.y),
                };
                return copy;
              });
            }}
            onMouseUp={() => { dragRef.current = null; }}
          >
            <canvas ref={(c) => { if (c && rendered && c !== rendered) { c.width = rendered.width; c.height = rendered.height; c.getContext("2d")!.drawImage(rendered, 0, 0); } }} className="block max-w-full" />
            {boxes.filter((b) => b.page === page).map((b, i) => (
              <div
                key={i}
                className="absolute bg-black/85 border border-warning"
                style={{
                  left: `${(b.x / rendered!.width) * 100}%`,
                  top: `${(b.y / rendered!.height) * 100}%`,
                  width: `${(b.w / rendered!.width) * 100}%`,
                  height: `${(b.h / rendered!.height) * 100}%`,
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-ghost" onClick={() => setBoxes([])} disabled={!boxes.length}>Clear all boxes</button>
            <span className="text-xs text-ink-dim">Drag with the mouse on the page preview to draw redaction boxes.</span>
          </div>
          <Note kind={flatten ? "info" : "warn"}>
            {flatten
              ? "With flattening on, redacted areas become pure black and the underlying text is destroyed for good — verify the result before sharing."
              : "Without flattening, the text is only covered by a black box and could still be extracted. Use flattening for real secrecy."}
          </Note>
        </>
      )}
    </PdfShell>
  );
};

export const tools: Record<string, ComponentType> = {
  "pdf-merge": PdfMergeTool,
  "pdf-split": PdfSplitTool,
  "pdf-compress": PdfCompressTool,
  "pdf-to-text": PdfToTextTool,
  "pdf-rotate": PdfRotateTool,
  "pdf-watermark": PdfWatermarkTool,
  "pdf-page-numbers": PdfPageNumbersTool,
  "pdf-metadata": PdfMetadataTool,
  "pdf-unlock": PdfUnlockTool,
  "pdf-grayscale": PdfGrayscaleTool,
  "pdf-crop": PdfCropTool,
  "redact-pdf": PdfRedactTool,
};
