// Analysis-oriented text tools: word count, statistics, frequency, unicode inspector,
// palindrome, diff, markdown preview.
import { useMemo, useState, type ComponentType } from "react";
import ToolLayout from "../../components/ToolLayout";
import EditorPane from "../../components/EditorPane";
import { NumField, OptionsBar, OutputArea, SelField, StatGrid, Toggle } from "../../components/ui";
import {
  charDistribution,
  countParagraphs,
  countSentences,
  countWords,
  fleschLabel,
  fleschScore,
  readingTime,
  speakingTime,
  syllablesIn,
  wordFrequency,
} from "./kit";
import { diffLines } from "../../lib/diff";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { CopyButton } from "../../components/ui";

const LOREM =
  "LocalToolBox keeps every file on your machine. Paste any text here to count words, measure reading time, and check readability. Everything is computed in your browser — nothing is uploaded, ever.";

export const WordCountTool: ComponentType = () => {
  const [text, setText] = useState("");
  const s = useMemo(() => {
    const words = countWords(text);
    return {
      words,
      chars: text.length,
      charsNoSpace: text.replace(/\s/g, "").length,
      sentences: countSentences(text),
      paragraphs: countParagraphs(text),
      lines: text ? text.split("\n").length : 0,
      reading: readingTime(words),
      speaking: speakingTime(words),
    };
  }, [text]);

  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} sample={LOREM} inputLabel="Your text" outputLabel="Counts" rows={6}
        outputNode={
          <StatGrid
            items={[
              { label: "Words", value: s.words.toLocaleString(), strong: true },
              { label: "Characters", value: s.chars.toLocaleString() },
              { label: "No spaces", value: s.charsNoSpace.toLocaleString() },
              { label: "Sentences", value: s.sentences.toLocaleString() },
              { label: "Paragraphs", value: s.paragraphs.toLocaleString() },
              { label: "Lines", value: s.lines.toLocaleString() },
              { label: "Reading time", value: s.reading },
              { label: "Speaking time", value: s.speaking },
              { label: "Avg word length", value: s.words ? (s.charsNoSpace / s.words).toFixed(1) : "—" },
            ]}
          />
        }
      />
    </ToolLayout>
  );
};

export const TextStatsTool: ComponentType = () => {
  const [text, setText] = useState("");
  const s = useMemo(() => {
    const words = countWords(text);
    const wordList = text.match(/[\p{L}\p{N}''-]+/gu) ?? [];
    const unique = new Set(wordList.map((w) => w.toLowerCase())).size;
    const flesch = fleschScore(text);
    return {
      words,
      unique,
      flesch,
      reading: readingTime(words),
      longest: wordList.reduce((a, w) => (w.length > a.length ? w : a), ""),
    };
  }, [text]);

  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} sample={LOREM} rows={6}
        outputNode={
          <StatGrid
            items={[
              { label: "Words", value: s.words.toLocaleString(), strong: true },
              { label: "Unique words", value: s.unique.toLocaleString() },
              { label: "Longest word", value: s.longest || "—" },
              { label: "Reading time", value: s.reading },
              { label: "Flesch score", value: s.flesch === null ? "—" : s.flesch.toFixed(1) },
              { label: "Readability", value: s.flesch === null ? "—" : fleschLabel(s.flesch) },
            ]}
          />
        }
      />
    </ToolLayout>
  );
};

