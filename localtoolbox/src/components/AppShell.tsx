import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import Sidebar from "./Sidebar";
import SearchBox from "./SearchBox";
import SettingsModal, { type SettingsSection } from "./SettingsModal";
import FaqModal from "./FaqModal";
import { CircleHelp, Menu, Settings, X } from "lucide-react";

const SETTINGS_PATHS: Record<string, SettingsSection> = {
  "/about": "about",
  "/privacy": "privacy",
};

export default function AppShell({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>("appearance");
  const [faqOpen, setFaqOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
    window.scrollTo({ top: 0 });
    const section = SETTINGS_PATHS[location];
    if (section) {
      setSettingsSection(section);
      setFaqOpen(false);
      setSettingsOpen(true);
    } else {
      setSettingsOpen(false);
      setFaqOpen(false);
    }
  }, [location]);

  const openSettings = useCallback(
    (section: SettingsSection = "appearance") => {
      setSettingsSection(section);
      setFaqOpen(false);
      setSettingsOpen(true);
      if (location in SETTINGS_PATHS && (section === "about" || section === "privacy")) {
        navigate(`/${section}`);
      }
    },
    [location, navigate],
  );

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    if (location in SETTINGS_PATHS) navigate("/");
  }, [location, navigate]);

  const openFaq = useCallback(() => {
    setSettingsOpen(false);
    setFaqOpen(true);
  }, []);

  const closeFaq = useCallback(() => {
    setFaqOpen(false);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const changeSection = useCallback(
    (section: SettingsSection) => {
      setSettingsSection(section);
      if (location in SETTINGS_PATHS && (section === "about" || section === "privacy")) {
        navigate(`/${section}`);
      }
    },
    [location, navigate],
  );

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:left-4 focus:top-3 focus:px-3 focus:py-1.5 focus:rounded-tool-sm focus:bg-accent focus:text-accent-fg"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur border-b border-border-subtle">
        <div className="flex items-center gap-4 px-4 h-14 max-w-[1400px] mx-auto w-full">
          <button
            type="button"
            className="lg:hidden btn-ghost px-2! shrink-0"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={drawerOpen}
            aria-controls="mobile-nav"
            onClick={() => setDrawerOpen((v) => !v)}
          >
            {drawerOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <Link
            href="/"
            className="hidden lg:flex items-center shrink-0 text-[15px] font-semibold tracking-tight hover:text-accent transition-colors"
          >
            LocalToolBox
          </Link>
          <div className="min-w-0 flex-1">
            <SearchBox />
          </div>
          <button
            type="button"
            className="btn-ghost px-2.5! shrink-0"
            aria-label="Open FAQ"
            aria-expanded={faqOpen}
            onClick={openFaq}
          >
            <CircleHelp size={16} />
            <span className="hidden sm:inline text-sm">FAQ</span>
          </button>
          <button
            type="button"
            className="btn-ghost px-2.5! shrink-0"
            aria-label="Open settings"
            aria-expanded={settingsOpen}
            onClick={() => openSettings(settingsSection)}
          >
            <Settings size={16} />
            <span className="hidden sm:inline text-sm">Settings</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full">
        <aside className="hidden lg:block w-56 shrink-0 border-r border-border-subtle sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-y-auto bg-bg z-20">
          <Sidebar />
        </aside>
        {drawerOpen && (
          <div className="lg:hidden fixed inset-0 z-30 pt-14">
            <button
              type="button"
              className="absolute inset-0 bg-bg/80"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
            />
            <nav
              id="mobile-nav"
              className="relative h-full overflow-y-auto px-4 pb-8 bg-bg border-r border-border-subtle max-w-xs"
              aria-label="Navigation"
            >
              <Sidebar />
            </nav>
          </div>
        )}
        <main id="main" className="flex-1 min-w-0 px-4 sm:px-6 py-6">{children}</main>
      </div>

      <footer className="border-t border-border-subtle mt-10">
        <div className="max-w-[1400px] mx-auto px-4 py-6 text-xs text-ink-dim flex flex-wrap gap-x-6 gap-y-2 items-center">
          <span>LocalToolBox — open source (MIT). Built to keep your files on your device.</span>
          <Link href="/llms" className="hover:text-ink-muted ml-auto">
            llms.txt
          </Link>
        </div>
      </footer>

      <FaqModal open={faqOpen} onClose={closeFaq} />
      <SettingsModal
        open={settingsOpen}
        section={settingsSection}
        onSectionChange={changeSection}
        onClose={closeSettings}
      />
    </div>
  );
}
