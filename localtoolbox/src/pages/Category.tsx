import { useMemo, useState } from "react";
import { Link } from "wouter";
import { CATEGORIES, CATEGORY_BY_ID, toolsIn } from "../lib/registry";
import ToolCard from "../components/ToolCard";

export default function Category({ params }: { params: { id: string } }) {
  const cat = CATEGORY_BY_ID.get(params.id);
  const [q, setQ] = useState("");

  const tools = useMemo(() => {
    if (!cat) return [];
    const list = toolsIn(cat.id);
    const query = q.trim().toLowerCase();
    if (!query) return list;
    return list.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some((g) => g.includes(query)),
    );
  }, [cat, q]);

  if (!cat) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <h1 className="text-xl font-semibold mb-2">Category not found</h1>
        <p className="text-sm text-ink-muted mb-4">
          That category doesn't exist. Pick one of the {CATEGORIES.length} categories instead.
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link key={c.id} href={`/category/${c.id}`} className="chip hover:text-ink">{c.name}</Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-6">
        <nav aria-label="Breadcrumb" className="text-xs text-ink-dim mb-2">
          <Link href="/" className="hover:text-ink-muted">Home</Link> / <span className="text-ink-muted">{cat.name}</span>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight">{cat.name}</h1>
        <p className="text-sm text-ink-muted mt-1">
          {cat.description} — {toolsIn(cat.id).length} tools.
        </p>
      </header>

      <input
        className="input max-w-sm mb-5"
        placeholder={`Search in ${cat.name}…`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label={`Search ${cat.name}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {tools.map((t) => (
          <ToolCard key={t.slug} tool={t} />
        ))}
      </div>
      {tools.length === 0 && (
        <p className="text-sm text-ink-dim py-6">No tools in this category match “{q}”.</p>
      )}
    </div>
  );
}
