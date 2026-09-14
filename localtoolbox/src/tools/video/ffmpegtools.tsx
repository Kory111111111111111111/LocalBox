// Video & Audio tools powered by ffmpeg.wasm (self-hosted core).
import type { ComponentType } from "react";
import { makeFFmpegTool } from "./kit";
import { Note, NumField, SelField, Toggle } from "../../components/ui";
import { writeFile } from "./ff";

const VIDEO_ACCEPT = "video/*,.mp4,.webm,.mov,.mkv,.avi,.m4v";
const AUDIO_ACCEPT = "audio/*,.mp3,.wav,.m4a,.ogg,.flac,.aac,.opus";

// helper: build a filter string fragment
const S = (v: string | number) => String(v);

// ── 1. Video converter ──
export const VideoConverterTool: ComponentType = makeFFmpegTool<{
  format: string; quality: number;
}>({
  accept: VIDEO_ACCEPT,
  hint: "MP4, WebM, MOV, MKV, AVI…",
  initNote: undefined,
  controls: (s, set) => (
    <>
      <SelField label="Convert to" value={s.format ?? "webm"} onChange={(v) => set({ format: v })} options={[
        { value: "webm", label: "WebM (VP9 — smallest)" },
        { value: "mp4", label: "MP4 (H.264 — most compatible)" },
        { value: "ogv", label: "Ogg Video (Theora)" },
      ]} />
      <SelField label="Quality" value={S(s.quality ?? 28)} onChange={(v) => set({ quality: Number(v) })} options={[
        { value: "23", label: "High" }, { value: "28", label: "Balanced" }, { value: "35", label: "Small file" },
      ]} />
    </>
  ),
  run: async (files, s) => {
    const fmt = s.format ?? "webm";
    const out = `out.${fmt}`;
    const args = fmt === "mp4"
      ? ["-i", "in0", "-c:v", "libx264", "-preset", "medium", "-crf", S(s.quality ?? 28), "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", out]
      : fmt === "webm"
        ? ["-i", "in0", "-c:v", "libvpx-vp9", "-crf", S(Math.min(63, (s.quality ?? 28) + 4)), "-b:v", "0", "-c:a", "libopus", out]
        : ["-i", "in0", "-q:v", S(Math.min(10, Math.round((s.quality ?? 28) / 5))), out];
    return { args, outputs: [out] };
  },
});

// ── 2. Compress video ──
export const CompressVideoTool: ComponentType = makeFFmpegTool<{ target: string }>({
  accept: VIDEO_ACCEPT,
  hint: "Re-encodes with a smarter encoder to shrink the file",
  controls: (s, set) => (
    <SelField label="Target" value={s.target ?? "balanced"} onChange={(v) => set({ target: v })} options={[
      { value: "gentle", label: "Gentle — near-original quality" },
      { value: "balanced", label: "Balanced — much smaller" },
      { value: "tiny", label: "Tiny — smallest reasonable" },
    ]} />
  ),
  run: async (files, s) => {
    const crf = s.target === "gentle" ? "23" : s.target === "tiny" ? "36" : "30";
    const scale = s.target === "tiny" ? ["-vf", "scale='min(854,iw)':-2"] : [];
    return { args: ["-i", "in0", "-c:v", "libx264", "-preset", "veryfast", "-crf", crf, ...scale, "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", "compressed.mp4"], outputs: ["compressed.mp4"] };
  },
});

// ── 3. Extract audio ──
export const ExtractAudioTool: ComponentType = makeFFmpegTool<{ format: string; quality: number }>({
  accept: VIDEO_ACCEPT,
  hint: "Pulls the audio track out of any video",
  controls: (s, set) => (
    <>
      <SelField label="Format" value={s.format ?? "mp3"} onChange={(v) => set({ format: v })} options={[
        { value: "mp3", label: "MP3" }, { value: "wav", label: "WAV (lossless)" }, { value: "m4a", label: "M4A (AAC)" }, { value: "opus", label: "Opus" },
      ]} />
      {["mp3", "m4a", "opus"].includes(s.format ?? "mp3") && (
        <SelField label="Bitrate" value={S(s.quality ?? 192)} onChange={(v) => set({ quality: Number(v) })} options={[
          { value: "128", label: "128 kbps" }, { value: "192", label: "192 kbps" }, { value: "320", label: "320 kbps" },
        ]} />
      )}
    </>
  ),
  run: async (files, s) => {
    const fmt = s.format ?? "mp3";
    const codecArgs: Record<string, string[]> = {
      mp3: ["-c:a", "libmp3lame", "-b:a", `${s.quality ?? 192}k`],
      wav: ["-c:a", "pcm_s16le"],
      m4a: ["-c:a", "aac", "-b:a", `${s.quality ?? 192}k`],
      opus: ["-c:a", "libopus", "-b:a", `${s.quality ?? 192}k`],
    };
    return { args: ["-i", "in0", "-vn", ...codecArgs[fmt], `audio.${fmt}`], outputs: [`audio.${fmt}`] };
  },
});

