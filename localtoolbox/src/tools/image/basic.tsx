// Image tools built on a shared single-image workbench factory.
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import ToolLayout from "../../components/ToolLayout";
import Dropzone, { toDropped, type DroppedFile } from "../../components/Dropzone";
import { Note, OptionsBar, RunButton } from "../../components/ui";
import { downloadBlob, formatBytes } from "../../lib/download";
import {
  baseNameOf, canvasToBlob, describeSize, drawToCanvas, EXT, loadImageFile, MIME, newCanvas,
} from "./imagelib";

export type ImgState<S extends object> = {
  init: S;
  controls?: (s: S, set: (patch: Partial<S>) => void) => ReactNode;
  process: (canvas: HTMLCanvasElement, s: S, ctx: { file: File }) => Promise<HTMLCanvasElement>;
  outMime: (s: S) => string;
  outQuality?: (s: S) => number;
  outName?: (s: S, file: File) => string;
};

/** Factory: dropzone + options + run + preview + download, one image at a time. */
export function imageTool<S extends object>(cfg: ImgState<S>): ComponentType {
  return function ImageWorkbench() {
    const [files, setFiles] = useState<DroppedFile[]>([]);
    const [state, setState] = useState<S>(cfg.init);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ url: string; blob: Blob; name: string } | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const file = files[0]?.file;

    useEffect(() => {
      setResult(null);
      setError(null);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file?.name, file?.size, state]);

    const run = async () => {
      if (!file) return;
      setBusy(true);
      setError(null);
      try {
        const { bitmap } = await loadImageFile(file);
        const source = drawToCanvas(bitmap);
        const out = await cfg.process(source, state, { file });
        const mime = cfg.outMime(state);
        const blob = await canvasToBlob(out, mime, cfg.outQuality?.(state) ?? 0.9);
        const name = cfg.outName?.(state, file) ?? `${baseNameOf(file.name) || "image"}-out.${EXT[mime] ?? "png"}`;
        setResult((old) => {
          if (old) URL.revokeObjectURL(old.url);
          return { url: URL.createObjectURL(blob), blob, name };
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
      setBusy(false);
    };

    return (
      <ToolLayout>
        <div className="flex flex-col gap-4">
          <Dropzone files={files} onFiles={(f) => setFiles(toDropped(f))} accept="image/*" hint="JPG, PNG, WebP, GIF, BMP, AVIF, HEIC" />
          {cfg.controls && <OptionsBar>{cfg.controls(state, (p) => setState((s) => ({ ...s, ...p })))}</OptionsBar>}
          {error && <Note kind="error">{error}</Note>}
          <div className="flex items-center gap-3">
            <RunButton onClick={run} busy={busy} disabled={!file} label="Process image" />
            {result && (
              <>
                <button className="btn-primary" onClick={() => downloadBlob(result.name, result.blob)}>Download {result.name}</button>
                <span className="text-xs text-ink-dim">{describeSize(file!.size, result.blob.size)} · {formatBytes(result.blob.size)}</span>
              </>
            )}
          </div>
          {result && (
            <div ref={previewRef} className="card p-4 flex justify-center bg-[repeating-conic-gradient(#0d1322_0%_25%,#111a2e_0%_50%)] bg-[length:20px_20px]">
              <img src={result.url} alt="Processed result preview" className="max-h-96 max-w-full object-contain rounded-tool-sm" />
            </div>
          )}
        </div>
      </ToolLayout>
    );
  };
}

// ── format conversions ──
function convertTool(format: "png" | "jpg" | "webp", fromHint: string): ComponentType {
  return imageTool<{ quality: number }>({
    init: { quality: format === "jpg" || format === "webp" ? 85 : 100 },
    controls: format === "png" ? undefined : (s, set) => (
      <label className="block">
        <span className="label">Quality — {s.quality}%</span>
        <input type="range" min={30} max={100} value={s.quality} onChange={(e) => set({ quality: Number(e.target.value) })} className="w-44 accent-[var(--color-accent)]" />
      </label>
    ),
    process: async (canvas) => canvas,
    outMime: () => MIME[format],
    outQuality: (s) => s.quality / 100,
  });
}

export const ImageConvertTool: ComponentType = imageTool<{ format: string; quality: number }>({
  init: { format: "webp", quality: 85 },
  controls: (s, set) => (
    <>
      <label className="block">
        <span className="label">Convert to</span>
        <select className="select !w-32" value={s.format} onChange={(e) => set({ format: e.target.value })}>
          <option value="png">PNG</option>
          <option value="jpg">JPG</option>
          <option value="webp">WebP</option>
        </select>
      </label>
      {s.format !== "png" && (
        <label className="block">
          <span className="label">Quality — {s.quality}%</span>
          <input type="range" min={30} max={100} value={s.quality} onChange={(e) => set({ quality: Number(e.target.value) })} className="w-44 accent-[var(--color-accent)]" />
        </label>
      )}
    </>
  ),
  process: async (canvas) => canvas,
  outMime: (s) => MIME[s.format] ?? MIME.png,
  outQuality: (s) => s.quality / 100,
  outName: (s, f) => `${baseNameOf(f.name)}.${s.format}`,
});

export const HeicToJpgTool = convertTool("jpg", "HEIC");
export const HeicToPngTool = convertTool("png", "HEIC");
export const WebpToPngTool = convertTool("png", "WebP");
export const PngToWebpTool = convertTool("webp", "PNG");
export const WebpToJpgTool = convertTool("jpg", "WebP");
export const JpgToWebpTool = convertTool("webp", "JPG");
export const AvifToJpgTool = convertTool("jpg", "AVIF");
export const AvifToPngTool = convertTool("png", "AVIF");

// ── compress ──
export const ImageCompressTool: ComponentType = imageTool<{ quality: number; maxWidth: number }>({
  init: { quality: 70, maxWidth: 0 },
  controls: (s, set) => (
    <>
      <label className="block">
        <span className="label">Quality — {s.quality}%</span>
        <input type="range" min={10} max={95} value={s.quality} onChange={(e) => set({ quality: Number(e.target.value) })} className="w-44 accent-[var(--color-accent)]" />
      </label>
      <label className="block">
        <span className="label">Max width (0 = keep)</span>
        <input type="number" className="input !w-24" min={0} value={s.maxWidth} onChange={(e) => set({ maxWidth: Number(e.target.value) || 0 })} />
      </label>
    </>
  ),
  process: async (canvas, s) => {
    if (!s.maxWidth || canvas.width <= s.maxWidth) return canvas;
    const scale = s.maxWidth / canvas.width;
    const out = newCanvas(canvas.width * scale, canvas.height * scale);
    out.getContext("2d")!.drawImage(canvas, 0, 0, out.width, out.height);
    return out;
  },
  outMime: () => "image/jpeg",
  outQuality: (s) => s.quality / 100,
});

// ── resize ──
export const ImageResizeTool: ComponentType = imageTool<{ width: number; height: number; keepRatio: boolean; pct: number }>({
  init: { width: 1280, height: 720, keepRatio: true, pct: 100 },
  controls: (s, set) => (
    <>
      <label className="flex gap-2 items-center text-sm col-span-full"><input type="checkbox" checked={s.keepRatio} onChange={(e) => set({ keepRatio: e.target.checked })} className="accent-[var(--color-accent)]" /> Lock aspect ratio</label>
      <label className="block"><span className="label">Width (px)</span>
        <input type="number" min={1} className="input !w-24" value={s.width} onChange={(e) => {
          const w = Number(e.target.value) || 1;
          set({ width: w, pct: 100, ...(s.keepRatio ? { height: Math.max(1, Math.round((w * 720) / 1280)) } : {}) });
        }} /></label>
      <label className="block"><span className="label">Height (px)</span>
        <input type="number" min={1} className="input !w-24" value={s.height} disabled={s.keepRatio} onChange={(e) => set({ height: Number(e.target.value) || 1, pct: 100 })} /></label>
      <label className="block"><span className="label">Or scale — {s.pct}%</span>
        <input type="range" min={5} max={400} value={s.pct} onChange={(e) => set({ pct: Number(e.target.value) })} className="w-44 accent-[var(--color-accent)]" /></label>
    </>
  ),
  process: async (canvas, s) => {
    let w = s.width || canvas.width;
    if (s.pct !== 100) w = Math.round((canvas.width * s.pct) / 100);
    const h = s.keepRatio ? Math.round((canvas.height * w) / canvas.width) : s.height || canvas.height;
    const out = newCanvas(w, h);
    const ctx = out.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, 0, w, h);
    return out;
  },
  outMime: () => "image/png",
});

// ── adjustments ──
function filterTool(initFilters: { brightness: number; contrast: number; saturate: number; blur: number; grayscale: number; sepia: number; hue: number }) {
  return imageTool<typeof initFilters>({
    init: initFilters,
    controls: (s, set) => (
      <>
        {([
          ["brightness", "%", 0, 300], ["contrast", "%", 0, 300], ["saturate", "%", 0, 300],
          ["blur", "px", 0, 40], ["grayscale", "%", 0, 100], ["sepia", "%", 0, 100], ["hue", "deg", 0, 360],
        ] as const).map(([key, unit, min, max]) => (
          <label key={key} className="block">
            <span className="label capitalize">{key} — {s[key]}{unit}</span>
            <input type="range" min={min} max={max} value={s[key]} onChange={(e) => set({ [key]: Number(e.target.value) } as never)} className="w-36 accent-[var(--color-accent)]" />
          </label>
        ))}
      </>
    ),
    process: async (canvas, s) => {
      const out = newCanvas(canvas.width, canvas.height);
      const ctx = out.getContext("2d")!;
      ctx.filter = `brightness(${s.brightness}%) contrast(${s.contrast}%) saturate(${s.saturate}%) blur(${s.blur}px) grayscale(${s.grayscale}%) sepia(${s.sepia}%) hue-rotate(${s.hue}deg)`;
      ctx.drawImage(canvas, 0, 0);
      return out;
    },
    outMime: () => "image/png",
  });
}

export const ImageBrightnessTool = filterTool({ brightness: 100, contrast: 100, saturate: 100, blur: 0, grayscale: 0, sepia: 0, hue: 0 });
export const ImageBlurTool: ComponentType = imageTool<{ blur: number }>({
  init: { blur: 6 },
  controls: (s, set) => (
    <label className="block">
      <span className="label">Blur radius — {s.blur}px</span>
      <input type="range" min={1} max={40} value={s.blur} onChange={(e) => set({ blur: Number(e.target.value) })} className="w-48 accent-[var(--color-accent)]" />
    </label>
  ),
  process: async (canvas, s) => {
    const out = newCanvas(canvas.width, canvas.height);
    const ctx = out.getContext("2d")!;
    ctx.filter = `blur(${s.blur}px)`;
    ctx.drawImage(canvas, 0, 0);
    return out;
  },
  outMime: () => "image/png",
});
export const ImageGrayscaleTool: ComponentType = imageTool<{}>({
  init: {},
  process: async (canvas) => {
    const out = newCanvas(canvas.width, canvas.height);
    const ctx = out.getContext("2d")!;
    ctx.filter = "grayscale(100%)";
    ctx.drawImage(canvas, 0, 0);
    return out;
  },
  outMime: () => "image/png",
});

// ── CSS-style filter presets ──
const PRESETS: Record<string, string> = {
  Original: "",
  "Clarendon": "contrast(1.2) saturate(1.35)",
  Gingham: "brightness(1.05) hue-rotate(-10deg)",
  Moon: "grayscale(1) contrast(1.1) brightness(1.1)",
  Lark: "contrast(.9) brightness(1.1) saturate(1.1)",
  Reyes: "sepia(.22) brightness(1.1) contrast(.85)",
  Juno: "saturate(1.4) contrast(1.05)",
  Slumber: "saturate(.66) brightness(1.05) sepia(.1)",
  Crema: "sepia(.5) contrast(1.25) brightness(1.15) saturate(.9) hue-rotate(-2deg)",
  Ludwig: "contrast(1.05) brightness(1.05) saturate(2)",
  Aden: "hue-rotate(-20deg) contrast(.9) saturate(.85) brightness(1.2)",
  "Cold winter": "saturate(.8) brightness(1.05) hue-rotate(10deg)",
  "Warm sunset": "sepia(.25) saturate(1.4)",
  Noir: "grayscale(1) contrast(1.3) brightness(.9)",
  Vivid: "saturate(1.8) contrast(1.15)",
  Faded: "contrast(.85) brightness(1.1) saturate(.75)",
};
export const ImageFiltersTool: ComponentType = imageTool<{ preset: string }>({
  init: { preset: "Clarendon" },
  controls: (s, set) => (
    <label className="block">
      <span className="label">Preset</span>
      <select className="select !w-48" value={s.preset} onChange={(e) => set({ preset: e.target.value })}>
        {Object.keys(PRESETS).map((p) => <option key={p}>{p}</option>)}
      </select>
    </label>
  ),
  process: async (canvas, s) => {
    const out = newCanvas(canvas.width, canvas.height);
    const ctx = out.getContext("2d")!;
    ctx.filter = PRESETS[s.preset];
    ctx.drawImage(canvas, 0, 0);
    return out;
  },
  outMime: () => "image/png",
});

// ── rotate & flip ──
export const ImageRotateTool: ComponentType = imageTool<{ angle: number; flipH: boolean; flipV: boolean }>({
  init: { angle: 90, flipH: false, flipV: false },
  controls: (s, set) => (
    <>
      <label className="block">
        <span className="label">Rotate</span>
        <select className="select !w-36" value={s.angle} onChange={(e) => set({ angle: Number(e.target.value) })}>
          <option value={0}>0°</option>
          <option value={90}>90°</option>
          <option value={180}>180°</option>
          <option value={270}>270°</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.flipH} onChange={(e) => set({ flipH: e.target.checked })} className="accent-[var(--color-accent)]" /> Flip horizontal</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.flipV} onChange={(e) => set({ flipV: e.target.checked })} className="accent-[var(--color-accent)]" /> Flip vertical</label>
    </>
  ),
  process: async (canvas, s) => {
    const swap = s.angle === 90 || s.angle === 270;
    const out = newCanvas(swap ? canvas.height : canvas.width, swap ? canvas.width : canvas.height);
    const ctx = out.getContext("2d")!;
    ctx.translate(out.width / 2, out.height / 2);
    ctx.rotate((s.angle * Math.PI) / 180);
    ctx.scale(s.flipH ? -1 : 1, s.flipV ? -1 : 1);
    ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    return out;
  },
  outMime: () => "image/png",
});