export const StringAnalyzerTool: ComponentType = () => {
  const [text, setText] = useState("");
  const s = useMemo(() => {
    const words = text.match(/[\p{L}\p{N}''-]+/gu) ?? [];
    const lcWords = words.map((w) => w.toLowerCase());
    const unique = new Set(lcWords);
    const syl = lcWords.reduce((a, w) => a + syllablesIn(w), 0);
    const sentences = countSentences(text);
    const avgSentence = sentences ? (words.length / sentences).toFixed(1) : "—";
    const avgWord = words.length ? (words.join("").length / words.length).toFixed(1) : "—";
    const flesch = fleschScore(text);
    const letters = (text.match(/[a-zA-Z]/g) ?? []).length;
    const digits = (text.match(/\d/g) ?? []).length;
    const spaces = (text.match(/ /g) ?? []).length;
    const punct = (text.match(/[.,!?;:'"(){}[\]-]/g) ?? []).length;
    return {
      words: words.length, chars: [...text].length, noSpace: text.replace(/\s/g, "").length,
      sentences, paragraphs: countParagraphs(text), lines: text ? text.split("\n").length : 0,
      unique: unique.size, avgSentence, avgWord, syl,
      complexWords: lcWords.filter((w) => syllablesIn(w) >= 3).length,
      reading: readingTime(words.length), speaking: speakingTime(words.length),
      flesch, letters, digits, spaces, punct,
    };
  }, [text]);

  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} sample={LOREM} rows={7}
        outputNode={
          <div className="flex flex-col gap-3">
            <StatGrid
              items={[
                { label: "Characters", value: s.chars.toLocaleString() },
                { label: "Characters (no spaces)", value: s.noSpace.toLocaleString() },
                { label: "Words", value: s.words.toLocaleString(), strong: true },
                { label: "Unique words", value: s.unique.toLocaleString() },
                { label: "Sentences", value: s.sentences.toLocaleString() },
                { label: "Paragraphs", value: s.paragraphs.toLocaleString() },
                { label: "Lines", value: s.lines.toLocaleString() },
                { label: "Syllables (est.)", value: s.syl.toLocaleString() },
                { label: "Complex words", value: s.complexWords.toLocaleString() },
                { label: "Avg word length", value: s.avgWord },
                { label: "Avg sentence length", value: s.avgSentence },
                { label: "Reading time", value: s.reading },
                { label: "Speaking time", value: s.speaking },
                { label: "Flesch score", value: s.flesch === null ? "—" : s.flesch.toFixed(1) },
                { label: "Readability", value: s.flesch === null ? "—" : fleschLabel(s.flesch) },
              ]}
            />
            <div className="card p-3">
              <div className="label">Character mix</div>
              <div className="text-[13px] text-ink-muted font-mono">
                letters {s.letters} · digits {s.digits} · spaces {s.spaces} · punctuation {s.punct} ·
                other {Math.max(0, s.chars - s.letters - s.digits - s.spaces - s.punct)}
              </div>
            </div>
          </div>
        }
      />
    </ToolLayout>
  );
};

export const TextStatisticsTool: ComponentType = () => {
  const [text, setText] = useState("");
  const [tab, setTab] = useState<"words" | "chars">("words");
  const [topN, setTopN] = useState(15);

  const freq = useMemo(() => [...wordFrequency(text).entries()].sort((a, b) => b[1] - a[1]), [text]);
  const chars = useMemo(() => [...charDistribution(text).entries()].sort((a, b) => b[1] - a[1]), [text]);
  const totalWords = freq.reduce((a, [, n]) => a + n, 0);
  const flesch = fleschScore(text);

  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} sample={LOREM} rows={6}
        options={
          <OptionsBar>
            <SelField label="Table" value={tab} onChange={setTab}
              options={[{ value: "words", label: "Word frequency" }, { value: "chars", label: "Character distribution" }]} />
            <NumField label="Show top" value={topN} min={5} max={100} onChange={(v) => setTopN(Math.min(100, Math.max(5, v || 15)))} />
            <div className="ml-auto text-xs text-ink-dim self-center">
              {totalWords.toLocaleString()} words · {flesch === null ? "—" : `Flesch ${flesch.toFixed(0)} (${fleschLabel(flesch)})`}
            </div>
          </OptionsBar>
        }
        outputNode={
          <div className="card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-ink-dim border-b border-border">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">{tab === "words" ? "Word" : "Character"}</th>
                  <th className="px-3 py-2 text-right">Count</th>
                  <th className="px-3 py-2 text-right">Share</th>
                  <th className="px-3 py-2 w-1/3">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {(tab === "words" ? freq : chars).slice(0, topN).map(([item, n], i) => {
                  const total = tab === "words" ? totalWords || 1 : text.length || 1;
                  return (
                    <tr key={item + i} className="hover:bg-surface-2">
                      <td className="px-3 py-1.5 text-ink-dim tabular-nums">{i + 1}</td>
                      <td className="px-3 py-1.5 font-mono break-all">
                        {item === " " ? "␣ (space)" : item === "\n" ? "⏎ (newline)" : item}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{n.toLocaleString()}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-ink-muted">
                        {((n / total) * 100).toFixed(1)}%
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="h-1.5 rounded bg-surface-3 overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${(n / (tab === "words" ? freq[0][1] : chars[0][1])) * 100}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(tab === "words" ? freq : chars).length === 0 && (
              <div className="px-3 py-6 text-sm text-ink-dim text-center">Paste text to see the analysis.</div>
            )}
          </div>
        }
      />
    </ToolLayout>
  );
};

export const WordFrequencyTool: ComponentType = () => {
  const [text, setText] = useState("");
  const [topN, setTopN] = useState(20);
  const [minLen, setMinLen] = useState(3);
  const [hideStop, setHideStop] = useState(false);

  const STOP = new Set(
    "the a an and or but if then else of to in on at for with by from as is are was were be been being it its this that these those i you he she we they them his her their our your my me us not no so do does did have has had will would can could should may might must about into over after under between".split(" "),
  );

  const rows = useMemo(() => {
    let entries = [...wordFrequency(text).entries()];
    if (hideStop) entries = entries.filter(([w]) => !STOP.has(w));
    if (minLen > 1) entries = entries.filter(([w]) => w.length >= minLen);
    return entries.sort((a, b) => b[1] - a[1]).slice(0, topN);
  }, [text, topN, minLen, hideStop]);

  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} sample={LOREM} rows={6}
        options={
          <OptionsBar>
            <NumField label="Top N words" value={topN} min={5} max={500} onChange={(v) => setTopN(v || 20)} />
            <NumField label="Min word length" value={minLen} min={1} max={20} onChange={(v) => setMinLen(v || 1)} />
            <Toggle label="Hide common stop-words" checked={hideStop} onChange={setHideStop} />
          </OptionsBar>
        }
        outputNode={
          <div className="flex flex-wrap gap-1.5">
            {rows.map(([w, n]) => (
              <span key={w} className="chip !text-xs hover:!text-ink" title={`${n} occurrences`}>
                {w} <strong className="text-accent">{n}</strong>
              </span>
            ))}
            {rows.length === 0 && <span className="text-sm text-ink-dim">Paste text to see word frequencies.</span>}
          </div>
        }
      />
    </ToolLayout>
  );
};