// ── 4. Trim video ──
export const TrimVideoTool: ComponentType = makeFFmpegTool<{ start: number; end: number; mode: string }>({
  accept: VIDEO_ACCEPT,
  hint: "Cut a clip by start & end times — no re-encode in copy mode",
  controls: (s, set, probe) => (
    <>
      <NumField label="Start (seconds)" value={s.start ?? 0} min={0} max={probe?.duration ?? 99999} step={0.1} onChange={(v) => set({ start: Math.max(0, v || 0) })} />
      <NumField label="End (seconds)" value={s.end ?? Math.min(30, probe?.duration ?? 30)} min={0} max={probe?.duration ?? 99999} step={0.1} onChange={(v) => set({ end: Math.max(0, v || 0) })} hint={probe ? `clip is ${probe.duration.toFixed(1)}s` : undefined} />
      <SelField label="Cut mode" value={s.mode ?? "copy"} onChange={(v) => set({ mode: v })} options={[
        { value: "copy", label: "Fast (keyframe-aligned, no quality loss)" },
        { value: "exact", label: "Exact (re-encodes, frame-accurate)" },
      ]} />
    </>
  ),
  run: async (files, s) => {
    const dur = Math.max(0.1, (s.end ?? 30) - (s.start ?? 0));
    if (s.mode === "copy") {
      return { args: ["-ss", S(s.start ?? 0), "-i", "in0", "-t", S(dur), "-c", "copy", "-avoid_negative_ts", "make_zero", "trim.mp4"], outputs: ["trim.mp4"] };
    }
    return { args: ["-i", "in0", "-ss", S(s.start ?? 0), "-t", S(dur), "-c:v", "libx264", "-crf", "20", "-c:a", "aac", "trim.mp4"], outputs: ["trim.mp4"] };
  },
});

// ── 5. Mute video ──
export const MuteVideoTool: ComponentType = makeFFmpegTool<{}>({
  accept: VIDEO_ACCEPT,
  hint: "Removes the audio track without re-encoding video",
  run: async () => ({ args: ["-i", "in0", "-an", "-c:v", "copy", "muted.mp4"], outputs: ["muted.mp4"] }),
});

// ── 6. Video → GIF ──
export const VideoToGifTool: ComponentType = makeFFmpegTool<{ fps: number; width: number; start: number; duration: number }>({
  accept: VIDEO_ACCEPT,
  hint: "Short clips work best — GIFs get big fast",
  controls: (s, set, probe) => (
    <>
      <NumField label="FPS" value={s.fps ?? 12} min={5} max={30} onChange={(v) => set({ fps: Math.max(5, v || 12) })} />
      <NumField label="Width (px)" value={s.width ?? 480} min={120} max={1280} step={20} onChange={(v) => set({ width: Math.max(120, v || 480) })} />
      <NumField label="Start (s)" value={s.start ?? 0} min={0} onChange={(v) => set({ start: Math.max(0, v || 0) })} />
      <NumField label="Length (s)" value={s.duration ?? 5} min={0.5} max={probe?.duration ?? 600} onChange={(v) => set({ duration: Math.max(0.5, v || 5) })} />
    </>
  ),
  run: async (files, s) => {
    const w = s.width ?? 480;
    return {
      args: ["-ss", S(s.start ?? 0), "-t", S(s.duration ?? 5), "-i", "in0", "-vf", `fps=${s.fps ?? 12},scale=${w}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`, "-loop", "0", "animation.gif"],
      outputs: ["animation.gif"],
    };
  },
});