// ── border ──
export const ImageBorderTool: ComponentType = imageTool<{ size: number; color: string; radius: number }>({
  init: { size: 24, color: "#3b82f6", radius: 0 },
  controls: (s, set) => (
    <>
      <label className="block"><span className="label">Border size (px)</span>
        <input type="number" min={0} max={200} className="input !w-24" value={s.size} onChange={(e) => set({ size: Number(e.target.value) || 0 })} /></label>
      <label className="block"><span className="label">Color</span>
        <input type="color" className="w-10 h-8 rounded-tool-sm border border-border bg-surface-3" value={s.color} onChange={(e) => set({ color: e.target.value })} /></label>
      <label className="block"><span className="label">Corner radius (px)</span>
        <input type="number" min={0} max={200} className="input !w-24" value={s.radius} onChange={(e) => set({ radius: Number(e.target.value) || 0 })} /></label>
    </>
  ),
  process: async (canvas, s) => {
    const out = newCanvas(canvas.width + s.size * 2, canvas.height + s.size * 2);
    const ctx = out.getContext("2d")!;
    ctx.fillStyle = s.color;
    if (s.radius > 0) {
      const r = s.radius;
      ctx.beginPath();
      ctx.roundRect(0, 0, out.width, out.height, r);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(s.size, s.size, canvas.width, canvas.height, Math.max(0, r - s.size / 2));
      ctx.clip();
      ctx.drawImage(canvas, s.size, s.size);
      ctx.restore();
    } else {
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(canvas, s.size, s.size);
    }
    return out;
  },
  outMime: () => "image/png",
});