export const UnicodeInspectorTool: ComponentType = () => {
  const [text, setText] = useState("");
  const rows = useMemo(() => {
    const out: { ch: string; cp: number; hex: string; utf8: string; cat: string }[] = [];
    const count = Math.min(text.length, 2000);
    for (let i = 0; i < count; i++) {
      const ch = text[i];
      const cp = ch.codePointAt(0)!;
      let utf8 = "";
      try {
        utf8 = [...new TextEncoder().encode(ch)].map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(" ");
      } catch { utf8 = "?"; }
      const cat =
        /\s/.test(ch) ? "Space/Separator" :
        /[\p{Lu}\p{Ll}\p{Lt}\p{Lm}\p{Lo}]/u.test(ch) ? "Letter" :
        /[\p{Nd}\p{Nl}\p{No}]/u.test(ch) ? "Number" :
        /[\p{P}]/u.test(ch) ? "Punctuation" :
        /[\p{S}]/u.test(ch) ? "Symbol" :
        /[\p{M}]/u.test(ch) ? "Mark" : "Other";
      out.push({ ch: ch === " " ? "␣" : ch === "\n" ? "⏎" : ch, cp, hex: "U+" + cp.toString(16).toUpperCase().padStart(4, "0"), utf8, cat });
    }
    return out;
  }, [text]);

  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} sample="Héllo 世界 🌍🚀" rows={4}
        outputNode={
          <div className="card overflow-auto max-h-96">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-surface">
                <tr className="text-left text-[11px] uppercase tracking-wide text-ink-dim border-b border-border">
                  <th className="px-3 py-2">Char</th>
                  <th className="px-3 py-2">Decimal</th>
                  <th className="px-3 py-2">Code point</th>
                  <th className="px-3 py-2">UTF-8 bytes</th>
                  <th className="px-3 py-2">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-surface-2">
                    <td className="px-3 py-1.5 font-mono text-base">{r.ch}</td>
                    <td className="px-3 py-1.5 tabular-nums">{r.cp}</td>
                    <td className="px-3 py-1.5 font-mono text-accent">{r.hex}</td>
                    <td className="px-3 py-1.5 font-mono text-ink-muted">{r.utf8}</td>
                    <td className="px-3 py-1.5 text-ink-muted">{r.cat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <div className="px-3 py-6 text-sm text-ink-dim text-center">Type or paste characters to inspect them (first 2,000 shown).</div>}
          </div>
        }
      />
    </ToolLayout>
  );
};

