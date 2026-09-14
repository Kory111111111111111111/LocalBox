// Interactive image tools: crop, color picker, collage, watermark, metadata,
// favicon generator, placeholder generator, ASCII art.
import { useEffect, useRef, useState, type ComponentType } from "react";
import ToolLayout from "../../components/ToolLayout";
import Dropzone, { toDropped, type DroppedFile } from "../../components/Dropzone";
import { CopyButton, Note, NumField, OptionsBar, OutputArea, RunButton, SelField, Toggle } from "../../components/ui";
import { downloadBlob, zipFiles } from "../../lib/download";
import { baseNameOf, canvasToBlob, drawToCanvas, loadImageFile, newCanvas } from "./imagelib";

function useLoadedImage(files: DroppedFile[]) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    const file = files[0]?.file;
    if (!file) { setCanvas(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const { bitmap, note: n } = await loadImageFile(file);
        if (!cancelled) { setCanvas(drawToCanvas(bitmap)); setNote(n ?? null); setError(null); }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [files]);
  return { canvas, error, note };
}

// ── crop ──
export const ImageCropTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const { canvas, error } = useLoadedImage(files);
  const [ratio, setRatio] = useState("free");
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [sel, setSel] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const RATIO: Record<string, number | null> = { free: null, "1:1": 1, "4:3": 4 / 3, "3:2": 3 / 2, "16:9": 16 / 9, "9:16": 9 / 16 };
  const imgW = () => imgRef.current?.naturalWidth ?? 1;
  const imgH = () => imgRef.current?.naturalHeight ?? 1;

  const startDrag = (e: React.MouseEvent) => {
    if (!boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    dragRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setSel({ x: dragRef.current.x, y: dragRef.current.y, w: 0, h: 0 });
  };
  const moveDrag = (e: React.MouseEvent) => {
    if (!dragRef.current || !boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    let x2 = e.clientX - rect.left;
    let y2 = e.clientY - rect.top;
    const r = RATIO[ratio];
    let w = x2 - dragRef.current.x;
    let h = y2 - dragRef.current.y;
    if (r) {
      h = w / r;
      if (Math.abs(h) > rect.height) { h = Math.sign(h || 1) * rect.height; w = h * r; }
    }
    setSel({ x: dragRef.current.x, y: dragRef.current.y, w, h });
  };
  const apply = async () => {
    if (!canvas || !sel || !boxRef.current || !imgRef.current) return;
    setBusy(true);
    const rect = boxRef.current.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const x = sel.w >= 0 ? sel.x : sel.x + sel.w;
    const y = sel.h >= 0 ? sel.y : sel.y + sel.h;
    const w = Math.abs(sel.w);
    const h = Math.abs(sel.h);
    const out = newCanvas(w * sx, h * sy);
    out.getContext("2d")!.drawImage(canvas, x * sx, y * sy, w * sx, h * sy, 0, 0, out.width, out.height);
    const blob = await canvasToBlob(out, "image/png");
    downloadBlob(`${baseNameOf(files[0].file.name)}-cropped.png`, blob);
    setBusy(false);
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <Dropzone files={files} onFiles={(f) => setFiles(toDropped(f))} accept="image/*" />
        {error && <Note kind="error">{error}</Note>}
        {canvas && (
          <>
            <OptionsBar>
              <SelField label="Aspect ratio" value={ratio} onChange={setRatio} options={[
                { value: "free", label: "Free" }, { value: "1:1", label: "1:1 (square)" }, { value: "4:3", label: "4:3" },
                { value: "3:2", label: "3:2" }, { value: "16:9", label: "16:9" }, { value: "9:16", label: "9:16 (story)" },
              ]} />
              <RunButton onClick={apply} busy={busy} disabled={!sel || sel.w < 8 || sel.h < 8} label="Crop & download" />
              <span className="text-xs text-ink-dim self-center">{sel ? `${Math.round(Math.abs(sel.w))}×${Math.round(Math.abs(sel.h))} preview px` : "Drag on the image to select"}</span>
            </OptionsBar>
            <div ref={boxRef} className="relative card overflow-hidden cursor-crosshair select-none" onMouseDown={startDrag} onMouseMove={moveDrag} onMouseUp={() => (dragRef.current = null)} onMouseLeave={() => (dragRef.current = null)}>
              <img ref={imgRef} src={canvas.toDataURL("image/png")} className="block max-w-full pointer-events-none" alt="Crop source" />
              {sel && (
                <div className="absolute border-2 border-accent bg-accent/10 pointer-events-none" style={{
                  left: Math.min(sel.x, sel.x + sel.w), top: Math.min(sel.y, sel.y + sel.h),
                  width: Math.abs(sel.w), height: Math.abs(sel.h),
                }} />
              )}
            </div>
          </>
        )}
      </div>
    </ToolLayout>
  );
};

// ── color picker from image ──
export const ImageColorPickerTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const { canvas, error } = useLoadedImage(files);
  const [picked, setPicked] = useState<string[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvas) { canvasRef.current = canvas; }
  }, [canvas]);

  const sample = (e: React.MouseEvent): string | null => {
    if (!canvasRef.current || !boxRef.current) return null;
    const rect = boxRef.current.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvasRef.current.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvasRef.current.height);
    const d = canvasRef.current.getContext("2d")!.getImageData(x, y, 1, 1).data;
    return "#" + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, "0")).join("");
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <Dropzone files={files} onFiles={(f) => setFiles(toDropped(f))} accept="image/*" hint="Click anywhere on the image to grab its color" />
        {error && <Note kind="error">{error}</Note>}
        {canvas && (
          <>
            <div ref={boxRef} className="relative card overflow-hidden cursor-crosshair" onClick={(e) => { const c = sample(e); if (c) setPicked((p) => [c, ...p].slice(0, 12)); }} onMouseMove={(e) => setHover(sample(e))} onMouseLeave={() => setHover(null)}>
              <canvas ref={(c) => { if (c && canvas) { c.width = canvas.width; c.height = canvas.height; c.getContext("2d")!.drawImage(canvas, 0, 0); canvasRef.current = c; } }} className="block max-w-full" />
            </div>
            <div className="card p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-tool-sm border border-border" style={{ background: hover ?? "#000" }} />
              <span className="font-mono text-sm text-accent">{hover ?? "hover the image"}</span>
              {hover && <CopyButton text={hover} label="Copy HEX" />}
            </div>
            <div className="flex flex-wrap gap-2">
              {picked.map((c, i) => (
                <button key={i} className="chip !px-2 !py-1 font-mono" title="Click to copy" onClick={() => navigator.clipboard.writeText(c)}>
                  <span className="w-3.5 h-3.5 rounded-sm inline-block border border-border" style={{ background: c }} /> {c}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </ToolLayout>
  );
};

// ── collage ──
export const ImageCollageTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [cols, setCols] = useState(2);
  const [gap, setGap] = useState(8);
  const [cell, setCell] = useState(400);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    if (files.length < 2) { setError("Add at least two images."); return; }
    setError(null);
    setBusy(true);
    try {
      const bitmaps = await Promise.all(files.map((f) => loadImageFile(f.file)));
      const rows = Math.ceil(bitmaps.length / cols);
      const out = newCanvas(cols * cell + gap * (cols + 1), rows * cell + gap * (rows + 1));
      const ctx = out.getContext("2d")!;
      ctx.fillStyle = "#0a0e17";
      ctx.fillRect(0, 0, out.width, out.height);
      bitmaps.forEach(({ bitmap }, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const src = drawToCanvas(bitmap);
        const scale = Math.min(cell / src.width, cell / src.height);
        const w = src.width * scale;
        const h = src.height * scale;
        ctx.drawImage(src, gap + col * (cell + gap) + (cell - w) / 2, gap + row * (cell + gap) + (cell - h) / 2, w, h);
      });
      downloadBlob("collage.png", await canvasToBlob(out, "image/png"));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <Dropzone files={files} onFiles={(f) => setFiles((old) => [...old, ...toDropped(f)])} onRemove={(id) => setFiles((old) => old.filter((x) => x.id !== id))} multiple accept="image/*" hint="Add 2 or more images — order defines placement" />
        <OptionsBar>
          <NumField label="Columns" value={cols} min={1} max={8} onChange={(v) => setCols(Math.min(8, Math.max(1, v || 2)))} />
          <NumField label="Gap (px)" value={gap} min={0} max={60} onChange={setGap} />
          <NumField label="Cell size (px)" value={cell} min={80} max={1200} step={20} onChange={setCell} />
          <RunButton onClick={run} busy={busy} disabled={files.length < 2} label={`Build collage (${files.length} images)`} />
        </OptionsBar>
        {error && <Note kind="error">{error}</Note>}
      </div>
    </ToolLayout>
  );
};

// ── watermark ──
export const ImageWatermarkTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [logoFiles, setLogoFiles] = useState<DroppedFile[]>([]);
  const { canvas, error } = useLoadedImage(files);
  const [text, setText] = useState("© LocalToolBox");
  const [pos, setPos] = useState("bottom-right");
  const [opacity, setOpacity] = useState(60);
  const [size, setSize] = useState(4);
  const [busy, setBusy] = useState(false);
  const apply = async () => {
    if (!canvas) return;
    setBusy(true);
    try {
      const out = newCanvas(canvas.width, canvas.height);
      const ctx = out.getContext("2d")!;
      ctx.drawImage(canvas, 0, 0);
      ctx.globalAlpha = opacity / 100;
      if (logoFiles.length) {
        const { bitmap } = await loadImageFile(logoFiles[0].file);
        const lw = (size / 100) * canvas.width;
        const lh = (bitmap instanceof ImageBitmap ? bitmap.height / bitmap.width : 1) * lw;
        const [v, h] = pos.split("-");
        const x = h === "left" ? 16 : h === "right" ? canvas.width - lw - 16 : (canvas.width - lw) / 2;
        const y = v === "top" ? 16 : v === "middle" ? (canvas.height - lh) / 2 : canvas.height - lh - 16;
        ctx.drawImage(bitmap, x, y, lw, lh);
      } else {
        const fs = Math.max(12, (size / 100) * canvas.width);
        ctx.font = `bold ${fs}px sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "rgba(0,0,0,.5)";
        ctx.lineWidth = fs / 18;
        const tw = ctx.measureText(text).width;
        const [v, h] = pos.split("-");
        const x = h === "left" ? 16 : h === "right" ? canvas.width - tw - 16 : (canvas.width - tw) / 2;
        const y = v === "top" ? 16 + fs : v === "middle" ? canvas.height / 2 + fs / 2.5 : canvas.height - 16;
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
      }
      downloadBlob("watermarked.png", await canvasToBlob(out, "image/png"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <Dropzone files={files} onFiles={(f) => setFiles(toDropped(f))} accept="image/*" hint="The image to stamp" />
        <Dropzone files={logoFiles} onFiles={(f) => setLogoFiles(toDropped(f))} accept="image/png,image/svg+xml" hint="Optional PNG/SVG logo — overrides the text watermark" />
        {error && <Note kind="error">{error}</Note>}
        <OptionsBar>
          <label className="block"><span className="label">Watermark text</span>
            <input className="input !w-48" value={text} onChange={(e) => setText(e.target.value)} disabled={logoFiles.length > 0} /></label>
          <SelField label="Position" value={pos} onChange={setPos} options={[
            { value: "bottom-right", label: "Bottom right" }, { value: "bottom-left", label: "Bottom left" }, { value: "bottom-center", label: "Bottom center" },
            { value: "top-right", label: "Top right" }, { value: "top-left", label: "Top left" }, { value: "top-center", label: "Top center" }, { value: "middle-center", label: "Center" },
          ]} />
          <NumField label="Opacity %" value={opacity} min={5} max={100} onChange={setOpacity} />
          <NumField label="Size % of width" value={size} min={1} max={50} onChange={(v) => setSize(Math.max(1, Math.min(50, v || 4)))} />
          <RunButton onClick={apply} busy={busy} disabled={!canvas} label="Add watermark" />
        </OptionsBar>
        <Note>Watermarks you add are yours — we never stamp anything on your output.</Note>
      </div>
    </ToolLayout>
  );
};

// ── metadata (EXIF) ──
export const ImageMetadataTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const file = files[0]?.file;
    if (!file) { setMeta(null); return; }
    (async () => {
      try {
        const exifr = (await import("exifr")).default;
        const data = await exifr.parse(file, { tiff: true, exif: true, gps: true, translateValues: true, reviveValues: true });
        setMeta(data ?? {});
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setMeta(null);
      }
    })();
  }, [files]);
  const rows = meta ? Object.entries(meta).sort(([a], [b]) => a.localeCompare(b)) : [];
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <Dropzone files={files} onFiles={(f) => setFiles(toDropped(f))} accept="image/*" hint="EXIF is read locally — nothing is uploaded, nothing is changed" />
        {error && <Note kind="error">{error}</Note>}
        {meta && (
          <div className="card overflow-hidden">
            <table className="w-full text-[13px]">
              <tbody className="divide-y divide-border-subtle">
                {rows.length === 0 && <tr><td className="px-3 py-4 text-ink-dim">No EXIF metadata found in this file.</td></tr>}
                {rows.map(([k, v]) => (
                  <tr key={k} className="hover:bg-surface-2">
                    <td className="px-3 py-1.5 font-mono text-accent w-48 break-all">{k}</td>
                    <td className="px-3 py-1.5 font-mono break-all">{typeof v === "object" ? JSON.stringify(v) : String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta && rows.length > 0 && <Note kind="warn">Metadata like GPS coordinates can identify where a photo was taken. To strip it, run the file through the Image Compress or Convert tool — canvas re-encoding drops all EXIF.</Note>}
      </div>
    </ToolLayout>
  );
};

// ── favicon generator ──
export const FaviconTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [sizes, setSizes] = useState<number[]>([16, 32, 48, 180, 512]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ALL = [16, 24, 32, 48, 64, 96, 128, 180, 192, 512];
  const run = async () => {
    const file = files[0]?.file;
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { bitmap } = await loadImageFile(file);
      const outputs: Record<string, Uint8Array | string> = {};
      for (const size of sizes) {
        const c = newCanvas(size, size);
        const ctx = c.getContext("2d")!;
        const src = drawToCanvas(bitmap);
        const scale = Math.min(size / src.width, size / src.height);
        const w = src.width * scale;
        const h = src.height * scale;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(src, (size - w) / 2, (size - h) / 2, w, h);
        const blob = await canvasToBlob(c, "image/png");
        outputs[`favicon-${size}x${size}.png`] = new Uint8Array(await blob.arrayBuffer());
      }
      outputs["README.txt"] =
`Favicon set generated locally by LocalToolBox.

HTML usage:
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/favicon-180x180.png">

Web manifest:
  { "icons": [{ "src": "/favicon-192x192.png", "sizes": "192x192", "type": "image/png" }] }
`;
      if (sizes.length === 1) {
        const [name, bytes] = Object.entries(outputs)[0];
        downloadBlob(name, new Blob([bytes as unknown as BlobPart], { type: "image/png" }));
      } else {
        downloadBlob("favicons.zip", zipFiles(outputs));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <Dropzone files={files} onFiles={(f) => setFiles(toDropped(f))} accept="image/*" hint="Square images look best" />
        <OptionsBar>
          <div>
            <span className="label">Sizes</span>
            <div className="flex flex-wrap gap-1.5">
              {ALL.map((s) => (
                <button key={s} className={`chip font-mono hover:text-ink ${sizes.includes(s) ? "!border-accent !text-accent bg-accent-muted" : ""}`}
                  onClick={() => setSizes((old) => (old.includes(s) ? old.filter((x) => x !== s) : [...old, s].sort((a, b) => a - b)))}>
                  {s}px
                </button>
              ))}
            </div>
          </div>
          <RunButton onClick={run} busy={busy} disabled={!files.length || !sizes.length} label="Generate favicons" />
        </OptionsBar>
        {error && <Note kind="error">{error}</Note>}
        <Note>Square source images avoid letterboxing. The ZIP includes a short README with the exact HTML snippet for each size.</Note>
      </div>
    </ToolLayout>
  );
};

// ── placeholder generator ──
export const PlaceholderTool: ComponentType = () => {
  const [w, setW] = useState(600);
  const [h, setH] = useState(400);
  const [bg, setBg] = useState("#141b2d");
  const [fg, setFg] = useState("#9aa8c0");
  const [label, setLabel] = useState("");
  const [fmt, setFmt] = useState("png");
  const [url, setUrl] = useState("");
  useEffect(() => {
    const c = newCanvas(w, h);
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = fg;
    ctx.font = `500 ${Math.max(12, Math.min(w, h) / 9)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label || `${w}×${h}`, w / 2, h / 2);
    setUrl(c.toDataURL(`image/${fmt}`));
  }, [w, h, bg, fg, label, fmt]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="Width" value={w} min={16} max={4000} onChange={setW} />
          <NumField label="Height" value={h} min={16} max={4000} onChange={setH} />
          <label className="block"><span className="label">Background</span>
            <input type="color" className="w-10 h-8 rounded-tool-sm border border-border bg-surface-3" value={bg} onChange={(e) => setBg(e.target.value)} /></label>
          <label className="block"><span className="label">Text color</span>
            <input type="color" className="w-10 h-8 rounded-tool-sm border border-border bg-surface-3" value={fg} onChange={(e) => setFg(e.target.value)} /></label>
          <label className="block"><span className="label">Label (default: size)</span>
            <input className="input !w-36" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="600×400" /></label>
          <SelField label="Format" value={fmt} onChange={setFmt} options={[{ value: "png", label: "PNG" }, { value: "jpeg", label: "JPEG" }]} />
        </OptionsBar>
        <div className="card p-4 flex justify-center">
          <img src={url} alt="Generated placeholder" className="max-w-full max-h-96 object-contain" />
        </div>
        <div className="flex gap-2">
          <a className="btn-primary" href={url} download={`placeholder-${w}x${h}.${fmt === "jpeg" ? "jpg" : "png"}`}>Download</a>
          <CopyButton text={url} label="Copy as data URI" />
        </div>
      </div>
    </ToolLayout>
  );
};

// ── image -> ascii ──
export const ImageAsciiTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const { canvas, error } = useLoadedImage(files);
  const [width, setWidth] = useState(100);
  const [charset, setCharset] = useState("@%#*+=-:. ");
  const [invert, setInvert] = useState(false);
  const art = (() => {
    if (!canvas) return "";
    const cols = Math.min(300, Math.max(20, width));
    const scale = cols / canvas.width;
    const rows = Math.round((canvas.height * scale) / 2.1);
    const small = newCanvas(cols, Math.max(1, rows));
    const ctx = small.getContext("2d")!;
    ctx.drawImage(canvas, 0, 0, cols, rows);
    const data = ctx.getImageData(0, 0, cols, rows).data;
    const chars = charset.length > 1 ? charset : "@#*+=-:. ";
    const lines: string[] = [];
    for (let y = 0; y < rows; y++) {
      let line = "";
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        let lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
        if (invert) lum = 1 - lum;
        line += chars[Math.min(chars.length - 1, Math.floor(lum * chars.length))];
      }
      lines.push(line.replace(/\s+$/, ""));
    }
    return lines.join("\n");
  })();
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <Dropzone files={files} onFiles={(f) => setFiles(toDropped(f))} accept="image/*" />
        {error && <Note kind="error">{error}</Note>}
        {canvas && (
          <>
            <OptionsBar>
              <NumField label="Width (chars)" value={width} min={20} max={300} onChange={setWidth} />
              <label className="block"><span className="label">Character ramp (dark → light)</span>
                <input className="input !w-56 font-mono" value={charset} onChange={(e) => setCharset(e.target.value)} /></label>
              <Toggle label="Invert brightness" checked={invert} onChange={setInvert} />
            </OptionsBar>
            <OutputArea text={art} filename="ascii.txt" rows={16} label="ASCII art" />
          </>
        )}
      </div>
    </ToolLayout>
  );
};
