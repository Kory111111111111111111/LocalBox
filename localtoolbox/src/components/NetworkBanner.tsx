import { Wifi, FileWarning } from "lucide-react";

export function NetworkBanner({ note }: { note?: string }) {
  return (
    <div
      role="note"
      className="flex items-start gap-2.5 rounded-tool border px-3.5 py-2.5 text-[13px]"
      style={{
        background: "var(--color-netbanner-bg)",
        borderColor: "var(--color-netbanner-border)",
        color: "var(--color-netbanner-text)",
      }}
    >
      <Wifi size={15} className="mt-0.5 shrink-0" />
      <div>
        <strong className="font-semibold">Needs network.</strong>{" "}
        {note ??
          "This tool must contact an external service to answer your lookup. Only the request you make is sent — your files never leave your device. Every other tool here works fully offline."}
      </div>
    </div>
  );
}

export function ModelBanner({ note }: { note?: string }) {
  return (
    <div
      role="note"
      className="flex items-start gap-2.5 rounded-tool border border-info/30 bg-info/10 px-3.5 py-2.5 text-[13px] text-info"
    >
      <FileWarning size={15} className="mt-0.5 shrink-0" />
      <div>
        <strong className="font-semibold">Downloads an AI model once.</strong>{" "}
        {note ?? "The model is fetched the first time you run this tool, then cached in your browser for offline reuse. Nothing you process is ever uploaded."}
      </div>
    </div>
  );
}