export const PalindromeTool: ComponentType = () => {
  const [text, setText] = useState("");
  const res = useMemo(() => {
    const norm = text.toLowerCase().replace(/[\p{P}\p{S}\s]/gu, "");
    const isPal = norm.length > 0 && norm === [...norm].reverse().join("");
    // longest palindromic substring (expand around center, cap input)
    const s = norm.slice(0, 3000);
    let best = "";
    const expand = (l: number, r: number) => {
      while (l >= 0 && r < s.length && s[l] === s[r]) {
        if (r - l + 1 > best.length) best = s.slice(l, r + 1);
        l--;
        r++;
      }
    };
    for (let i = 0; i < s.length; i++) {
      expand(i, i);
      expand(i, i + 1);
    }
    const palWords = (text.toLowerCase().match(/[\p{L}]+/gu) ?? []).filter((w) => w.length > 1 && w === [...w].reverse().join(""));
    return { isPal, best, palWords: [...new Set(palWords)] };
  }, [text]);

  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} sample="A man, a plan, a canal: Panama" rows={4}
        outputNode={
          <div className="flex flex-col gap-3">
            <StatGrid
              items={[
                { label: "Is palindrome?", value: text.trim() ? (res.isPal ? "Yes ✓" : "No") : "—", strong: true },
                { label: "Longest palindromic run", value: res.best || "—", strong: true },
                { label: "Palindromic words", value: res.palWords.length ? res.palWords.join(", ") : "—" },
              ]}
            />
            <p className="text-xs text-ink-dim leading-relaxed">
              Comparison ignores spaces, punctuation, and letter case. The “longest palindromic run”
              is the longest stretch of letters inside your text that reads the same in both
              directions.
            </p>
          </div>
        }
      />
    </ToolLayout>
  );
};

export const TextDiffTool: ComponentType = () => {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const diff = useMemo(() => (a || b ? diffLines(a, b) : []), [a, b]);
  const added = diff.filter((d) => d.type === "add").length;
  const removed = diff.filter((d) => d.type === "del").length;

  return (
    <ToolLayout>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="label">Original text</span>
          <textarea className="textarea" rows={10} value={a} onChange={(e) => setA(e.target.value)} placeholder="Paste the original…" spellCheck={false} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="label">Changed text</span>
          <textarea className="textarea" rows={10} value={b} onChange={(e) => setB(e.target.value)} placeholder="Paste the new version…" spellCheck={false} />
        </div>
      </div>
      <div className="card overflow-hidden font-mono text-[13px]">
        <div className="flex items-center gap-3 px-3 py-2 border-b border-border text-xs">
          <span className="text-ink-dim">Differences</span>
          <span className="text-success">+{added} added</span>
          <span className="text-danger">−{removed} removed</span>
        </div>
        <div className="max-h-[28rem] overflow-auto">
          {diff.map((d, i) => (
            <div
              key={i}
              className={
                d.type === "add"
                  ? "bg-success/10 text-success px-3 py-0.5 whitespace-pre-wrap"
                  : d.type === "del"
                    ? "bg-danger/10 text-danger px-3 py-0.5 whitespace-pre-wrap line-through decoration-danger/40"
                    : "px-3 py-0.5 text-ink-dim whitespace-pre-wrap"
              }
            >
              {d.type === "add" ? "+ " : d.type === "del" ? "− " : "  "}
              {d.text || " "}
            </div>
          ))}
          {diff.length === 0 && <div className="px-3 py-6 text-sm text-ink-dim text-center">Paste two texts to compare them.</div>}
        </div>
      </div>
    </ToolLayout>
  );
};

export const MarkdownPreviewTool: ComponentType = () => {
  const [text, setText] = useState("");
  const html = useMemo(() => {
    if (!text.trim()) return "";
    try {
      return DOMPurify.sanitize(marked.parse(text, { async: false }) as string);
    } catch (e) {
      return `<p style="color:#ef4444">Parse error: ${String(e)}</p>`;
    }
  }, [text]);
  const raw = html;
  void raw;

  return (
    <ToolLayout>
      <EditorPane
        value={text}
        onChange={setText}
        inputLabel="Markdown"
        outputLabel="Preview"
        sample={"# Welcome to LocalToolBox\n\nThis is **markdown** with *emphasis*, `code`, and a list:\n\n- Fully local\n- No uploads\n- Open source\n\n```js\nconst x = 42;\n```\n\n> Files stay on your device."}
        rows={12}
        outputNode={
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center">
              <span className="ml-auto"><CopyButton text={html} label="Copy HTML" /></span>
            </div>
            <div
              className="card p-4 prose-invert text-sm leading-relaxed max-h-[32rem] overflow-auto [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_a]:text-accent [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-ink-muted [&_code]:bg-surface-3 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-surface-3 [&_pre]:p-3 [&_pre]:rounded [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:w-full [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_hr]:border-border [&_hr]:my-4 [&_img]:max-w-full"
              dangerouslySetInnerHTML={{ __html: html || "<p class='text-ink-dim'>Preview appears here.</p>" }}
            />
          </div>
        }
      />
    </ToolLayout>
  );
};
