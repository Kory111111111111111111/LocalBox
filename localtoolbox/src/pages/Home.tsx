import { useMemo, useState } from "react";
import { CATEGORIES, TOOLS, toolsIn } from "../lib/registry";
import { CATEGORY_META, iconFor } from "../lib/icons";
import ToolCard from "../components/ToolCard";
import SearchBox from "../components/SearchBox";
import { ShieldCheck, WifiOff, Sparkles } from "lucide-react";

export default function Home() {
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogCat, setCatalogCat] = useState("all");

  const featured = useMemo(() => TOOLS.filter((t) => t.featured).slice(0, 12), []);

  const catalog = useMemo(() => {
    let list = catalogCat === "all" ? TOOLS : toolsIn(catalogCat);
    const q = catalogQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((g) => g.includes(q)),
      );
    }
    return list;
  }, [catalogQuery, catalogCat]);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <section className="pt-8 pb-10 text-center flex flex-col items-center gap-4">
        <span className="chip !py-1 !px-3">
          <ShieldCheck size={12} className="text-success" />
          Files stay on your device
        </span>
        <h1 className="text-3xl sm:text-[42px] font-semibold tracking-tight leading-[1.15] max-w-2xl">
          Local tools. Your device.
          <span className="block text-ink-muted">No account, no uploads.</span>
        </h1>
        <p className="text-sm sm:text-base text-ink-muted max-w-xl leading-relaxed">
          {TOOLS.length} browser-native utilities across {CATEGORIES.length} categories — PDF, images,
          video, text, code, math and more. Everything runs on your machine.
        </p>
        <div className="w-full max-w-xl">
          <SearchBox autoFocusOnSlash={false} />
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-xs text-ink-dim">
          <span className="chip"><WifiOff size={11} /> Works offline</span>
          <span className="chip"><Sparkles size={11} /> Open source (MIT)</span>
          <span className="chip">No watermarks · No ads</span>
        </div>
      </section>

      {/* Featured */}
      <section className="mb-10" aria-label="Popular tools">
        <h2 className="section-title">Popular right now</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {featured.map((t) => (
            <ToolCard key={t.slug} tool={t} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mb-10" aria-label="Categories">
        <h2 className="section-title">Browse by category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {CATEGORIES.map((c) => {
            const Icon = iconFor(c.icon, c.id);
            return (
              <a
                key={c.id}
                href={`/category/${c.id}`}
                className="card p-4 flex flex-col gap-2 hover:border-ink-dim hover:bg-surface-2 transition-colors"
              >
                <Icon size={18} style={{ color: CATEGORY_META[c.id]?.dot }} />
                <div className="text-sm font-medium leading-tight">{c.name}</div>
                <div className="text-[11px] text-ink-dim">{toolsIn(c.id).length} tools</div>
              </a>
            );
          })}
        </div>
      </section>

      {/* Full catalog */}
      <section aria-label="All tools">
        <h2 className="section-title">Full catalog</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            className="input max-w-xs"
            placeholder={`Filter ${TOOLS.length} tools…`}
            value={catalogQuery}
            onChange={(e) => setCatalogQuery(e.target.value)}
            aria-label="Filter tools"
          />
          <select
            className="select max-w-[200px]"
            value={catalogCat}
            onChange={(e) => setCatalogCat(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <span className="text-xs text-ink-dim self-center ml-1">
            {catalog.length} {catalog.length === 1 ? "tool" : "tools"}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {catalog.map((t) => (
            <ToolCard key={t.slug} tool={t} />
          ))}
        </div>
        {catalog.length === 0 && (
          <p className="text-sm text-ink-dim py-6 text-center">
            Nothing matches that filter — try a different word or category.
          </p>
        )}
      </section>
    </div>
  );
}
