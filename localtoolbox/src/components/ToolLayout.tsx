import type { ReactNode } from "react";
import { CATEGORY_BY_ID, relatedTools, type ToolDef } from "../lib/registry";
import { useTool } from "./ToolContext";
import PrivacyCallout from "./PrivacyCallout";
import { NetworkBanner, ModelBanner } from "./NetworkBanner";
import ToolCard from "./ToolCard";

/** Category-aware default steps. Tools pass their own howTo for specifics. */
function defaultHowTo(def: ToolDef): string[] {
  if (def.needsNetwork) {
    return [
      "Type the domain, IP, or URL you want to look up.",
      "Run the lookup and wait a moment for the response.",
      "Review the results shown below the form.",
      "Only the lookup you asked for is sent over the network — nothing else about you or your files.",
    ];
  }
  const fileish = ["pdf", "image", "video", "file"].includes(def.category);
  if (fileish) {
    return [
      "Add your file or files — drag and drop, or click the drop zone to pick them.",
      "Adjust the options for the output you want.",
      "Run the tool and wait for processing to finish.",
      "Preview the result, then download it. Multi-file outputs arrive as a ZIP.",
    ];
  }
  return [
    "Enter or paste your input into the workspace.",
    "Adjust the options to match what you need.",
    "The result is computed instantly in your browser.",
    "Copy it to your clipboard or download it as a file.",
  ];
}

export default function ToolLayout({
  children,
  howTo,
  hideRelated = false,
}: {
  children: ReactNode;
  howTo?: string[];
  hideRelated?: boolean;
}) {
  const def = useTool();
  const cat = CATEGORY_BY_ID.get(def.category);
  const related = hideRelated ? [] : relatedTools(def);

  return (
    <article className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-ink-dim mb-3 flex gap-1.5 flex-wrap">
        <a href="/" className="hover:text-ink-muted transition-colors">Home</a>
        <span aria-hidden>/</span>
        <a href={`/category/${def.category}`} className="hover:text-ink-muted transition-colors">
          {cat?.name ?? def.category}
        </a>
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

      {/* Workspace */}
      <section aria-label="Workspace" className="flex flex-col gap-4">
        {children}
      </section>

      {/* How to use */}
      <section className="mt-10" aria-label="How to use">
        <h2 className="section-title">How to use</h2>
        <ol className="card p-4 space-y-2.5">
          {(howTo ?? defaultHowTo(def)).map((s, i) => (
            <li key={i} className="flex gap-3 text-sm text-ink-muted">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent-muted text-accent text-[11px] font-semibold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Related tools */}
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

      {/* Privacy callout */}
      <div className="mt-8">
        <PrivacyCallout />
      </div>
    </article>
  );
}