// ── 7. Resize video ──
export const ResizeVideoTool: ComponentType = makeFFmpegTool<{ preset: string }>({
  accept: VIDEO_ACCEPT,
  hint: "Scales down without stretching (keeps aspect ratio)",
  controls: (s, set) => (
    <SelField label="Resolution" value={s.preset ?? "720"} onChange={(v) => set({ preset: v })} options={[
      { value: "1080", label: "1080p" }, { value: "720", label: "720p" }, { value: "480", label: "480p" }, { value: "360", label: "360p" },
    ]} />
  ),
  run: async (files, s) => {
    const h = s.preset ?? "720";
    return { args: ["-i", "in0", "-vf", `scale=-2:${h}`, "-c:v", "libx264", "-crf", "23", "-c:a", "copy", `video-${h}p.mp4`], outputs: [`video-${h}p.mp4`] };
  },
});

// ── 8. Crop video ──
export const CropVideoTool: ComponentType = makeFFmpegTool<{ ratio: string }>({
  accept: VIDEO_ACCEPT,
  hint: "Center-crops to a platform aspect ratio",
  controls: (s, set) => (
    <SelField label="Aspect ratio" value={s.ratio ?? "square"} onChange={(v) => set({ ratio: v })} options={[
      { value: "square", label: "1:1 square" }, { value: "vertical", label: "9:16 vertical (Reels/TikTok)" }, { value: "wide", label: "16:9 widescreen" },
    ]} />
  ),
  run: async (files, s) => {
    const filter = s.ratio === "vertical" ? "crop=ih*9/16:ih" : s.ratio === "wide" ? "crop=iw:iw*9/16" : "crop=ih:ih";
    return { args: ["-i", "in0", "-vf", filter, "-c:v", "libx264", "-crf", "23", "-c:a", "copy", "cropped.mp4"], outputs: ["cropped.mp4"] };
  },
});

// ── 9. Merge video ──
export const MergeVideoTool: ComponentType = makeFFmpegTool<{}>({
  accept: VIDEO_ACCEPT,
  multiple: true,
  minFiles: 2,
  hint: "Same codec/resolution merges losslessly; mixed inputs get re-encoded",
  run: async (files, _s, { ff }) => {
    const listTxt = files.map((_, i) => `file 'in${i}'`).join("\n");
    await writeFile(ff, "list.txt", new Blob([listTxt]));
    return { args: ["-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", "merged.mp4"], outputs: ["merged.mp4"] };
  },
});

// ── 10. Speed ──
export const SpeedVideoTool: ComponentType = makeFFmpegTool<{ speed: number; audio: boolean }>({
  accept: VIDEO_ACCEPT,
  hint: "0.25× to 4× — pitch-corrected audio",
  controls: (s, set) => (
    <>
      <SelField label="Speed" value={S(s.speed ?? 1.5)} onChange={(v) => set({ speed: Number(v) })} options={[
        { value: "0.25", label: "0.25×" }, { value: "0.5", label: "0.5×" }, { value: "0.75", label: "0.75×" },
        { value: "1.25", label: "1.25×" }, { value: "1.5", label: "1.5×" }, { value: "2", label: "2×" }, { value: "4", label: "4×" },
      ]} />
      <Toggle label="Keep audio (pitch-corrected)" checked={s.audio ?? true} onChange={(v) => set({ audio: v })} />
    </>
  ),
  run: async (files, s) => {
    const sp = s.speed ?? 1.5;
    const vf = `setpts=${(1 / sp).toFixed(4)}*PTS`;
    const af = `atempo=${Math.min(2, Math.max(0.5, sp))}`;
    return {
      args: ["-i", "in0", "-vf", vf, ...(s.audio ?? true ? ["-af", af, "-c:a", "aac"] : ["-an"]), "-c:v", "libx264", "-crf", "22", "speed.mp4"],
      outputs: ["speed.mp4"],
    };
  },
});

// ── 11. Reverse ──
export const ReverseVideoTool: ComponentType = makeFFmpegTool<{ audio: boolean }>({
  accept: VIDEO_ACCEPT,
  hint: "Plays backwards — memory-heavy on long clips",
  controls: (s, set) => <Toggle label="Reverse audio too" checked={s.audio ?? true} onChange={(v) => set({ audio: v })} />,
  run: async (files, s) => ({
    args: ["-i", "in0", "-vf", "reverse", ...(s.audio ?? true ? ["-af", "areverse", "-c:a", "aac"] : ["-an"]), "-c:v", "libx264", "-crf", "22", "reversed.mp4"],
    outputs: ["reversed.mp4"],
  }),
});

