import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import FaqAccordion, { type Faq } from "./FaqAccordion";

const SITE_FAQ: Faq[] = [
  {
    q: "Is my data uploaded anywhere?",
    a: "No. Every file and every bit of text you put into a tool is processed inside your browser tab. There is no backend that receives your input. The only exceptions are the handful of lookup tools labeled with a yellow “needs network” banner — those send just the domain, IP, or URL you typed, and nothing else.",
  },
  {
    q: "Can I use it offline?",
    a: "Yes, after the page has loaded once. Network-labeled tools (DNS, WHOIS, IP info, and similar lookups) still need a connection to answer. AI tools (transcription, background removal, subtitles) also work offline after a one-time model download that is cached in your browser.",
  },
  {
    q: "Do AI tools upload my audio or images?",
    a: "No. Tools like transcription and background removal download an open-weights model once (Whisper tiny, ~75 MB; MODNet, ~28 MB), cache it, and run it on your device from then on. The media you process never leaves the machine. You can clear cached models from your browser’s site-data settings.",
  },
  {
    q: "Are there size or usage limits?",
    a: "There are no artificial limits or quotas. Practical limits come from your device’s memory and processing power; very large inputs may be slow or fail on low-RAM devices.",
  },
  {
    q: "Is it free? Are there watermarks or accounts?",
    a: "Free, forever, and open source (MIT). No account, no watermark on outputs, no ads. LocalToolBox is built to stay that way.",
  },
];

export default function FaqModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
        aria-label="Close FAQ"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative card shadow-tool w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-tool outline-none"
      >
        <header className="flex items-center gap-3 px-4 sm:px-5 h-12 border-b border-border-subtle shrink-0">
          <h2 id={titleId} className="font-semibold tracking-tight text-[15px]">
            FAQ
          </h2>
          <button
            type="button"
            className="btn-ghost !px-2 ml-auto"
            aria-label="Close FAQ"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <FaqAccordion items={SITE_FAQ} />
        </div>
      </div>
    </div>
  );
}
