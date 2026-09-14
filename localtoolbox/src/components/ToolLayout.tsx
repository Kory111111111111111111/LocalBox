import type { ReactNode } from "react";
import { Link } from "wouter";
import { CATEGORY_BY_ID, relatedTools } from "../lib/registry";
import { useTool } from "./ToolContext";
import { NetworkBanner, ModelBanner } from "./NetworkBanner";
import ToolCard from "./ToolCard";

export default function ToolLayout({
  children,
  hideRelated = false,
}: {
  children: ReactNode;
  hideRelated?: boolean;
}) {
  const def = useTool();
  const cat = CATEGORY_BY_ID.get(def.category);
  const related = hideRelated ? [] : relatedTools(def);

  return (
    <article className="max-w-4xl mx-auto">
      <nav aria-label="Breadcrumb" className="text-xs text-ink-dim mb-3 flex gap-1.5 flex-wrap">
        <Link href="/" className="hover:text-ink-muted transition-colors">Home</Link>
        <span aria-hidden>/</span>
        <Link href={`/category/${def.category}`} className="hover:text-ink-muted transition-colors">
          {cat?.name ?? def.category}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-ink-muted">{def.name}</span>
      </nav>

      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">{def.name}</h1>
        <p className="text-sm text-ink-muted mt-1">{def.description}.</p>
      </header>

      <div className="flex flex-col gap-3 mb-6">
        {def.needsNetwork && <NetworkBanner />}
        {def.needsModel && <ModelBanner note={def.modelNote ?? undefined} />}
      </div>

      <section aria-label="Workspace" className="flex flex-col gap-4">
        {children}
      </section>

      {related.length > 0 && (
        <section className="mt-8" aria-label="Related tools">
          <h2 className="section-title">Related tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {related.map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
