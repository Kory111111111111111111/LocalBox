import { useEffect, useId, useRef, type ReactNode } from "react";
import { FileText, Info, Palette, Shield, X } from "lucide-react";
import { TermsBody } from "../pages/Terms";
import AppearanceSettings from "./AppearanceSettings";

export type SettingsSection = "appearance" | "about" | "privacy" | "terms";

const SECTIONS: { id: SettingsSection; label: string; icon: typeof Info }[] = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "about", label: "About", icon: Info },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "terms", label: "Terms", icon: FileText },
];

export default function SettingsModal({
  open,
  section,
  onSectionChange,
  onClose,
}: {
  open: boolean;
  section: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  onClose: () => void;
}) {
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
        aria-label="Close settings"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative card shadow-tool w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-tool outline-none"
      >
        <header className="flex items-center gap-3 px-4 sm:px-5 h-12 border-b border-border-subtle shrink-0">
          <h2 id={titleId} className="font-semibold tracking-tight text-[15px]">
            Settings
          </h2>
          <button
            type="button"
            className="btn-ghost !px-2 ml-auto"
            aria-label="Close settings"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex flex-col sm:flex-row min-h-0 flex-1">
          <nav
            aria-label="Settings sections"
            className="flex sm:flex-col gap-1 p-2 sm:p-3 sm:w-44 shrink-0 border-b sm:border-b-0 sm:border-r border-border-subtle overflow-x-auto"
          >
            {SECTIONS.map((item) => {
              const active = item.id === section;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? "true" : undefined}
                  onClick={() => onSectionChange(item.id)}
                  className={`flex items-center gap-2 rounded-tool-sm px-3 py-2 text-sm shrink-0 transition-colors ${
                    active
                      ? "bg-surface-3 text-ink font-medium"
                      : "text-ink-muted hover:text-ink hover:bg-surface-2"
                  }`}
                >
                  <Icon size={14} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-6 py-5">
            <SettingsSectionBody section={section} onSectionChange={onSectionChange} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsSectionBody({
  section,
  onSectionChange,
}: {
  section: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}) {
  switch (section) {
    case "appearance":
      return <AppearanceSettings />;
    case "about":
      return <AboutBody onOpenPrivacy={() => onSectionChange("privacy")} />;
    case "privacy":
      return <PrivacyBody />;
    case "terms":
      return <TermsSection />;
    default: {
      const _exhaustive: never = section;
      return _exhaustive;
    }
  }
}

function AboutBody({ onOpenPrivacy }: { onOpenPrivacy: () => void }) {
  return (
    <div>
      <h3 className="text-lg font-semibold tracking-tight mb-2">About LocalToolBox</h3>
      <p className="text-sm text-ink-muted mb-6 leading-relaxed">
        LocalToolBox is a free, open-source collection of {`300+`} browser utilities. It exists
        because most everyday file and text chores don't need a server — your device is already
        powerful enough, and keeping data local is simpler, faster, and private by default.
      </p>

      <section className="mb-6">
        <h4 className="section-title">Our stance</h4>
        <ul className="space-y-2.5 text-sm text-ink-muted leading-relaxed">
          <li>
            <strong className="text-ink">Client-side first.</strong> Files are processed by your
            browser (Canvas, Web Crypto, Web Workers, WebAssembly, on-device AI). There is no
            server-side file pipeline at all.
          </li>
          <li>
            <strong className="text-ink">No accounts.</strong> Nothing to sign up for, nothing to
            log into, no email required.
          </li>
          <li>
            <strong className="text-ink">No watermarks, no ads.</strong> Output files come out
            clean, and the site stays clean too.
          </li>
          <li>
            <strong className="text-ink">Honest labels.</strong> A small number of tools (DNS
            lookups, WHOIS, IP info…) genuinely need the network. Those tools — and only those —
            show a visible network banner. Everything else works offline once loaded.
          </li>
          <li>
            <strong className="text-ink">AI without uploads.</strong> Tools like transcription and
            background removal download an open-weights model once, cache it in your browser, and
            run it locally from then on. Your audio and images never leave the machine.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h4 className="section-title">Open source</h4>
        <p className="text-sm text-ink-muted leading-relaxed">
          The entire project is MIT-licensed. Third-party libraries and their licenses are listed
          in THIRD_PARTY_NOTICES.md. You can audit the code, self-host it, fork it, or bend it to
          your needs — that's the point.
        </p>
      </section>

      <section>
        <h4 className="section-title">How it's funded</h4>
        <p className="text-sm text-ink-muted leading-relaxed">
          It isn't, yet — it's a static site you could host anywhere for free. No ads run by
          default and no analytics are collected. If that ever changes, it will be documented in{" "}
          <button type="button" className="link" onClick={onOpenPrivacy}>
            Privacy
          </button>{" "}
          first.
        </p>
      </section>
    </div>
  );
}

function PrivacyBody() {
  return (
    <div>
      <h3 className="text-lg font-semibold tracking-tight mb-2">Privacy policy</h3>
      <p className="text-sm text-ink-dim mb-6">
        Plain-English version: your files stay on your device. Details below.
      </p>

      <div className="space-y-6 text-sm text-ink-muted leading-relaxed">
        <PrivacyBlock title="The short version">
          LocalToolBox is a static web app. There is no backend that receives your files, no
          account system, and no analytics running by default. Processing happens inside your
          browser tab. When you close the tab, your data is gone from memory — nothing is stored
          unless you explicitly download a result.
        </PrivacyBlock>
        <PrivacyBlock title="What stays on your device">
          Every file you load into any tool — PDFs, images, videos, audio, text, code — is read
          and processed locally using standard browser APIs. Files are never transmitted to us or
          any third party. This applies to all tools <em>except</em> the handful labeled with a
          network banner (see below).
        </PrivacyBlock>
        <PrivacyBlock title="Network-labeled tools">
          A few tools cannot work offline by nature: DNS lookup, WHOIS, IP address info, SSL
          checks, ping/connectivity tests, network speed tests, port checks, sunrise/sunset
          lookups, and social/thumbnail previews. When you use one, the request you type (for
          example, a domain name) is sent to the external service needed to answer it — and
          nothing else. These tools display a yellow “needs network” banner so you always know
          when it's happening.
        </PrivacyBlock>
        <PrivacyBlock title="AI model downloads">
          The transcription and background-removal tools fetch open-weights AI models (Whisper
          tiny, ~75 MB; MODNet, ~28 MB) the first time you run them. Models are downloaded from
          public model hubs, cached in your browser's storage, and reused offline afterwards.
          The media you process with these models is analyzed on your device and never uploaded.
          You can clear the cached models at any time via your browser's site-data settings.
        </PrivacyBlock>
        <PrivacyBlock title="Cookies, tracking, ads">
          None by default. No analytics scripts, no ad networks, no tracking cookies. The app
          may use standard browser storage (Cache Storage, IndexedDB) purely to cache its own
          code and the optional AI models described above — that storage never contains your
          files after you leave the tool.
        </PrivacyBlock>
        <PrivacyBlock title="Hosting logs">
          Like any website, the service hosting this static site may keep brief server logs (IP
          address, request time, user agent) for security and debugging. Those logs are not
          accessible to us in any identifiable form and are not used to profile you.
        </PrivacyBlock>
        <PrivacyBlock title="Your control">
          Because everything is local, “deleting your data” is as simple as closing the tab. No
          account to delete, no server copies to request. The source code is public, so every
          claim on this page is verifiable.
        </PrivacyBlock>
      </div>
    </div>
  );
}

function TermsSection() {
  return (
    <div>
      <h3 className="text-lg font-semibold tracking-tight mb-2">Terms of use</h3>
      <p className="text-sm text-ink-dim mb-6">Last updated: September 2026</p>
      <TermsBody />
    </div>
  );
}

function PrivacyBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h4 className="text-ink font-semibold mb-1.5">{title}</h4>
      <p>{children}</p>
    </section>
  );
}

