import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

export type Faq = { q: string; a: string };

export default function FaqAccordion({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const baseId = useId();

  return (
    <div className="divide-y divide-border-subtle rounded-tool border border-border overflow-hidden">
      {items.map((f, i) => {
        const isOpen = Boolean(open[i]);
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-btn-${i}`;
        return (
          <div key={i} className="bg-surface">
            <button
              type="button"
              id={buttonId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen((prev) => ({ ...prev, [i]: !prev[i] }))}
              className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-left cursor-pointer hover:bg-surface-2 transition-colors"
            >
              <ChevronDown
                size={14}
                className={`text-ink-dim shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
              {f.q}
            </button>
            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="px-4 pb-3.5 pl-10 text-[13px] text-ink-muted leading-relaxed"
              >
                {f.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
