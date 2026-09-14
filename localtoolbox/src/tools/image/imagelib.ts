// Shared image processing helpers: load, draw, export — all via Canvas, locally.
import heic2any from "heic2any";
import { formatBytes } from "../../lib/download";

export type ImageSource = ImageBitmap | HTMLImageElement;

export function drawToCanvas(src: ImageSource): HTMLCanvasElement {
  const w = src instanceof ImageBitmap ? src.width : src.naturalWidth;
  const h = src instanceof ImageBitmap ? src.height : src.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(src, 0, 0);
  return canvas;
}

export function newCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

export function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), mime, quality),
  );
}

/** Loads any supported raster file; HEIC/HEIF is transcoded locally via heic2any first. */
export async function loadImageFile(file: File): Promise<{ bitmap: ImageSource; note?: string }> {
  const isHeic = /hei[cf]$/i.test(file.name) || file.type === "image/heic" || file.type === "image/heif";
  let blob: Blob = file;
  let note: string | undefined;
  if (isHeic) {
    const out = await heic2any({ blob: file, toType: "image/png" });
    blob = Array.isArray(out) ? out[0] : out;
    note = "HEIC decoded locally with heic2any";
  }
  if ("createImageBitmap" in window) {
    try {
      return { bitmap: await createImageBitmap(blob), note };
    } catch {
      /* fall through to <img> */
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("This browser can't decode that image format."));
      el.src = url;
    });
    return { bitmap: img, note };
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

export const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
};

export const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/bmp": "bmp",
};

export function baseNameOf(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

export function describeSize(before: number, after: number): string {
  const diff = 100 - (after / before) * 100;
  return `${formatBytes(before)} → ${formatBytes(after)} (${diff >= 0 ? "−" : "+"}${Math.abs(diff).toFixed(0)}%)`;
}