// ── 12. Loop ──
export const LoopVideoTool: ComponentType = makeFFmpegTool<{ times: number }>({
  accept: VIDEO_ACCEPT,
  hint: "Repeats the clip N times into one file",
  controls: (s, set) => <NumField label="Repeat count" value={s.times ?? 3} min={2} max={10} onChange={(v) => set({ times: Math.min(10, Math.max(2, v || 3)) })} />,
  run: async (files, s) => {
    const n = Math.min(10, Math.max(2, s.times ?? 3));
    const streamChain = Array.from({ length: n }, () => `[0:v]`).join("");
    return {
      args: ["-i", "in0", "-filter_complex", `${streamChain}concat=n=${n}:v=1:a=0[outv]`, "-map", "[outv]", "-c:v", "libx264", "-crf", "22", "looped.mp4"],
      outputs: ["looped.mp4"],
    };
  },
});

// ── Audio converter ──
export const AudioConverterTool: ComponentType = makeFFmpegTool<{ format: string; bitrate: number }>({
  accept: AUDIO_ACCEPT,
  hint: "MP3, WAV, M4A, OGG, FLAC — decoded and re-encoded locally",
  controls: (s, set) => (
    <>
      <SelField label="Convert to" value={s.format ?? "mp3"} onChange={(v) => set({ format: v })} options={[
        { value: "mp3", label: "MP3" }, { value: "wav", label: "WAV" }, { value: "m4a", label: "M4A (AAC)" },
        { value: "ogg", label: "OGG (Vorbis)" }, { value: "flac", label: "FLAC (lossless)" },
      ]} />
      {["mp3", "m4a", "ogg"].includes(s.format ?? "mp3") && (
        <SelField label="Quality" value={S(s.bitrate ?? 192)} onChange={(v) => set({ bitrate: Number(v) })} options={[
          { value: "128", label: "128 kbps" }, { value: "192", label: "192 kbps" }, { value: "256", label: "256 kbps" }, { value: "320", label: "320 kbps" },
        ]} />
      )}
    </>
  ),
  run: async (files, s) => {
    const fmt = s.format ?? "mp3";
    const codec: Record<string, string[]> = {
      mp3: ["-c:a", "libmp3lame", "-b:a", `${s.bitrate ?? 192}k`],
      wav: ["-c:a", "pcm_s16le"],
      m4a: ["-c:a", "aac", "-b:a", `${s.bitrate ?? 192}k`],
      ogg: ["-c:a", "libvorbis", "-b:a", `${s.bitrate ?? 192}k`],
      flac: ["-c:a", "flac"],
    };
    return { args: ["-i", "in0", ...codec[fmt], `converted.${fmt}`], outputs: [`converted.${fmt}`] };
  },
});

// ── 13. Split video ──
export const SplitVideoTool: ComponentType = makeFFmpegTool<{ parts: number }>({
  accept: VIDEO_ACCEPT,
  hint: "Cuts into roughly N equal parts at keyframes, delivered as a ZIP",
  controls: (s, set, probe) => (
    <NumField label="Parts" value={s.parts ?? 3} min={2} max={20} onChange={(v) => set({ parts: Math.min(20, Math.max(2, v || 3)) })} hint={probe ? `≈ ${((probe.duration / (s.parts ?? 3)) || 0).toFixed(1)}s each` : undefined} />
  ),
  run: async (files, s, { probe }) => {
    const n = Math.min(20, Math.max(2, s.parts ?? 3));
    const total = probe?.duration ?? 0;
    const segTime = total > 0 ? (total / n).toFixed(2) : "30";
    const outputs = Array.from({ length: n }, (_, i) => `part-${String(i + 1).padStart(2, "0")}.mp4`);
    return {
      args: ["-i", "in0", "-c", "copy", "-map", "0", "-f", "segment", "-reset_timestamps", "1", "-segment_time", segTime, "part-%02d.mp4"],
      outputs,
    };
  },
});

