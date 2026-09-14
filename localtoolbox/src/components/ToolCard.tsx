import { Wifi, Cpu, ArrowRight } from "lucide-react";
import type { ToolDef } from "../lib/registry";
import { CATEGORY_META, iconFor } from "../lib/icons";

export default function ToolCard({ tool, compact = false }: { tool: ToolDef; compact?: boolean }) {
  const Icon = iconFor(tool.icon, tool.category);
  const dot = CATEGORY_META[tool.category]?.dot;
  return (
    <a
      href={`/tools/${tool.slug}`}
      className="card p-3.5 flex flex-col gap-1.5 hover:border-ink-dim hover:bg-surface-2 transition-colors group"
    >
      <div className="flex items-center gap-2">
        <span
          className="flex items-center justify-center w-7 h-7 rounded-tool-sm bg-surface-3 border border-border-subtle shrink-0"
          style={{ color: dot }}
        >
          <Icon size={15} />
        </span>
        <span className="text-sm font-medium leading-tight">{tool.name}</span>
        <ArrowRight
          size={13}
          className="ml-auto text-ink-dim opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        />
      </div>
      {!compact && (
        <>
          <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">{tool.description}</p>
          {(tool.needsNetwork || tool.needsModel) && (
            <div className="flex gap-1.5 mt-0.5">
              {tool.needsNetwork && (
                <span className="chip !text-netbanner-text !border-netbanner-border">
                  <Wifi size={10} /> network
                </span>
              )}
              {tool.needsModel && (
                <span className="chip !text-info !border-info/30">
                  <Cpu size={10} /> local model
                </span>
              )}
            </div>
          )}
        </>
      )}
    </a>
  );
}
