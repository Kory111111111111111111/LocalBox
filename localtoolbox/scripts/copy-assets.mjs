// Copy self-hosted WASM/worker assets from node_modules into public/vendor/
// so heavy runtimes are served from our own origin (no third-party CDN).
// Runs automatically on `pnpm install` (postinstall) and can be run manually.
import { cp, mkdir, readdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function copyDirIfExists(src, dest) {
  if (!(await exists(src))) {
    console.warn(`[copy-assets] skip (missing): ${src}`);
    return;
  }
  await mkdir(dest, { recursive: true });
  await cp(src, dest, { recursive: true });
  console.log(`[copy-assets] ${path.relative(root, src)} -> ${path.relative(root, dest)}`);
}

// ffmpeg.wasm 0.12.x single-thread core (UMD build) — no SharedArrayBuffer,
// so no COOP/COEP headers are required. See README for the MT-core tradeoff.
await copyDirIfExists(
  path.join(root, "node_modules/@ffmpeg/core/dist/umd"),
  path.join(root, "public/vendor/ffmpeg/core"),
);

// ffmpeg.wasm class worker (the worker.js the FFmpeg class spawns).
await copyDirIfExists(
  path.join(root, "node_modules/@ffmpeg/ffmpeg/dist/umd"),
  path.join(root, "public/vendor/ffmpeg/classworker"),
);

// List what we shipped so the log is auditable.
for (const dir of ["public/vendor/ffmpeg/core", "public/vendor/ffmpeg/classworker"]) {
  const full = path.join(root, dir);
  if (await exists(full)) {
    console.log(`[copy-assets] ${dir}:`, (await readdir(full)).join(", "));
  }
}
console.log("[copy-assets] done");
