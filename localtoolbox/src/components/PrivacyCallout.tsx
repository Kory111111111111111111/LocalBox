import { ShieldCheck } from "lucide-react";

export default function PrivacyCallout() {
  return (
    <div className="card border-success/25 bg-success/5 p-4 flex items-start gap-3">
      <ShieldCheck size={18} className="text-success mt-0.5 shrink-0" />
      <div className="text-[13px] leading-relaxed">
        <strong className="text-ink font-semibold">Files stay on your device.</strong>{" "}
        <span className="text-ink-muted">
          This tool runs entirely in your browser — there is no server-side processing, no upload,
          and no account. Close the tab and nothing is left behind. LocalToolBox is open source, so
          you can verify exactly what the code does.
        </span>
      </div>
    </div>
  );
}