// ── 14. Add music ──
export const AddMusicTool: ComponentType = makeFFmpegTool<{ mode: string; volume: number }>({
  accept: "video/*,audio/*",
  multiple: true,
  minFiles: 2,
  hint: "First file = video, second = audio track",
  controls: (s, set) => (
    <>
      <SelField label="Audio handling" value={s.mode ?? "replace"} onChange={(v) => set({ mode: v })} options={[
        { value: "replace", label: "Replace original sound" },
        { value: "mix", label: "Mix with original" },
        { value: "under", label: "Original louder (music underneath)" },
      ]} />
      <NumField label="Music volume %" value={s.volume ?? 80} min={5} max={200} onChange={(v) => set({ volume: Math.min(200, Math.max(5, v || 80)) })} />
    </>
  ),
  run: async (files, s) => {
    const vol = ((s.volume ?? 80) / 100).toFixed(2);
    const short = s.mode === "under" ? `[1:a]volume=${vol}[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=2[aout]` : `[1:a]volume=${vol}[aout]`;
    return {
      args: ["-i", "in0", "-i", "in1", "-filter_complex", short, "-map", "0:v", "-map", "[aout]", "-c:v", "copy", "-c:a", "aac", "-shortest", "scored.mp4"],
      outputs: ["scored.mp4"],
    };
  },
});

// ── 15. Cut audio ──
export const CutAudioTool: ComponentType = makeFFmpegTool<{ start: number; end: number; mode: string }>({
  accept: AUDIO_ACCEPT,
  hint: "Trim any audio file between two times",
  controls: (s, set, probe) => (
    <>
      <NumField label="Start (s)" value={s.start ?? 0} min={0} step={0.1} onChange={(v) => set({ start: Math.max(0, v || 0) })} />
      <NumField label="End (s)" value={s.end ?? Math.min(30, probe?.duration ?? 30)} min={0} step={0.1} onChange={(v) => set({ end: Math.max(0, v || 0) })} />
      <SelField label="Output" value={s.mode ?? "same"} onChange={(v) => set({ mode: v })} options={[
        { value: "same", label: "Same format (fast copy)" }, { value: "mp3", label: "MP3" }, { value: "wav", label: "WAV" },
      ]} />
    </>
  ),
  run: async (files, s) => {
    const dur = Math.max(0.1, (s.end ?? 30) - (s.start ?? 0));
    if (s.mode === "same") return { args: ["-ss", S(s.start ?? 0), "-i", "in0", "-t", S(dur), "-c", "copy", "cutAudio"], outputs: ["cutAudio"] };
    if (s.mode === "wav") return { args: ["-ss", S(s.start ?? 0), "-i", "in0", "-t", S(dur), "-c:a", "pcm_s16le", "cut.wav"], outputs: ["cut.wav"] };
    return { args: ["-ss", S(s.start ?? 0), "-i", "in0", "-t", S(dur), "-c:a", "libmp3lame", "-b:a", "192k", "cut.mp3"], outputs: ["cut.mp3"] };
  },
});

// ── 16. Merge audio ──
export const MergeAudioTool: ComponentType = makeFFmpegTool<{ format: string }>({
  accept: AUDIO_ACCEPT,
  multiple: true,
  minFiles: 2,
  hint: "Joins tracks back-to-back (transcodes to one format)",
  controls: (s, set) => (
    <SelField label="Output format" value={s.format ?? "mp3"} onChange={(v) => set({ format: v })} options={[
      { value: "mp3", label: "MP3" }, { value: "wav", label: "WAV" }, { value: "m4a", label: "M4A" }, { value: "ogg", label: "OGG" },
    ]} />
  ),
  run: async (files, s) => {
    const inputs: string[] = [];
    for (let i = 0; i < files.length; i++) inputs.push("-i", `in${i}`);
    const fmt = s.format ?? "mp3";
    const codec = fmt === "mp3" ? ["-c:a", "libmp3lame", "-b:a", "192k"] : fmt === "wav" ? ["-c:a", "pcm_s16le"] : fmt === "m4a" ? ["-c:a", "aac", "-b:a", "192k"] : ["-c:a", "libvorbis", "-q:a", "5"];
    return { args: [...inputs, "-filter_complex", `concat=n=${files.length}:v=0:a=1[aout]`, "-map", "[aout]", ...codec, `merged.${fmt}`], outputs: [`merged.${fmt}`] };
  },
});

