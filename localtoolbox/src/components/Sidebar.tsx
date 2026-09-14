import { CATEGORIES, toolsIn } from "../lib/registry";
import { CATEGORY_META, iconFor } from "../lib/icons";
import { useLocation } from "wouter";

export default function Sidebar() {
  const [location] = useLocation();
  return (
    <nav className="py-4 text-sm" aria-label="Categories">
      <div className="section-title !mb-2 px-2">Categories</div>
      <ul>
        {CATEGORIES.map((c) => {
          const Icon = iconFor(c.icon, c.id);
          const active = location === `/category/${c.id}`;
          return (
            <li key={c.id}>
              <a
                href={`/category/${c.id}`}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-tool-sm transition-colors ${
                  active
                    ? "bg-accent-muted text-ink"
                    : "text-ink-muted hover:text-ink hover:bg-surface-2"
                }`}
              >
                <Icon size={15} style={{ color: CATEGORY_META[c.id]?.dot }} className="shrink-0" />
                <span className="truncate">{c.name}</span>
                <span className="ml-auto text-[11px] text-ink-dim tabular-nums">
                  {toolsIn(c.id).length}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
