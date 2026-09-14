import { Suspense, lazy } from "react";
import { TOOL_BY_SLUG } from "../lib/registry";
import { ToolDefContext } from "../components/ToolContext";
import { usePageTitle } from "../lib/usePageTitle";
import NotFound from "./NotFound";

function ToolSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse" aria-busy="true" aria-label="Loading tool">
      <div className="h-3 w-40 rounded bg-surface-2 mb-4" />
      <div className="h-8 w-72 rounded bg-surface-2 mb-2" />
      <div className="h-4 w-96 rounded bg-surface-2 mb-8" />
      <div className="h-64 rounded-tool bg-surface-2" />
    </div>
  );
}

export default function ToolPage({ params }: { params: { slug: string } }) {
  const def = TOOL_BY_SLUG.get(params.slug);
  usePageTitle(def ? `${def.name} — LocalToolBox` : "Page not found — LocalToolBox");

  if (!def) return <NotFound />;

  const Component = lazy(def.component);

  return (
    <ToolDefContext.Provider value={def}>
      <Suspense fallback={<ToolSkeleton />}>
        <Component />
      </Suspense>
    </ToolDefContext.Provider>
  );
}
