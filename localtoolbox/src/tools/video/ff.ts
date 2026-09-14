// ffmpeg.wasm loader — single-thread core self-hosted from /vendor/ffmpeg/core/.
// Loaded lazily only on video/audio tool routes; fully local, no CDN.
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;
const progressListeners = new Set<(ratio: number, timeSec: number) => void>();

export async function getFFmpeg(onStatus?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;
  loadPromise ??= (async () => {
    onStatus?.("Loading the local video engine (one-time, ~30 MB, cached after)…");
    const instance = new FFmpeg();
    instance.on("progress", ({ progress, time }) => {
      const t = Number(time) / 1e6; // microseconds → seconds
      for (const fn of progressListeners) fn(progress, t);
    });
    instance.on("log", () => { /* reserved for debugging */ });
    const base = `${import.meta.env.BASE_URL}vendor/ffmpeg/core`;
    await instance.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
    });
    onStatus?.("Engine ready.");
    ffmpeg = instance;
    return instance;
  })();
  return loadPromise;
}

export function onFFmpegProgress(fn: (ratio: number, timeSec: number) => void): () => void {
  progressListeners.add(fn);
  return () => progressListeners.delete(fn);
}

export async function writeFile(ff: FFmpeg, name: string, file: File | Blob): Promise<string> {
  const data = await fetchFile(file);
  const safe = sanitizeName(name);
  await ff.writeFile(safe, data);
  return safe;
}

export function sanitizeName(name: string): string {
  // ffmpeg.wasm writes to a virtual FS — keep names simple ASCII
  const base = name.split("/").pop() ?? "file";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned.startsWith(".") ? "file" + cleaned : cleaned;
}

export async function readFileBlob(ff: FFmpeg, name: string): Promise<Blob> {
  const data = (await ff.readFile(name)) as Uint8Array;
  // copy: the virtual FS may reuse the buffer
  const copy = new Uint8Array(data.length);
  copy.set(data);
  return new Blob([copy as unknown as BlobPart]);
}

export async function readText(ff: FFmpeg, name: string): Promise<string> {
  const data = (await ff.readFile(name)) as Uint8Array;
  return new TextDecoder().decode(data);
}

export async function cleanup(ff: FFmpeg, names: string[]): Promise<void> {
  for (const n of names) {
    try {
      await ff.deleteFile(n);
    } catch {
      /* already gone */
    }
  }
}

export const busy = () => ffmpeg !== null;