// ── svg -> png ──
export const SvgToPngTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [scale, setScale] = useState(2);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; blob: Blob } | null>(null);
  const run = async () => {
    const file = files[0]?.file;
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const text = await file.text();
      const url = URL.createObjectURL(new Blob([text], { type: "image/svg+xml" }));
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const el = new Image();
        el.onload = () => res(el);
        el.onerror = () => rej(new Error("Could not render this SVG."));
        el.src = url;
      });
      const vb = text.match(/viewBox="([\d.\s-]+)"/)?.[1]?.trim().split(/\s+/).map(Number);
      const w = img.naturalWidth || (vb ? vb[2] - vb[0] : 1024) || 1024;
      const h = img.naturalHeight || (vb ? vb[3] - vb[1] : 1024) || 1024;
      const out = newCanvas(w * scale, h * scale);
      const ctx = out.getContext("2d")!;
      ctx.fillStyle = "transparent";
      ctx.drawImage(img, 0, 0, out.width, out.height);
      URL.revokeObjectURL(url);
      const blob = await canvasToBlob(out, "image/png");
      setResult({ url: URL.createObjectURL(blob), blob });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <Dropzone files={files} onFiles={(f) => setFiles(toDropped(f))} accept=".svg,image/svg+xml" />
        <OptionsBar>
          <label className="block"><span className="label">Scale — {scale}×</span>
            <input type="range" min={1} max={6} step={0.5} value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-44 accent-[var(--color-accent)]" /></label>
        </OptionsBar>
        {error && <Note kind="error">{error}</Note>}
        <div className="flex gap-3 items-center">
          <RunButton onClick={run} busy={busy} disabled={!files.length} label="Convert to PNG" />
          {result && <button className="btn-primary" onClick={() => downloadBlob("converted.png", result.blob)}>Download PNG</button>}
        </div>
        {result && (
          <div className="card p-4 flex justify-center bg-[repeating-conic-gradient(#0d1322_0%_25%,#111a2e_0%_50%)] bg-[length:20px_20px]">
            <img src={result.url} alt="Converted PNG preview" className="max-h-96 object-contain" />
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

// ── png -> svg (color-quantized run-length rects — honest simple vectorization) ──
export const PngToSvgTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [colors, setColors] = useState(12);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const run = async () => {
    const file = files[0]?.file;
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { bitmap } = await loadImageFile(file);
      const canvas = drawToCanvas(bitmap);
      // cap work: scale huge inputs down so the trace stays responsive
      const maxDim = 1600;
      const scale = Math.min(1, maxDim / Math.max(canvas.width, canvas.height));
      let src = canvas;
      if (scale < 1) {
        src = newCanvas(canvas.width * scale, canvas.height * scale);
        src.getContext("2d")!.drawImage(canvas, 0, 0, src.width, src.height);
      }
      const ctx = src.getContext("2d")!;
      const { width: w, height: h } = src;
      const data = ctx.getImageData(0, 0, w, h).data;
      const step = 255 / Math.max(1, colors - 1);
      const q = (v: number) => Math.round(Math.round(v / step) * step);
      const rects: string[] = [];
      const colorAt = (x: number, y: number): string => {
        const i = (y * w + x) * 4;
        if (data[i + 3] < 128) return "";
        return `rgb(${q(data[i])},${q(data[i + 1])},${q(data[i + 2])})`;
      };
      for (let y = 0; y < h; y++) {
        let runStart = 0;
        let runColor = colorAt(0, y);
        for (let x = 1; x <= w; x++) {
          const c = x < w ? colorAt(x, y) : "\0";
          if (c !== runColor) {
            if (runColor) rects.push(`<rect x="${runStart}" y="${y}" width="${x - runStart}" height="1" fill="${runColor}"/>`);
            runStart = x;
            runColor = c;
          }
        }
      }
      const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">\n${rects.join("\n")}\n</svg>`;
      setSvg(out);
      setPreviewUrl(URL.createObjectURL(new Blob([out], { type: "image/svg+xml" })));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  };

  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <Dropzone files={files} onFiles={(f) => setFiles(toDropped(f))} accept="image/png,image/*" />
        <OptionsBar>
          <label className="block"><span className="label">Colors — {colors}</span>
            <input type="range" min={2} max={32} value={colors} onChange={(e) => setColors(Number(e.target.value))} className="w-44 accent-[var(--color-accent)]" /></label>
        </OptionsBar>
        {error && <Note kind="error">{error}</Note>}
        <RunButton onClick={run} busy={busy} disabled={!files.length} label="Vectorize to SVG" />
        {svg && (
          <>
            <div className="card p-4 flex justify-center bg-[repeating-conic-gradient(#0d1322_0%_25%,#111a2e_0%_50%)] bg-[length:20px_20px]">
              <img src={previewUrl} alt="Vectorized SVG preview" className="max-h-80 object-contain" />
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={() => downloadBlob("vectorized.svg", new Blob([svg], { type: "image/svg+xml" }))}>Download SVG</button>
              <button className="btn-ghost" onClick={() => navigator.clipboard.writeText(svg)}>Copy SVG code</button>
            </div>
            <Note>Simple color-quantizing tracer. Logos and flat art work; photos look posterized.</Note>
          </>
        )}
      </div>
    </ToolLayout>
  );
};

