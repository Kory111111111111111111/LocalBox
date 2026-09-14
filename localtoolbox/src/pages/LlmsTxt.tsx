import { useMemo } from "react";
import { buildLlmsMarkdown } from "../lib/llmsMarkdown";
import { assetUrl } from "../lib/paths";
import { usePageTitle } from "../lib/usePageTitle";

export default function LlmsTxt() {
  const markdown = useMemo(() => buildLlmsMarkdown(), []);
  usePageTitle("llms.txt — LocalToolBox");

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-6">
        <p className="text-xs font-medium text-ink-dim uppercase tracking-wider mb-1.5">
          For language models
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">llms.txt</h1>
        <p className="text-sm text-ink-muted mt-2 leading-relaxed">
          Machine-readable catalog of every tool on this site. Crawlers should fetch the raw file
          at{" "}
          <a href={assetUrl("llms.txt")} className="link">
            /llms.txt
          </a>
          .
        </p>
      </header>
      <pre className="card p-4 sm:p-5 text-[13px] leading-relaxed text-ink-muted overflow-x-auto whitespace-pre-wrap font-mono">
        {markdown}
      </pre>
    </div>
  );
}