// ── 17. Adjust video ──
export const AdjustVideoTool: ComponentType = makeFFmpegTool<{ brightness: number; contrast: number; saturation: number; grayscale: boolean }>({
  accept: VIDEO_ACCEPT,
  controls: (s, set) => (
    <>
      <NumField label="Brightness (−1 to 1)" value={s.brightness ?? 0} min={-1} max={1} step={0.05} onChange={(v) => set({ brightness: v || 0 })} />
      <NumField label="Contrast (−1000 to 1000)" value={s.contrast ?? 0} min={-1000} max={1000} step={50} onChange={(v) => set({ contrast: v || 0 })} />
      <NumField label="Saturation (0 to 3)" value={s.saturation ?? 1} min={0} max={3} step={0.1} onChange={(v) => set({ saturation: v || 1 })} />
      <Toggle label="Black & white" checked={s.grayscale ?? false} onChange={(v) => set({ grayscale: v })} />
    </>
  ),
  run: async (files, s) => {
    const parts = [`brightness=${(s.brightness ?? 0).toFixed(2)}`, `contrast=${1 + (s.contrast ?? 0) / 1000}`, `saturation=${(s.saturation ?? 1).toFixed(2)}`];
    const filter = (s.grayscale ? "hue=s=0," : "") + parts.join(":");
    return { args: ["-i", "in0", "-vf", `eq=${filter}`, "-c:v", "libx264", "-crf", "22", "-c:a", "copy", "adjusted.mp4"], outputs: ["adjusted.mp4"] };
  },
});

// ── 18. Slideshow maker ──
export const SlideshowTool: ComponentType = makeFFmpegTool<{ seconds: number; audio: boolean }>({
  accept: "image/*,audio/*",
  multiple: true,
  minFiles: 2,
  hint: "Images become slides (last file may be music)",
  controls: (s, set) => (
    <>
      <NumField label="Seconds per image" value={s.seconds ?? 3} min={1} max={15} onChange={(v) => set({ seconds: Math.min(15, Math.max(1, v || 3)) })} />
      <Toggle label="Last file is the soundtrack" checked={s.audio ?? false} onChange={(v) => set({ audio: v })} />
    </>
  ),
  run: async (files, s) => {
    const hasAudio = s.audio ?? false;
    const imgCount = hasAudio ? files.length - 1 : files.length;
    const dur = s.seconds ?? 3;
    const inputs: string[] = [];
    for (let i = 0; i < files.length; i++) inputs.push("-i", `in${i}`);
    const imgInputs = hasAudio ? inputs.slice(0, -2) : inputs;
    const fcParts: string[] = [];
    for (let i = 0; i < imgCount; i++) fcParts.push(`[${i}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p[v${i}]`);
    const concatIn = Array.from({ length: imgCount }, (_, i) => `[v${i}]`).join("");
    fcParts.push(`${concatIn}concat=n=${imgCount}:v=1:a=0[outv]`);
    void imgInputs;
    return {
      args: [...imgInputs, ...(hasAudio ? ["-i", `in${files.length - 1}`] : []), "-filter_complex", fcParts.join(";"), "-map", "[outv]", ...(hasAudio ? ["-map", `${files.length - 1}:a`] : []), ...(hasAudio ? ["-shortest"] : []), "-c:v", "libx264", "-crf", "22", "-c:a", "aac", "-pix_fmt", "yuv420p", "slideshow.mp4"],
      outputs: ["slideshow.mp4"],
      log: `${imgCount} images × ${dur}s`,
    };
  },
});

// ── 19. Reframe (blur-fill vertical) ──
export const ReframeTool: ComponentType = makeFFmpegTool<{ ratio: string }>({
  accept: VIDEO_ACCEPT,
  hint: "Fits the whole frame with a blurred background — nothing cropped",
  controls: (s, set) => (
    <SelField label="Canvas" value={s.ratio ?? "9:16"} onChange={(v) => set({ ratio: v })} options={[
      { value: "9:16", label: "9:16 vertical" }, { value: "1:1", label: "1:1 square" },
    ]} />
  ),
  run: async (files, s) => {
    const filter = s.ratio === "1:1"
      ? "split[a][b];[a]scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080,boxblur=20:5[bg];[b]scale=1080:1080:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2"
      : "split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:5[bg];[b]scale=1080:1920:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2";
    return { args: ["-i", "in0", "-filter_complex", filter, "-c:v", "libx264", "-crf", "23", "-c:a", "copy", "reframed.mp4"], outputs: ["reframed.mp4"] };
  },
});

