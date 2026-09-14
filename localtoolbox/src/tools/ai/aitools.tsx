// On-device AI tools — Transformers.js with open-weights models cached by the
// browser after the first download. Nothing you record, upload, or drop here
// ever leaves the machine.
import { useEffect, useRef, useState, type ComponentType } from "react";
import ToolLayout from "../../components/ToolLayout";
import Dropzone, { toDropped, type DroppedFile } from "../../components/Dropzone";
import EditorPane from "../../components/EditorPane";
import { Note, NumField, OptionsBar, OutputArea, ProgressBar, RunButton, SelField, Toggle } from "../../components/ui";
import { downloadBlob, downloadText, zipFiles } from "../../lib/download";

type PipelineProgress = { status: string; file?: string; progress?: number; loaded?: number; total?: number };

function useModelProgress() {
  const [items, setItems] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const cb = useRef((data: PipelineProgress) => {
    if (data.status === "progress" && data.file) {
      setItems((old) => ({ ...old, [data.file!]: (data.progress ?? 0) / 100 }));
    } else if (data.status === "ready") {
      setDone(true);
    }
  });
  const avg = Object.values(items).length ? Object.values(items).reduce((a, b) => a + b, 0) / Object.values(items).length : 0;
  const reset = () => { setItems({}); setDone(false); };
  return { onProgress: cb.current, items, avg, done, reset };
}

function DownloadPanel({ progress, note }: { progress: { avg: number; items: Record<string, number> }; note: string }) {
  if (Object.keys(progress.items).length === 0) return null;
  return (
    <div className="card border-info/30 bg-info/5 p-3.5 flex flex-col gap-2">
      <div className="text-[13px] text-info font-medium">{note}</div>
      <ProgressBar value={progress.avg} label={`${Math.round(progress.avg * 100)}%`} />
    </div>
  );
}

// ── shared whisper loader (audio in → pipeline) ──
async function audioToFloat32(blob: Blob): Promise<Float32Array> {
  const buf = await blob.arrayBuffer();
  const ctx = new AudioContext({ sampleRate: 16000 });
  try {
    const decoded = await ctx.decodeAudioData(buf);
    // mixdown to mono
    if (decoded.numberOfChannels === 1) return decoded.getChannelData(0);
    const left = decoded.getChannelData(0);
    const right = decoded.getChannelData(1);
    const out = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) out[i] = (left[i] + right[i]) / 2;
    return out;
  } finally {
    await ctx.close();
  }
}

