import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import Sidebar from "./Sidebar";
import SearchBox from "./SearchBox";
import SettingsModal, { type SettingsSection } from "./SettingsModal";
import FaqModal from "./FaqModal";
import { CircleHelp, Menu, Settings, X } from "lucide-react";

const SETTINGS_PATHS: Record<string, SettingsSection> = {
  "/about": "about",
  "/privacy": "privacy",
  "/contact": "contact",
};

export default function AppShell({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>("about");
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
    (section: SettingsSection = "about") => {
      setSettingsSection(section);
      setFaqOpen(false);
      setSettingsOpen(true);
      if (location in SETTINGS_PATHS) navigate(`/${section}`);
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

  const changeSection = useCallback(
    (section: SettingsSection) => {
      setSettingsSection(section);
      if (location in SETTINGS_PATHS) navigate(`/${section}`);
    },
    [location, navigate],
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur border-b border-border-subtle">
        <div className="relative flex items-center justify-center px-14 lg:px-4 h-14 w-full">
          <button
            className="lg:hidden absolute left-4 top-1/2 -translate-y-1/2 btn-ghost !px-2"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            {drawerOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex items-center justify-center gap-3 w-full max-w-3xl">
            <div className="min-w-0 flex-1">
              <SearchBox />
            </div>
            <button
              type="button"
              className="btn-ghost !px-2.5 shrink-0"
              aria-label="Open FAQ"
              onClick={openFaq}
            >
              <CircleHelp size={16} />
              <span className="hidden sm:inline text-sm">FAQ</span>
            </button>
            <button
              type="button"
              className="btn-ghost !px-2.5 shrink-0"
              aria-label="Open settings"
              onClick={() => openSettings(settingsSection)}
            >
              <Settings size={16} />
              <span className="hidden sm:inline text-sm">Settings</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full">
        <aside className="hidden lg:block w-56 shrink-0 border-r border-border-subtle">
          <Sidebar />
        </aside>
        {drawerOpen && (
          <div className="lg:hidden fixed inset-0 z-30 pt-14 bg-bg/98" role="dialog" aria-label="Navigation">
            <div className="h-full overflow-y-auto px-4 pb-8">
              <Sidebar />
            </div>
          </div>
        )}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6">{children}</main>
      </div>

      <footer className="border-t border-border-subtle mt-10">
        <div className="max-w-[1400px] mx-auto px-4 py-6 text-xs text-ink-dim flex flex-wrap gap-x-6 gap-y-2 items-center">
          <span>LocalToolBox — open source (MIT). Built to keep your files on your device.</span>
          <span className="flex gap-4 ml-auto">
            <button type="button" className="hover:text-ink-muted" onClick={() => openSettings("about")}>
              About
            </button>
            <button type="button" className="hover:text-ink-muted" onClick={() => openSettings("privacy")}>
              Privacy
            </button>
            <a href="/terms" className="hover:text-ink-muted">Terms</a>
            <button type="button" className="hover:text-ink-muted" onClick={() => openSettings("contact")}>
              Contact
            </button>
            <a href="/llms.txt" className="hover:text-ink-muted">llms.txt</a>
          </span>
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
