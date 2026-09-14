// Local download / clipboard / formatting helpers. All client-side.
import { zipSync, type Zippable } from "fflate";

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  downloadUrl(filename, url);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function downloadUrl(filename: string, url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadText(filename: string, text: string, mime = "text/plain;charset=utf-8") {
  downloadBlob(filename, new Blob([text], { type: mime }));
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes)) return "—";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : decimals)} ${units[i]}`;
}

/** Zip a set of named files fully in-memory (fflate). */
export function zipFiles(files: Record<string, Uint8Array | string>): Blob {
  const data: Zippable = {};
  for (const [name, content] of Object.entries(files)) {
    data[name] = typeof content === "string" ? new TextEncoder().encode(content) : content;
  }
  const zipped = zipSync(data, { level: 6 });
  return new Blob([zipped as unknown as BlobPart], { type: "application/zip" });
}

export function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

export async function readBlobAsText(blob: Blob): Promise<string> {
  return blob.text();
}

export function baseName(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

export function extOf(filename: string): string {
  const m = filename.match(/\.([^.]+)$/);
  return m ? m[1].toLowerCase() : "";
}