async function extractAudioViaFFmpeg(file: File): Promise<Blob> {
  const { getFFmpeg, writeFile, readFileBlob, cleanup } = await import("../video/ff");
  const ff = await getFFmpeg();
  const name = await writeFile(ff, file.name, file);
  try {
    await ff.exec(["-i", name, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", "extracted.wav"]);
    return await readFileBlob(ff, "extracted.wav");
  } finally {
    await cleanup(ff, [name, "extracted.wav"]);
  }
}

const WHISPER_MODEL = "onnx-community/whisper-tiny.en";
const WHISPER_NOTE = "Downloading Whisper tiny (~45 MB, MIT-licensed OpenAI weights, q8 quantized)";

function useWhisper(status: (s: string) => void) {
  const [transcriber, setTranscriber] = useState<any>(null);
  const load = async (onProgress: (d: PipelineProgress) => void) => {
    if (transcriber) return transcriber;
    status("Loading the speech-recognition model…");
    const { pipeline } = await import("@huggingface/transformers");
    const p = await pipeline("automatic-speech-recognition", WHISPER_MODEL, {
      dtype: { encoder_model: "q8", decoder_model_merged: "q8" },
      device: "wasm",
      progress_callback: onProgress,
    });
    setTranscriber(p);
    status("Model ready.");
    return p;
  };
  return { load, has: !!transcriber };
}

// ── Transcribe ──
export const TranscribeTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const model = useModelProgress();
  const whisper = useWhisper(setStatus);

  const run = async () => {
    const file = files[0]?.file;
    if (!file) return;
    setBusy(true);
    setError(null);
    setText("");
    try {
      model.reset();
      const asr = await whisper.load(model.onProgress);
      setStatus(file.type.startsWith("video") || /\.(mp4|webm|mov|mkv|avi|mkv)$/i.test(file.name) ? "Extracting the audio track…" : "Decoding audio…");
      const audioBlob = file.type.startsWith("audio") || /\.(mp3|wav|m4a|ogg|flac|opus|aac)$/i.test(file.name) ? file : await extractAudioViaFFmpeg(file);
      setStatus("Transcribing — this runs at roughly real-time speed on most machines…");
      const audio = await audioToFloat32(audioBlob);
      const out = await asr(audio, { chunk_length_s: 30, stride_length_s: 5 });
      setText(out.text?.trim() ?? "");
      setStatus("Done.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  };

  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <Dropzone files={files} onFiles={(f) => setFiles(toDropped(f))} accept="audio/*,video/*" hint="Audio or video" />
        <DownloadPanel progress={model} note={WHISPER_NOTE} />
        {error && <Note kind="error">{error}</Note>}
        <div className="flex items-center gap-3">
          <RunButton onClick={run} busy={busy} disabled={!files.length} label="Transcribe" />
          {status && !busy && <span className="text-xs text-ink-muted">{status}</span>}
        </div>
        {busy && status && <ProgressBar value={0.4} label={status} />}
        {text && <OutputArea text={text} filename="transcript.txt" rows={10} label="Transcript" />}
      </div>
    </ToolLayout>
  );
};

// ── Subtitle generator ──
function toSrt(segments: { start: number; end: number; text: string }[]): string {
  const t = (sec: number) => {
    const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const s = String(Math.floor(sec % 60)).padStart(2, "0");
    const ms = String(Math.floor((sec % 1) * 1000)).padStart(3, "0");
    return `${h}:${m}:${s},${ms}`;
  };
  return segments.map((seg, i) => `${i + 1}\n${t(seg.start)} --> ${t(seg.end)}\n${seg.text.trim()}\n`).join("\n");
}
function toVtt(segments: { start: number; end: number; text: string }[]): string {
  const t = (sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(Math.floor(sec % 60)).padStart(2, "0");
    const ms = String(Math.floor((sec % 1) * 1000)).padStart(3, "0");
    return `00:${m}:${s}.${ms}`;
  };
  return "WEBVTT\n\n" + segments.map((seg) => `${t(seg.start)} --> ${t(seg.end)}\n${seg.text.trim()}\n`).join("\n");
}

export const SubtitleGeneratorTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [segments, setSegments] = useState<{ start: number; end: number; text: string }[]>([]);
  const [format, setFormat] = useState("srt");
  const [error, setError] = useState<string | null>(null);
  const model = useModelProgress();
  const whisper = useWhisper(setStatus);

  const run = async () => {
    const file = files[0]?.file;
    if (!file) return;
    setBusy(true);
    setError(null);
    setSegments([]);
    try {
      model.reset();
      const asr = await whisper.load(model.onProgress);
      setStatus("Extracting audio…");
      const audioBlob = file.type.startsWith("audio") ? file : await extractAudioViaFFmpeg(file);
      setStatus("Recognizing speech with timestamps…");
      const audio = await audioToFloat32(audioBlob);
      const out = await asr(audio, { chunk_length_s: 30, stride_length_s: 5, return_timestamps: true });
      const chunks = (out.chunks ?? []).map((c: { timestamp: [number, number | null]; text: string }) => ({
        start: c.timestamp[0] ?? 0,
        end: c.timestamp[1] ?? (c.timestamp[0] ?? 0) + 2,
        text: c.text,
      }));
      setSegments(chunks.length ? chunks : [{ start: 0, end: 5, text: out.text ?? "" }]);
      setStatus("Done.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  };

  const subtitleText = format === "srt" ? toSrt(segments) : toVtt(segments);

  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <Dropzone files={files} onFiles={(f) => setFiles(toDropped(f))} accept="audio/*,video/*" hint="Audio or video" />
        <DownloadPanel progress={model} note={WHISPER_NOTE} />
        <OptionsBar>
          <SelField label="Subtitle format" value={format} onChange={setFormat} options={[{ value: "srt", label: "SRT" }, { value: "vtt", label: "WebVTT" }]} />
        </OptionsBar>
        {error && <Note kind="error">{error}</Note>}
        <div className="flex items-center gap-3">
          <RunButton onClick={run} busy={busy} disabled={!files.length} label="Generate subtitles" />
          {status && !busy && <span className="text-xs text-ink-muted">{status}</span>}
        </div>
        {segments.length > 0 && (
          <>
            <div className="card overflow-auto max-h-80">
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 bg-surface">
                  <tr className="text-left text-[11px] uppercase tracking-wide text-ink-dim border-b border-border">
                    <th className="px-3 py-2">#</th><th className="px-3 py-2">Start</th><th className="px-3 py-2">End</th><th className="px-3 py-2">Text</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {segments.map((s, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1 text-ink-dim tabular-nums">{i + 1}</td>
                      <td className="px-3 py-1 font-mono tabular-nums">{s.start.toFixed(2)}s</td>
                      <td className="px-3 py-1 font-mono tabular-nums">{s.end.toFixed(2)}s</td>
                      <td className="px-3 py-1">{s.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <OutputArea text={subtitleText} rows={8} label="Subtitle file" />
            <div className="flex gap-2">
              <button className="btn-primary" onClick={() => downloadText(`subtitles.${format}`, subtitleText, "text/plain")}>Download .{format}</button>
              {format === "srt" && <button className="btn-ghost" onClick={() => downloadText("subtitles.vtt", toVtt(segments), "text/vtt")}>Also grab .vtt</button>}
            </div>
            <Note>Whisper tiny is a small model — it will mishear names and jargon. Treat the output as a first pass and fix cues before publishing.</Note>
          </>
        )}
      </div>
    </ToolLayout>
  );
};

// ── Text to speech (Web Speech API — zero download) ──
export const TextToSpeechTool: ComponentType = () => {
  const [text, setText] = useState("LocalToolBox reads this aloud using your device's own voices. Nothing is sent anywhere.");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const load = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length) setVoices(list);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = () => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = voices.find((v) => v.name === voiceName);
    if (voice) u.voice = voice;
    u.rate = rate;
    u.pitch = pitch;
    u.volume = volume;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  };
  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <EditorPane value={text} onChange={setText} rows={7} inputLabel="Text to read aloud" sample="The quick brown fox jumps over the lazy dog." />
        <OptionsBar>
          <SelField label="Voice" value={voiceName} onChange={setVoiceName} options={[
            { value: "", label: `System default (${voices.length} available)` },
            ...voices.map((v) => ({ value: v.name, label: `${v.name} (${v.lang})` })),
          ]} />
          <NumField label="Rate ×" value={rate} min={0.5} max={2} step={0.1} onChange={(v) => setRate(v || 1)} />
          <NumField label="Pitch" value={pitch} min={0.5} max={2} step={0.1} onChange={(v) => setPitch(v || 1)} />
          <NumField label="Volume" value={volume} min={0} max={1} step={0.1} onChange={(v) => setVolume(v ?? 1)} />
        </OptionsBar>
        <div className="flex gap-2">
          {!speaking ? <RunButton label="Speak" onClick={speak} /> : <button className="btn-danger" onClick={stop}>⏹ Stop</button>}
        </div>
        <Note>Uses your device’s voices. No file export — browsers don’t support offline TTS-to-file.</Note>
      </div>
    </ToolLayout>
  );
};

// ── Background remover (MODNet portrait matting, Apache-2.0) ──
export const BackgroundRemoverTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [bgColor, setBgColor] = useState("transparent");
  const model = useModelProgress();

  const run = async () => {
    const file = files[0]?.file;
    if (!file) return;
    setBusy(true);
    setError(null);
    setResultUrl(null);
    try {
      model.reset();
      setStatus("Loading the matting model…");
      const { AutoModel, RawImage } = await import("@huggingface/transformers");
      const m = await AutoModel.from_pretrained("Xenova/modnet", { progress_callback: model.onProgress });
      setStatus("Analyzing the image…");
      const image = await RawImage.fromURL(URL.createObjectURL(file));
      const out = await m({ input: image });
      const mask = out.output as { data: Float32Array; dims: number[] };
      setStatus("Compositing…");
      // draw original
      const bmp = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bmp, 0, 0);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // resize mask to image size
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = mask.dims[1];
      maskCanvas.height = mask.dims[0];
      const maskData = maskCanvas.getContext("2d")!.createImageData(mask.dims[1], mask.dims[0]);
      for (let i = 0; i < mask.data.length; i++) {
        maskData.data[i * 4] = maskData.data[i * 4 + 1] = maskData.data[i * 4 + 2] = Math.round((mask.data[i] ?? 0) * 255);
        maskData.data[i * 4 + 3] = 255;
      }
      maskCanvas.getContext("2d")!.putImageData(maskData, 0, 0);
      const maskBmp = await createImageBitmap(maskCanvas);
      // apply mask as destination-in
      const maskLayer = document.createElement("canvas");
      maskLayer.width = canvas.width;
      maskLayer.height = canvas.height;
      const mlCtx = maskLayer.getContext("2d")!;
      mlCtx.drawImage(maskBmp, 0, 0, maskLayer.width, maskLayer.height);
      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(maskLayer, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      // optional solid background
      if (bgColor !== "transparent") {
        const bgCanvas = document.createElement("canvas");
        bgCanvas.width = canvas.width;
        bgCanvas.height = canvas.height;
        const bgCtx = bgCanvas.getContext("2d")!;
        bgCtx.fillStyle = bgColor;
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        bgCtx.drawImage(canvas, 0, 0);
        const blob = await new Promise<Blob>((res) => bgCanvas.toBlob((b) => res(b!), "image/png"));
        setResultBlob(blob);
        setResultUrl(URL.createObjectURL(blob));
      } else {
        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
        setResultBlob(blob);
        setResultUrl(URL.createObjectURL(blob));
      }
      setStatus("Done.");
      void frame;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  };

  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <Dropzone files={files} onFiles={(f) => setFiles(toDropped(f))} accept="image/*" />
        <DownloadPanel progress={model} note="Downloading MODNet (~28 MB, Apache-2.0) — portrait matting model" />
        <OptionsBar>
          <label className="block"><span className="label">Background</span>
            <div className="flex gap-2 items-center">
              <button className={`chip ${bgColor === "transparent" ? "!border-accent !text-accent" : ""}`} onClick={() => setBgColor("transparent")}>transparent</button>
              <button className={`chip ${bgColor === "#ffffff" ? "!border-accent !text-accent" : ""}`} onClick={() => setBgColor("#ffffff")}>white</button>
              <button className={`chip ${bgColor === "#000000" ? "!border-accent !text-accent" : ""}`} onClick={() => setBgColor("#000000")}>black</button>
              <input type="color" value={bgColor === "transparent" ? "#3b82f6" : bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-9 h-8 rounded-tool-sm border border-border bg-surface-3" aria-label="Custom background color" />
            </div>
          </label>
        </OptionsBar>
        {error && <Note kind="error">{error}</Note>}
        <div className="flex items-center gap-3">
          <RunButton onClick={run} busy={busy} disabled={!files.length} label="Remove background" />
          {status && !busy && <span className="text-xs text-ink-muted">{status}</span>}
        </div>
        {busy && status && <ProgressBar value={0.4} label={status} />}
        {resultUrl && resultBlob && (
          <>
            <div className="card p-4 flex justify-center checkerboard">
              <img src={resultUrl} alt="Background removed result" className="max-h-96 object-contain rounded-tool-sm" />
            </div>
            <button className="btn-primary self-start" onClick={() => downloadBlob("no-background.png", resultBlob)}>Download PNG</button>
          </>
        )}
      </div>
    </ToolLayout>
  );
};

// zip re-export kept minimal
void zipFiles;
