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
        {note ?? "Sends only the lookup you type."}
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
        {note ?? "Fetched the first time you run this, then cached for offline reuse."}
      </div>
    </div>
  );
}
