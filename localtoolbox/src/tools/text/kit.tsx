// Shared kit for text-category tools: a transform-tool factory plus text analysis helpers.
import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import ToolLayout from "../../components/ToolLayout";
import EditorPane from "../../components/EditorPane";
import { OptionsBar } from "../../components/ui";

export type TransformConfig<S extends object> = {
  init: S;
  controls?: (state: S, set: (patch: Partial<S>) => void) => ReactNode;
  run: (input: string, state: S) => string;
  sample?: string;
  sampleLabel?: string;
  filename?: string;
  mime?: string;
  placeholder?: string;
};

/** Build a complete ToolLayout tool from an options-state + pure transform. */
export function transformTool<S extends object>(cfg: TransformConfig<S>): ComponentType {
  return function TransformTool() {
    const [input, setInput] = useState("");
    const [state, setState] = useState<S>(cfg.init);
    const set = (patch: Partial<S>) => setState((s) => ({ ...s, ...patch }));

    const { output, error } = useMemo(() => {
      if (!input) return { output: "", error: null as string | null };
      try {
        return { output: cfg.run(input, state), error: null as string | null };
      } catch (e) {
        return { output: "", error: e instanceof Error ? e.message : String(e) };
      }
    }, [input, state]);

    return (
      <ToolLayout>
        <EditorPane
          value={input}
          onChange={setInput}
          output={output}
          error={error}
          sample={cfg.sample}
          sampleLabel={cfg.sampleLabel}
          filename={cfg.filename}
          mime={cfg.mime}
          placeholder={cfg.placeholder}
          options={
            cfg.controls ? <OptionsBar>{cfg.controls(state, set)}</OptionsBar> : undefined
          }
        />
      </ToolLayout>
    );
  };
}

// ─── Text analysis helpers (shared by 5+ stats tools) ───

export function countWords(text: string): number {
  const m = text.trim().match(/[^\s]+/g);
  return m ? m.length : 0;
}

export function countSentences(text: string): number {
  const m = text.match(/[^.!?…]+[.!?…]+(\s|$)/g);
  return m ? m.length : text.trim() ? 1 : 0;
}

export function countParagraphs(text: string): number {
  return text.split(/\n\s*\n+/).filter((p) => p.trim()).length;
}

export function syllablesIn(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const s = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "");
  const m = s.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

export function fleschScore(text: string): number | null {
  const words = text.trim().match(/[^\s]+/g) ?? [];
  const sentences = Math.max(1, countSentences(text));
  if (words.length < 5) return null;
  const syl = words.reduce((a, w) => a + syllablesIn(w), 0);
  const score = 206.835 - 1.015 * (words.length / sentences) - 84.6 * (syl / words.length);
  return Math.max(0, Math.min(100, score));
}

export function fleschLabel(score: number): string {
  if (score >= 90) return "Very easy (5th grade)";
  if (score >= 80) return "Easy (6th grade)";
  if (score >= 70) return "Fairly easy (7th grade)";
  if (score >= 60) return "Plain English (8–9th grade)";
  if (score >= 50) return "Fairly difficult (10–12th grade)";
  if (score >= 30) return "Difficult (college)";
  return "Very difficult (graduate)";
}

export function readingTime(words: number): string {
  // ~225 wpm silent reading
  const mins = words / 225;
  if (words === 0) return "0 sec";
  if (mins < 1) return `${Math.max(1, Math.round(mins * 60))} sec`;
  if (mins < 60) return `${Math.round(mins)} min`;
  return `${Math.floor(mins / 60)} hr ${Math.round(mins % 60)} min`;
}

export function speakingTime(words: number): string {
  // ~130 wpm speaking
  const mins = words / 130;
  if (words === 0) return "0 sec";
  if (mins < 1) return `${Math.max(1, Math.round(mins * 60))} sec`;
  if (mins < 60) return `${Math.round(mins)} min`;
  return `${Math.floor(mins / 60)} hr ${Math.round(mins % 60)} min`;
}

export function wordFrequency(text: string, caseInsensitive = true): Map<string, number> {
  const map = new Map<string, number>();
  const words = (caseInsensitive ? text.toLowerCase() : text).match(/[\p{L}\p{N}''-]+/gu) ?? [];
  for (const w of words) map.set(w, (map.get(w) ?? 0) + 1);
  return map;
}

export function charDistribution(text: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const ch of text) map.set(ch, (map.get(ch) ?? 0) + 1);
  return map;
}
