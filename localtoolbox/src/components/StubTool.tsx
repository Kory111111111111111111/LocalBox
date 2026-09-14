import ToolLayout from "./ToolLayout";
import { useTool } from "./ToolContext";
import { Hammer, ArrowLeft } from "lucide-react";
import { CATEGORY_BY_ID } from "../lib/registry";

/** Friendly placeholder for tools whose implementation pack hasn't shipped yet. */
export default function StubTool() {
  const def = useTool();
  const cat = CATEGORY_BY_ID.get(def.category);
  return (
    <ToolLayout hideRelated>
      <div className="card border-dashed p-8 text-center flex flex-col items-center gap-3">
        <span className="flex items-center justify-center w-11 h-11 rounded-full bg-accent-muted text-accent">
          <Hammer size={20} />
        </span>
        <h2 className="text-base font-semibold">In active development</h2>
        <p className="text-sm text-ink-muted max-w-md leading-relaxed">
          {def.name} is part of the LocalToolBox roadmap and its workspace is being built now. This
          page is live so the catalog stays complete — the finished tool will run right here, fully
          in your browser, with no upload and no account.
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {(def.tags ?? []).slice(0, 5).map((t) => (
            <span key={t} className="chip">#{t}</span>
          ))}
        </div>
        <a href={`/category/${def.category}`} className="btn-ghost mt-1">
          <ArrowLeft size={13} />
          Browse {cat?.name ?? "the category"}
        </a>
      </div>
    </ToolLayout>
  );
}
