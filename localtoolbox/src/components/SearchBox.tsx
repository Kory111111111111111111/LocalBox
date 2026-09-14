import { useEffect, useId, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Search, Wifi, Cpu } from "lucide-react";
import { TOOLS } from "../lib/registry";
import { searchTools } from "../lib/search";
import { iconFor } from "../lib/icons";

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return el.isContentEditable;
}

export default function SearchBox({ autoFocusOnSlash = true }: { autoFocusOnSlash?: boolean }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [, navigate] = useLocation();

  const results = q.trim() ? searchTools(q, TOOLS, 10) : [];
  const listOpen = open && Boolean(q.trim());
  const activeId = listOpen && results[active] ? `${listId}-${results[active].slug}` : undefined;

  useEffect(() => {
    if (!autoFocusOnSlash) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [autoFocusOnSlash]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    setActive((a) => (results.length === 0 ? 0 : Math.min(a, results.length - 1)));
  }, [results.length]);

  const go = (slug: string) => {
    setOpen(false);
    setQ("");
    navigate(`/tools/${slug}`);
  };

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none" />
        <input
          ref={inputRef}
          className="input !pl-8 !pr-14"
          placeholder="Search tools…"
          value={q}
          role="combobox"
          aria-label="Search tools"
          aria-autocomplete="list"
          aria-expanded={listOpen}
          aria-controls={listId}
          aria-activedescendant={activeId}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              inputRef.current?.blur();
            } else if (e.key === "ArrowDown") {
              if (results.length === 0) return;
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              if (results.length === 0) return;
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && results[active]) {
              e.preventDefault();
              go(results[active].slug);
            }
          }}
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 kbd hidden sm:inline-flex">/</span>
      </div>

      {listOpen && (
        <div className="absolute z-50 mt-1.5 w-full card shadow-tool overflow-hidden">
          {results.length === 0 ? (
            <div id={listId} role="status" className="px-3 py-4 text-sm text-ink-dim">
              No tools match “{q}”. Try fewer words, or browse a category.
            </div>
          ) : (
            <ul id={listId} role="listbox" className="max-h-[60vh] overflow-y-auto py-1">
              {results.map((t, i) => {
                const Icon = iconFor(t.icon, t.category);
                return (
                  <li key={t.slug} role="presentation">
                    <button
                      id={`${listId}-${t.slug}`}
                      type="button"
                      role="option"
                      aria-selected={i === active}
                      className={`w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm ${
                        i === active ? "bg-surface-2" : "hover:bg-surface-2"
                      }`}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(t.slug)}
                    >
                      <Icon size={15} className="text-ink-muted shrink-0" />
                      <span className="truncate">{t.name}</span>
                      <span className="ml-auto flex items-center gap-1.5 shrink-0">
                        {t.needsNetwork && <Wifi size={12} className="text-netbanner-text" aria-label="needs network" />}
                        {t.needsModel && <Cpu size={12} className="text-info" aria-label="downloads model" />}
                        <span className="text-[11px] text-ink-dim">{t.category}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