// ── image -> base64 (data URI) ──
export const ImageToBase64Tool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [mime, setMime] = useState("image/png");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setOut(""); }, [files]);
  const run = async () => {
    const file = files[0]?.file;
    if (!file) return;
    setBusy(true);
    const { bitmap } = await loadImageFile(file);
    const canvas = drawToCanvas(bitmap);
    const blob = await canvasToBlob(canvas, mime, 0.9);
    const buf = await blob.arrayBuffer();
    let bin = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
    setOut(`data:${mime};base64,${btoa(bin)}`);
    setBusy(false);
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <Dropzone files={files} onFiles={(f) => setFiles(toDropped(f))} accept="image/*" />
        <OptionsBar>
          <label className="block"><span className="label">Re-encode as</span>
            <select className="select !w-32" value={mime} onChange={(e) => setMime(e.target.value)}>
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
            </select></label>
        </OptionsBar>
        <RunButton onClick={run} busy={busy} disabled={!files.length} label="Convert to Base64" />
        {out && (
          <div className="card p-3 font-mono text-[12px] break-all max-h-64 overflow-auto">{out}</div>
        )}
        {out && (
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => navigator.clipboard.writeText(out)}>Copy data URI</button>
            <button className="btn-ghost" onClick={() => downloadBlob("image-base64.txt", new Blob([out], { type: "text/plain" }))}>Download .txt</button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

// ── base64 -> image ──
export const Base64ToImageTool: ComponentType = () => {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const imgSrc = (() => {
    const t = text.trim();
    if (!t) return null;
    if (t.startsWith("data:")) return t;
    if (/^[A-Za-z0-9+/=\s]+$/.test(t)) return `data:image/png;base64,${t.replace(/\s+/g, "")}`;
    return null;
  })();
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <label className="block">
          <span className="label">Base64 string or data URI</span>
          <textarea className="textarea" rows={6} value={text} onChange={(e) => { setText(e.target.value); setError(null); }} placeholder="data:image/png;base64,iVBORw0…" />
        </label>
        {text.trim() && !imgSrc && <Note kind="error">That doesn't look like a valid Base64 image string.</Note>}
        {imgSrc && (
          <>
            <div className="card p-4 flex justify-center bg-[repeating-conic-gradient(#0d1322_0%_25%,#111a2e_0%_50%)] bg-[length:20px_20px]">
              <img src={imgSrc} alt="Decoded image preview" className="max-h-96 object-contain" onError={() => setError("The browser could not decode this data as an image.")} />
            </div>
            <a className="btn-primary self-start" href={imgSrc} download="decoded-image.png">Download image</a>
          </>
        )}
        {error && <Note kind="error">{error}</Note>}
      </div>
    </ToolLayout>
  );
};
