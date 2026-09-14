// Screen recorder — getDisplayMedia + MediaRecorder, everything stays local.
import { useEffect, useRef, useState, type ComponentType } from "react";
import ToolLayout from "../../components/ToolLayout";
import { Note, OptionsBar, RunButton, SelField, Toggle } from "../../components/ui";
import { downloadBlob, formatBytes } from "../../lib/download";

export const ScreenRecorderTool: ComponentType = () => {
  const [mimeType, setMimeType] = useState("video/webm");
  const [withMic, setWithMic] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => stopStreams(), []);

  const stopStreams = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const pickMime = () => {
    const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
    return candidates.find((c) => MediaRecorder.isTypeSupported(c)) ?? "";
  };

  const start = async () => {
    setError(null);
    setResult(null);
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: false,
      });
      let stream = display;
      if (withMic) {
        try {
          const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
          const ctx = new AudioContext();
          const dest = ctx.createMediaStreamDestination();
          ctx.createMediaStreamSource(mic).connect(dest);
          dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
        } catch {
          setError("Microphone permission denied — recording screen without sound.");
        }
      }
      streamRef.current = stream;
      chunksRef.current = [];
      const rec = new MediaRecorder(stream, { mimeType: pickMime() || undefined });
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "video/webm" });
        setResult({ blob, size: blob.size });
        stopStreams();
      };
      display.getVideoTracks()[0].addEventListener("ended", () => {
        if (recorderRef.current?.state === "recording") recorderRef.current.stop();
        setRecording(false);
      });
      recorderRef.current = rec;
      rec.start(1000);
      setRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (e) {
      if ((e as Error).name !== "NotAllowedError") setError(e instanceof Error ? e.message : String(e));
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <SelField label="Container" value={mimeType} onChange={setMimeType} options={[
            { value: "video/webm", label: "WebM (best support)" },
            { value: "video/mp4", label: "MP4 (browser-dependent)" },
          ]} />
          <Toggle label="Include microphone audio" checked={withMic} onChange={setWithMic} />
        </OptionsBar>
        {error && <Note kind="warn">{error}</Note>}
        <div className="flex items-center gap-3">
          {!recording ? (
            <RunButton label="Pick screen & start recording" onClick={start} />
          ) : (
            <button className="btn-danger" onClick={stop}>
              ⏹ Stop ({Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")})
            </button>
          )}
          {recording && <span className="text-sm text-danger">● Recording your selected screen, window, or tab</span>}
        </div>
        {result && (
          <div className="card p-4 flex flex-col gap-3">
            <div className="text-sm">
              Recording ready — <strong>{formatBytes(result.size)}</strong>. It lives only in this tab until you save it.
            </div>
            <video src={URL.createObjectURL(result.blob)} controls className="max-h-96 rounded-tool border border-border" />
            <button className="btn-primary self-start" onClick={() => downloadBlob(`screen-recording.${result.blob.type.includes("mp4") ? "mp4" : "webm"}`, result.blob)}>
              Download recording
            </button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
