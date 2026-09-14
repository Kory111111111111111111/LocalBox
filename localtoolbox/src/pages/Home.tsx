import { useMemo } from "react";
import { Link } from "wouter";
import { CATEGORIES, TOOLS, toolsIn, type ToolDef } from "../lib/registry";
import { CATEGORY_META, iconFor } from "../lib/icons";
import ToolCard from "../components/ToolCard";
import PrivacyCallout from "../components/PrivacyCallout";
import { ArrowRight } from "lucide-react";

function starters(categoryId: string, limit = 3): ToolDef[] {
  const list = toolsIn(categoryId);
  const featured = list.filter((t) => t.featured);
  const rest = list.filter((t) => !t.featured);
  return [...featured, ...rest].slice(0, limit);
}

export default function Home() {
  const popular = useMemo(() => TOOLS.filter((t) => t.featured).slice(0, 8), []);

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-6">
        <p className="text-xs font-medium text-ink-dim uppercase tracking-wider mb-1.5">Homebase</p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Pick a bay. Stay on this machine.
        </h1>
        <p className="text-sm text-ink-muted mt-2 max-w-2xl leading-relaxed">
          {TOOLS.length} tools in {CATEGORIES.length} bays.
        </p>
      </header>

      <div className="mb-8">
        <PrivacyCallout />
      </div>

      <section className="mb-10" aria-label="Tool bays">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2 className="section-title !mb-0">Bays</h2>
          <span className="text-[11px] text-ink-dim">{CATEGORIES.length} categories</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORIES.map((c) => {
            const Icon = iconFor(c.icon, c.id);
            const count = toolsIn(c.id).length;
            const picks = starters(c.id);
            const dot = CATEGORY_META[c.id]?.dot;
            return (
              <article key={c.id} className="card p-4 flex flex-col gap-3 hover:border-ink-dim transition-colors">
                <Link href={`/category/${c.id}`} className="flex items-start gap-3 group">
                  <span
                    className="flex items-center justify-center w-9 h-9 rounded-tool-sm bg-surface-3 border border-border-subtle shrink-0"
                    style={{ color: dot }}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold tracking-tight">{c.name}</span>
                      <ArrowRight
                        size={13}
                        className="text-ink-dim opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </span>
                    <span className="block text-[12px] text-ink-muted mt-0.5 leading-snug">
                      {c.description}
                    </span>
                  </span>
                  <span className="text-[11px] text-ink-dim tabular-nums shrink-0 mt-0.5">
                    {count}
                  </span>
                </Link>
                <ul className="flex flex-col gap-0.5 border-t border-border-subtle pt-2">
                  {picks.map((t) => (
                    <li key={t.slug}>
                      <Link
                        href={`/tools/${t.slug}`}
                        className="flex items-center gap-2 rounded-tool-sm px-1.5 py-1 text-[13px] text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
                      >
                        <span className="w-1 h-1 rounded-full bg-ink-dim shrink-0" aria-hidden />
                        {t.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-label="Popular tools">
        <h2 className="section-title">Grab these first</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {popular.map((t) => (
            <ToolCard key={t.slug} tool={t} compact />
          ))}
        </div>
      </section>
    </div>
  );
}