// ── 20. Volume booster ──
export const VolumeTool: ComponentType = makeFFmpegTool<{ gain: number; normalize: boolean }>({
  accept: `${VIDEO_ACCEPT},${AUDIO_ACCEPT}`,
  hint: "Works on video (adjusts its audio) or plain audio files",
  controls: (s, set) => (
    <>
      <NumField label="Volume ×" value={s.gain ?? 2} min={0.25} max={10} step={0.25} onChange={(v) => set({ gain: v || 1 })} />
      <Toggle label="Normalize to broadcast level (loudnorm)" checked={s.normalize ?? false} onChange={(v) => set({ normalize: v })} hint="Overrides the gain slider; targets −16 LUFS" />
    </>
  ),
  run: async (files, s) => {
    if (s.normalize) return { args: ["-i", "in0", "-c:v", "copy", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "leveled.mp4"], outputs: ["leveled.mp4"] };
    const isAudioOnly = files[0].type.startsWith("audio");
    const out = isAudioOnly ? "louder.mp3" : "louder.mp4";
    return {
      args: ["-i", "in0", ...(isAudioOnly ? ["-af", `volume=${s.gain ?? 2}`, "-c:a", "libmp3lame", "-b:a", "192k"] : ["-c:v", "copy", "-af", `volume=${s.gain ?? 2}`, "-c:a", "aac"]), out],
      outputs: [out],
    };
  },
});

// ── 21. Extract frames ──
export const ExtractFramesTool: ComponentType = makeFFmpegTool<{ every: number; format: string }>({
  accept: VIDEO_ACCEPT,
  hint: "Saves stills — one every N seconds",
  controls: (s, set) => (
    <>
      <NumField label="One frame every (s)" value={s.every ?? 1} min={0.1} max={60} step={0.1} onChange={(v) => set({ every: Math.max(0.1, v || 1) })} />
      <SelField label="Format" value={s.format ?? "jpg"} onChange={(v) => set({ format: v })} options={[{ value: "jpg", label: "JPG" }, { value: "png", label: "PNG" }]} />
    </>
  ),
  run: async (files, s) => {
    const ext = s.format ?? "jpg";
    return { args: ["-i", "in0", "-vf", `fps=1/${s.every ?? 1}`, `-q:v`, "2", `frame-%04d.${ext}`], outputs: [`frame-0001.${ext}`, `frame-0002.${ext}`] };
  },
});

// ── 22. Watermark video ──
export const WatermarkVideoTool: ComponentType = makeFFmpegTool<{ position: string; size: number; opacity: number }>({
  accept: "image/*,video/*",
  multiple: true,
  minFiles: 2,
  hint: "First file = video, second = PNG/SVG logo",
  controls: (s, set) => (
    <>
      <SelField label="Corner" value={s.position ?? "br"} onChange={(v) => set({ position: v })} options={[
        { value: "tl", label: "Top left" }, { value: "tr", label: "Top right" }, { value: "bl", label: "Bottom left" }, { value: "br", label: "Bottom right" },
      ]} />
      <NumField label="Logo width % of video" value={s.size ?? 20} min={5} max={50} onChange={(v) => set({ size: Math.min(50, Math.max(5, v || 20)) })} />
      <NumField label="Opacity %" value={s.opacity ?? 80} min={10} max={100} onChange={(v) => set({ opacity: Math.min(100, Math.max(10, v || 80)) })} />
    </>
  ),
  run: async (files, s) => {
    const w = `iw*${((s.size ?? 20) / 100).toFixed(2)}`;
    const pos = s.position ?? "br";
    const x = pos.endsWith("l") ? "20" : `W-w-20`;
    const y = pos.startsWith("t") ? "20" : `H-h-20`;
    const chain = `[1:v]scale=${w}:-1,format=rgba,colorchannelmixer=aa=${((s.opacity ?? 80) / 100).toFixed(2)}[wm];[0:v][wm]overlay=${x}:${y}`;
    return { args: ["-i", "in0", "-i", "in1", "-filter_complex", chain, "-c:v", "libx264", "-crf", "22", "-c:a", "copy", "branded.mp4"], outputs: ["branded.mp4"] };
  },
});

// ── 23. Remove silence ──
export const RemoveSilenceTool: ComponentType = makeFFmpegTool<{ threshold: string; minPause: number }>({
  accept: AUDIO_ACCEPT,
  hint: "Cuts long pauses (podcasts, lectures, voice notes)",
  controls: (s, set) => (
    <>
      <SelField label="Sensitivity" value={s.threshold ?? "-30dB"} onChange={(v) => set({ threshold: v })} options={[
        { value: "-50dB", label: "Gentle (only real silence)" }, { value: "-35dB", label: "Medium" }, { value: "-25dB", label: "Aggressive (trims quiet speech)" },
      ]} />
      <NumField label="Min pause length (s)" value={s.minPause ?? 0.6} min={0.1} max={5} step={0.1} onChange={(v) => set({ minPause: Math.max(0.1, v || 0.6) })} />
    </>
  ),
  run: async (files, s) => ({
    args: ["-i", "in0", "-af", `silenceremove=stop_periods=-1:stop_duration=${(s.minPause ?? 0.6).toFixed(1)}:stop_threshold=${s.threshold ?? "-30dB"}`, "-c:a", "libmp3lame", "-b:a", "192k", "tightened.mp3"],
    outputs: ["tightened.mp3"],
  }),
});

// ── 24. Boomerang ──
export const BoomerangTool: ComponentType = makeFFmpegTool<{ }>({
  accept: VIDEO_ACCEPT,
  hint: "Forward + reversed = the classic boomerang loop",
  run: async () => ({
    args: ["-i", "in0", "-filter_complex", "[0:v]split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0[outv]", "-map", "[outv]", "-an", "-c:v", "libx264", "-crf", "22", "-movflags", "+faststart", "boomerang.mp4"],
    outputs: ["boomerang.mp4"],
  }),
});

// ── 25. Green screen ──
export const GreenScreenTool: ComponentType = makeFFmpegTool<{ color: string; bg: string; similarity: number }>({
  accept: "video/*,image/*",
  multiple: true,
  minFiles: 1,
  hint: "File 1 = green-screen footage. Optional file 2 = background image/video (else solid color).",
  controls: (s, set) => (
    <>
      <SelField label="Key color" value={s.color ?? "green"} onChange={(v) => set({ color: v })} options={[{ value: "green", label: "Green screen" }, { value: "blue", label: "Blue screen" }]} />
      <NumField label="Similarity % " value={s.similarity ?? 25} min={5} max={60} onChange={(v) => set({ similarity: Math.min(60, Math.max(5, v || 25)) })} hint="Raise if edges remain" />
      <label className="block"><span className="label">Fallback background color (no file 2)</span>
        <input type="color" className="w-10 h-8 rounded-tool-sm border border-border bg-surface-3" value={s.bg ?? "#1d4ed8"} onChange={(e) => set({ bg: e.target.value })} /></label>
    </>
  ),
  run: async (files, s) => {
    const keyFilter = s.color === "blue" ? "chromakey=0x0000FF" : "chromakey=0x00FF00";
    const sim = ((s.similarity ?? 25) / 100).toFixed(2);
    if (files.length >= 2) {
      return {
        args: [
          "-i", "in0", "-i", "in1",
          "-filter_complex",
          `[0:v]${keyFilter}=${sim}:0.05[fg];[1:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720[bg];[bg][fg]overlay=shortest=1[outv]`,
          "-map", "[outv]", "-c:v", "libx264", "-crf", "22", "keyed.mp4",
        ],
        outputs: ["keyed.mp4"],
      };
    }
    const hex = (s.bg ?? "#1d4ed8").replace("#", "0x");
    return {
      args: [
        "-f", "lavfi", "-i", `color=${hex}:s=1280x720:d=10`,
        "-i", "in0",
        "-filter_complex", `[1:v]${keyFilter}=${sim}:0.05[fg];[0:v][fg]overlay=shortest=1[outv]`,
        "-map", "[outv]", "-c:v", "libx264", "-crf", "22", "keyed.mp4",
      ],
      outputs: ["keyed.mp4"],
    };
  },
});

void Note;
