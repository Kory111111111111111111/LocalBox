// Pure-transform text tools built on the transformTool factory.
import type { ComponentType } from "react";
import { Field, NumField, SelField, Toggle } from "../../components/ui";
import { transformTool } from "./kit";

// ── helpers ──
const deaccent = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const slugify = (s: string, sep: string) =>
  deaccent(s)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, sep)
    .replace(new RegExp(`^\\${sep}|\\${sep}$`, "g"), "");

const CASE_FNS: Record<string, (s: string) => string> = {
  upper: (s) => s.toUpperCase(),
  lower: (s) => s.toLowerCase(),
  title: (s) => s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()),
  sentence: (s) =>
    s.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase()),
  camel: (s) =>
    deaccent(s)
      .replace(/[^a-zA-Z0-9]+(.)?/g, (_, c: string | undefined) => (c ? c.toUpperCase() : "")),
  pascal: (s) =>
    deaccent(s)
      .replace(/[^a-zA-Z0-9]+(.)?/g, (_, c: string | undefined) => (c ? c.toUpperCase() : ""))
      .replace(/^(.)/, (c) => c.toUpperCase()),
  snake: (s) => slugify(s, "_").replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase() || s.toLowerCase().replace(/\s+/g, "_"),
  kebab: (s) => slugify(s, "-"),
  constant: (s) => slugify(s, "_").toUpperCase() || s.toUpperCase().replace(/\s+/g, "_"),
  alternating: (s) =>
    s
      .split("")
      .map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase()))
      .join(""),
  inverse: (s) =>
    s
      .split("")
      .map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
      .join(""),
};

// ── tool definitions ──
export const TextCaseTool: ComponentType = transformTool({
  init: { mode: "camel" as string },
  controls: (s, set) => (
    <SelField
      label="Convert to"
      value={s.mode}
      onChange={(v) => set({ mode: v })}
      options={[
        { value: "upper", label: "UPPER CASE" },
        { value: "lower", label: "lower case" },
        { value: "title", label: "Title Case" },
        { value: "sentence", label: "Sentence case" },
        { value: "camel", label: "camelCase" },
        { value: "pascal", label: "PascalCase" },
        { value: "snake", label: "snake_case" },
        { value: "kebab", label: "kebab-case" },
        { value: "constant", label: "CONSTANT_CASE" },
        { value: "alternating", label: "aLtErNaTiNg" },
        { value: "inverse", label: "iNVERSE cASE" },
      ]}
    />
  ),
  run: (input, s) => (CASE_FNS[s.mode] ?? ((x: string) => x))(input),
  sample: "the quick brown fox jumps over the lazy dog",
  filename: "converted.txt",
});

export const Rot13Tool: ComponentType = transformTool({
  init: { mode: "rot13" as string },
  controls: (s, set) => (
    <SelField
      label="Cipher"
      value={s.mode}
      onChange={(v) => set({ mode: v })}
      options={[
        { value: "rot13", label: "ROT13 (letters)" },
        { value: "rot47", label: "ROT47 (all ASCII)" },
      ]}
    />
  ),
  run: (input, s) =>
    s.mode === "rot13"
      ? input.replace(/[a-zA-Z]/g, (c) => {
          const base = c <= "Z" ? 65 : 97;
          return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
        })
      : input.replace(/[\x21-\x7e]/g, (c) =>
          String.fromCharCode(((c.charCodeAt(0) - 33 + 47) % 94) + 33),
        ),
  sample: "Hello, LocalToolBox!",
  filename: "rot.txt",
});

export const TextReverseTool: ComponentType = transformTool({
  init: { mode: "chars" as string },
  controls: (s, set) => (
    <SelField
      label="Reverse"
      value={s.mode}
      onChange={(v) => set({ mode: v })}
      options={[
        { value: "chars", label: "Characters" },
        { value: "words", label: "Word order" },
        { value: "lines", label: "Line order" },
      ]}
    />
  ),
  run: (input, s) =>
    s.mode === "chars"
      ? [...input].reverse().join("")
      : s.mode === "words"
        ? input.split(/(\s+)/).reverse().join("")
        : input.split("\n").reverse().join("\n"),
  sample: "reverse this text",
  filename: "reversed.txt",
});

export const TextSorterTool: ComponentType = transformTool({
  init: { by: "alpha" as string, dir: "asc" as string, unique: false, ignoreCase: true },
  controls: (s, set) => (
    <>
      <SelField
        label="Sort by"
        value={s.by}
        onChange={(v) => set({ by: v })}
        options={[
          { value: "alpha", label: "Alphabetical" },
          { value: "length", label: "Line length" },
          { value: "numeric", label: "Numeric value" },
          { value: "shuffle", label: "Shuffle (random)" },
        ]}
      />
      <SelField
        label="Direction"
        value={s.dir}
        onChange={(v) => set({ dir: v })}
        options={[
          { value: "asc", label: "Ascending" },
          { value: "desc", label: "Descending" },
        ]}
      />
      <div>
        <span className="label">Options</span>
        <Toggle label="Remove duplicates" checked={s.unique} onChange={(v) => set({ unique: v })} />
        <Toggle label="Ignore case" checked={s.ignoreCase} onChange={(v) => set({ ignoreCase: v })} />
      </div>
    </>
  ),
  run: (input, s) => {
    let lines = input.split("\n").filter((l) => l.trim() !== "");
    if (s.unique) {
      const seen = new Set<string>();
      lines = lines.filter((l) => {
        const key = s.ignoreCase ? l.toLowerCase() : l;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    const cmp = (a: string, b: string) => {
      const x = s.ignoreCase ? a.toLowerCase() : a;
      const y = s.ignoreCase ? b.toLowerCase() : b;
      if (s.by === "length") return x.length - y.length || x.localeCompare(y);
      if (s.by === "numeric") {
        const nx = parseFloat(x.replace(/[^\d.-]/g, ""));
        const ny = parseFloat(y.replace(/[^\d.-]/g, ""));
        const ax = Number.isFinite(nx) ? nx : Infinity;
        const ay = Number.isFinite(ny) ? ny : Infinity;
        return ax - ay || x.localeCompare(y);
      }
      return x.localeCompare(y, undefined, { numeric: true });
    };
    if (s.by === "shuffle") {
      for (let i = lines.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lines[i], lines[j]] = [lines[j], lines[i]];
      }
    } else {
      lines.sort(cmp);
      if (s.dir === "desc") lines.reverse();
    }
    return lines.join("\n");
  },
  sample: "banana\napple\ncherry\napple\ndate",
  filename: "sorted.txt",
});

export const SortLinesTool: ComponentType = transformTool({
  init: { numeric: false, desc: false },
  controls: (s, set) => (
    <>
      <div>
        <span className="label">Options</span>
        <Toggle label="Numeric sort" checked={s.numeric} onChange={(v) => set({ numeric: v })} />
        <Toggle label="Descending" checked={s.desc} onChange={(v) => set({ desc: v })} />
      </div>
    </>
  ),
  run: (input, s) => {
    const lines = input.split("\n").filter((l) => l.trim() !== "");
    lines.sort((a, b) =>
      s.numeric
        ? parseFloat(a) - parseFloat(b)
        : a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );
    if (s.desc) lines.reverse();
    return lines.join("\n");
  },
  sample: "10\n2\n1\n20\n11",
  filename: "sorted-lines.txt",
});

export const RemoveDuplicatesTool: ComponentType = transformTool({
  init: { keepBlank: true, trim: false, ignoreCase: false },
  controls: (s, set) => (
    <div>
      <span className="label">Options</span>
      <Toggle label="Trim whitespace before comparing" checked={s.trim} onChange={(v) => set({ trim: v })} />
      <Toggle label="Ignore letter case" checked={s.ignoreCase} onChange={(v) => set({ ignoreCase: v })} />
      <Toggle label="Keep blank lines" checked={s.keepBlank} onChange={(v) => set({ keepBlank: v })} />
    </div>
  ),
  run: (input, s) => {
    const seen = new Set<string>();
    return input
      .split("\n")
      .filter((l) => {
        if (!s.keepBlank && l.trim() === "") return false;
        let key = s.trim ? l.trim() : l;
        if (s.ignoreCase) key = key.toLowerCase();
        if (key === "" && s.keepBlank) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .join("\n");
  },
  sample: "first\nsecond\nfirst\nthird\nsecond",
  filename: "unique.txt",
});

export const DuplicateLinesTool: ComponentType = transformTool({
  init: { mode: "remove" as string },
  controls: (s, set) => (
    <SelField
      label="Action"
      value={s.mode}
      onChange={(v) => set({ mode: v })}
      options={[
        { value: "remove", label: "Remove duplicates" },
        { value: "extract", label: "Show only duplicates" },
        { value: "count", label: "Count occurrences" },
      ]}
    />
  ),
  run: (input, s) => {
    const lines = input.split("\n").filter((l) => l !== "");
    const counts = new Map<string, number>();
    for (const l of lines) counts.set(l, (counts.get(l) ?? 0) + 1);
    if (s.mode === "remove") return [...new Set(lines)].join("\n");
    if (s.mode === "extract")
      return [...counts.entries()].filter(([, n]) => n > 1).map(([l]) => l).join("\n") || "(no duplicates found)";
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([l, n]) => `${n}\t${l}`)
      .join("\n");
  },
  sample: "alpha\nbeta\nalpha\ngamma\nbeta\nalpha",
  filename: "duplicates.txt",
});

export const TextCleanerTool: ComponentType = transformTool({
  init: { stripHtml: false, normalizeSpaces: true, removeControls: true, trimLines: false, removeBlank: false },
  controls: (s, set) => (
    <div className="max-w-md">
      <span className="label">Cleaning rules</span>
      <Toggle label="Strip HTML tags" checked={s.stripHtml} onChange={(v) => set({ stripHtml: v })} />
      <Toggle label="Normalize whitespace runs to single spaces" checked={s.normalizeSpaces} onChange={(v) => set({ normalizeSpaces: v })} />
      <Toggle label="Remove control characters" checked={s.removeControls} onChange={(v) => set({ removeControls: v })} />
      <Toggle label="Trim each line" checked={s.trimLines} onChange={(v) => set({ trimLines: v })} />
      <Toggle label="Drop blank lines" checked={s.removeBlank} onChange={(v) => set({ removeBlank: v })} />
    </div>
  ),
  run: (input, s) => {
    let out = input;
    if (s.stripHtml) out = out.replace(/<[^>]*>/g, "");
    if (s.removeControls) out = out.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
    if (s.normalizeSpaces) out = out.replace(/[ \t]+/g, " ");
    let lines = out.split("\n");
    if (s.trimLines) lines = lines.map((l) => l.trim());
    if (s.removeBlank) lines = lines.filter((l) => l !== "");
    return lines.join("\n");
  },
  sample: "  messy   text\t\twith  junk  \n\n   and stray   spaces   ",
  filename: "clean.txt",
});

export const RemoveSpacesTool: ComponentType = transformTool({
  init: { mode: "extra" as string },
  controls: (s, set) => (
    <SelField
      label="What to remove"
      value={s.mode}
      onChange={(v) => set({ mode: v })}
      options={[
        { value: "extra", label: "Extra spaces (collapse runs)" },
        { value: "leading-trailing", label: "Leading & trailing only" },
        { value: "all", label: "All spaces" },
        { value: "line-breaks", label: "Line breaks" },
      ]}
    />
  ),
  run: (input, s) =>
    s.mode === "extra"
      ? input.replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n").trim()
      : s.mode === "leading-trailing"
        ? input
            .split("\n")
            .map((l) => l.trim())
            .join("\n")
        : s.mode === "all"
          ? input.replace(/ /g, "")
          : input.replace(/\s*\n\s*/g, " ").replace(/\n/g, " ").trim(),
  sample: "   too    many     spaces   here   ",
  filename: "cleaned.txt",
});

export const WordWrapTool: ComponentType = transformTool({
  init: { width: 80, mode: "hard" as string, keepWords: true },
  controls: (s, set) => (
    <>
      <NumField label="Wrap at column" value={s.width} min={1} max={999} onChange={(v) => set({ width: v || 80 })} />
      <SelField
        label="Mode"
        value={s.mode}
        onChange={(v) => set({ mode: v })}
        options={[
          { value: "hard", label: "Hard wrap (break words)" },
          { value: "soft", label: "Soft wrap (keep words)" },
          { value: "html", label: "HTML <br> wrap" },
        ]}
      />
    </>
  ),
  run: (input, s) => {
    const wrap = (line: string): string[] => {
      if (!line) return [""];
      if (s.mode === "hard") {
        const out: string[] = [];
        for (let i = 0; i < line.length; i += s.width) out.push(line.slice(i, i + s.width));
        return out;
      }
      const words = line.split(" ");
      const out: string[] = [];
      let cur = "";
      for (const w of words) {
        if (cur && (cur + " " + w).length > s.width) {
          out.push(cur);
          cur = w;
        } else {
          cur = cur ? cur + " " + w : w;
        }
      }
      if (cur) out.push(cur);
      return out;
    };
    const wrapped = input.split("\n").flatMap(wrap);
    if (s.mode === "html") return wrapped.map((l) => `${l}<br>`).join("\n");
    return wrapped.join("\n");
  },
  sample:
    "This is a long paragraph of text that will be wrapped at the column width you choose, making it easy to paste into editors or emails with fixed-width constraints.",
  filename: "wrapped.txt",
});

export const TextPaddingTool: ComponentType = transformTool({
  init: { width: 30, char: " ", align: "left" as string },
  controls: (s, set) => (
    <>
      <NumField label="Total width" value={s.width} min={1} max={200} onChange={(v) => set({ width: v || 30 })} />
      <Field label="Pad character">
        <input className="input !w-16 text-center" maxLength={3} value={s.char} onChange={(e) => set({ char: e.target.value || " " })} />
      </Field>
      <SelField
        label="Alignment"
        value={s.align}
        onChange={(v) => set({ align: v })}
        options={[
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
          { value: "center", label: "Center" },
        ]}
      />
    </>
  ),
  run: (input, s) => {
    const ch = s.char.length ? [...s.char][0] : " ";
    return input
      .split("\n")
      .map((l) => {
        if (l.length >= s.width) return l;
        const pad = s.width - [...l].length;
        if (s.align === "left") return l + ch.repeat(pad);
        if (s.align === "right") return ch.repeat(pad) + l;
        const left = Math.floor(pad / 2);
        return ch.repeat(left) + l + ch.repeat(pad - left);
      })
      .join("\n");
  },
  sample: "name\nquantity\ntotal",
  filename: "padded.txt",
});

export const NumberLinesTool: ComponentType = transformTool({
  init: { start: 1, sep: ". ", pad: false },
  controls: (s, set) => (
    <>
      <NumField label="Start at" value={s.start} min={0} onChange={(v) => set({ start: v || 1 })} />
      <Field label="Separator">
        <input className="input !w-20" value={s.sep} onChange={(e) => set({ sep: e.target.value })} />
      </Field>
      <Toggle label="Zero-pad to line count" checked={s.pad} onChange={(v) => set({ pad: v })} />
    </>
  ),
  run: (input, s) => {
    const lines = input.split("\n");
    const digits = String(s.start + lines.length - 1).length;
    return lines
      .map((l, i) => {
        const n = String(s.start + i);
        return (s.pad ? n.padStart(digits, "0") : n) + s.sep + l;
      })
      .join("\n");
  },
  sample: "first line\nsecond line\nthird line",
  filename: "numbered.txt",
});

export const TruncateTool: ComponentType = transformTool({
  init: { length: 50, ellipsis: "…" },
  controls: (s, set) => (
    <>
      <NumField label="Max length" value={s.length} min={1} onChange={(v) => set({ length: v || 50 })} />
      <Field label="Ellipsis">
        <input className="input !w-20" value={s.ellipsis} onChange={(e) => set({ ellipsis: e.target.value })} />
      </Field>
    </>
  ),
  run: (input, s) => {
    const chars = [...input];
    if (chars.length <= s.length) return input;
    const ell = s.ellipsis.slice(0, Math.max(0, s.length));
    return chars.slice(0, Math.max(0, s.length - ell.length)).join("") + ell;
  },
  sample: "A very long headline that goes on and on and definitely exceeds fifty characters",
  filename: "truncated.txt",
});

export const RepeatTool: ComponentType = transformTool({
  init: { times: 3, sep: "\n" },
  controls: (s, set) => (
    <>
      <NumField label="Repeat count" value={s.times} min={1} max={10000} onChange={(v) => set({ times: v || 1 })} />
      <SelField
        label="Separator"
        value={s.sep === "\n" ? "nl" : s.sep === "" ? "none" : "space"}
        onChange={(v) => set({ sep: v === "nl" ? "\n" : v === "space" ? " " : "" })}
        options={[
          { value: "nl", label: "New line" },
          { value: "space", label: "Space" },
          { value: "none", label: "None" },
        ]}
      />
    </>
  ),
  run: (input, s) => new Array(Math.min(10000, s.times)).fill(input).join(s.sep),
  sample: "ha",
  filename: "repeated.txt",
});

export const SlugifyTool: ComponentType = transformTool({
  init: { sep: "-" as string, lower: true },
  controls: (s, set) => (
    <>
      <SelField
        label="Separator"
        value={s.sep}
        onChange={(v) => set({ sep: v })}
        options={[
          { value: "-", label: "Hyphen (-)" },
          { value: "_", label: "Underscore (_)" },
          { value: ".", label: "Dot (.)" },
        ]}
      />
      <Toggle label="Force lowercase" checked={s.lower} onChange={(v) => set({ lower: v })} />
    </>
  ),
  run: (input, s) => {
    const base = s.lower ? slugify(input, s.sep) : deaccent(input).replace(/[^a-zA-Z0-9]+/g, s.sep).replace(new RegExp(`^\\${s.sep}|\\${s.sep}$`, "g"), "");
    return base;
  },
  sample: "Héllo Wörld! — 10 Gréat Ideas",
  filename: "slug.txt",
});

export const SlugGeneratorTool: ComponentType = transformTool({
  init: { sep: "-" as string, maxLength: 0 },
  controls: (s, set) => (
    <>
      <SelField
        label="Separator"
        value={s.sep}
        onChange={(v) => set({ sep: v })}
        options={[
          { value: "-", label: "Hyphen (-)" },
          { value: "_", label: "Underscore (_)" },
        ]}
      />
      <NumField label="Max length (0 = no limit)" value={s.maxLength} min={0} onChange={(v) => set({ maxLength: v || 0 })} />
    </>
  ),
  run: (input, s) =>
    input
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => {
        let slug = slugify(l, s.sep);
        if (s.maxLength > 0 && slug.length > s.maxLength) {
          slug = slug.slice(0, s.maxLength).replace(new RegExp(`\\${s.sep}[^\\${s.sep}]*$`), "");
        }
        return slug;
      })
      .join("\n"),
  sample: "My First Blog Post\nÜnïcödé & Accents — Handle It\n10% Faster Results",
  filename: "slugs.txt",
});

export const ExtractEmailsTool: ComponentType = transformTool({
  init: { unique: true, sort: false },
  controls: (s, set) => (
    <div>
      <span className="label">Options</span>
      <Toggle label="Unique only" checked={s.unique} onChange={(v) => set({ unique: v })} />
      <Toggle label="Sort alphabetically" checked={s.sort} onChange={(v) => set({ sort: v })} />
    </div>
  ),
  run: (input, s) => {
    let out: string[] = input.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) ?? [];
    if (s.unique) out = [...new Set(out)];
    if (s.sort) out.sort();
    return out.join("\n") || "(no email addresses found)";
  },
  sample: "Contact alice@example.com or bob.smith+news@mail.co.uk for details.",
  filename: "emails.txt",
});

export const ExtractUrlsTool: ComponentType = transformTool({
  init: { unique: true, stripProtocol: false },
  controls: (s, set) => (
    <div>
      <span className="label">Options</span>
      <Toggle label="Unique only" checked={s.unique} onChange={(v) => set({ unique: v })} />
      <Toggle label="Strip protocol (http/https)" checked={s.stripProtocol} onChange={(v) => set({ stripProtocol: v })} />
    </div>
  ),
  run: (input, s) => {
    let out: string[] =
      input.match(/https?:\/\/[^\s<>"')\]]+|www\.[^\s<>"')\]]+|(?:[\w-]+\.)+[a-z]{2,}(?:\/[^\s<>"')\]]*)?/gi) ?? [];
    if (s.stripProtocol) out = out.map((u) => u.replace(/^https?:\/\//, ""));
    if (s.unique) out = [...new Set(out)];
    return out.join("\n") || "(no URLs found)";
  },
  sample: "Check https://example.com/page and www.another-site.org today.",
  filename: "urls.txt",
});

export const ExtractNumbersTool: ComponentType = transformTool({
  init: { mode: "all" as string, unique: false },
  controls: (s, set) => (
    <>
      <SelField
        label="Numbers to find"
        value={s.mode}
        onChange={(v) => set({ mode: v })}
        options={[
          { value: "all", label: "All numbers (int & decimal)" },
          { value: "int", label: "Integers only" },
          { value: "decimal", label: "Decimals only" },
          { value: "negative", label: "Include negatives" },
        ]}
      />
      <Toggle label="Unique only" checked={s.unique} onChange={(v) => set({ unique: v })} />
    </>
  ),
  run: (input, s) => {
    const pattern =
      s.mode === "int" ? /\b\d+\b/g : s.mode === "decimal" ? /\b\d+\.\d+\b/g : s.mode === "negative" ? /-?\d+(?:\.\d+)?/g : /\d+(?:\.\d+)?/g;
    let out: string[] = input.match(pattern) ?? [];
    if (s.unique) out = [...new Set(out)];
    return out.join("\n") || "(no numbers found)";
  },
  sample: "Order 3 items at 14.99 each, total 44.97 — minus 5 discount units.",
  filename: "numbers.txt",
});

export const TextToHtmlTool: ComponentType = transformTool({
  init: { mode: "escape" as string },
  controls: (s, set) => (
    <SelField
      label="Output"
      value={s.mode}
      onChange={(v) => set({ mode: v })}
      options={[
        { value: "escape", label: "Escape entities (&lt; &amp; …)" },
        { value: "paragraphs", label: "Wrap in <p> paragraphs" },
        { value: "br", label: "Convert line breaks to <br>" },
      ]}
    />
  ),
  run: (input, s) => {
    const esc = (t: string) =>
      t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    if (s.mode === "escape") return esc(input);
    if (s.mode === "br")
      return esc(input).replace(/\n/g, "<br>\n");
    return esc(input)
      .split(/\n\s*\n/)
      .filter((p) => p.trim())
      .map((p) => `<p>${p.trim().replace(/\n/g, " ")}</p>`)
      .join("\n");
  },
  sample: "First paragraph.\n\nSecond paragraph with <special> & characters.",
  filename: "text-to-html.html",
  mime: "text/html",
});

export const HtmlToTextTool: ComponentType = transformTool({
  init: { decodeEntities: true, keepLinks: false },
  controls: (s, set) => (
    <div>
      <span className="label">Options</span>
      <Toggle label="Keep link URLs in brackets" checked={s.keepLinks} onChange={(v) => set({ keepLinks: v })} />
    </div>
  ),
  run: (input, s) => {
    const doc = new DOMParser().parseFromString(input, "text/html");
    if (s.keepLinks) {
      doc.querySelectorAll("a[href]").forEach((a) => {
        a.append(` [${(a as HTMLAnchorElement).href}]`);
      });
    }
    doc.querySelectorAll("script,style,noscript").forEach((el) => el.remove());
    doc.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
    doc.querySelectorAll("p,div,li,tr,h1,h2,h3,h4,h5,h6").forEach((el) => el.append("\n"));
    return (doc.body.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
  },
  sample: "<h1>Title</h1>\n<p>Hello <b>world</b>!</p>\n<p>Second paragraph.</p>",
  filename: "plain-text.txt",
});

export const ReplaceTool: ComponentType = transformTool<{
  find: string;
  replace: string;
  regex: boolean;
  caseSensitive: boolean;
}>(
  {
    init: { find: "", replace: "", regex: false, caseSensitive: false },
    controls: (s, set) => (
      <>
        <Field label="Find">
          <input className="input !w-56" value={s.find} onChange={(e) => set({ find: e.target.value })} placeholder="text or /regex/" />
        </Field>
        <Field label="Replace with">
          <input className="input !w-56" value={s.replace} onChange={(e) => set({ replace: e.target.value })} placeholder="(can use $1, $2…)" />
        </Field>
        <div>
          <span className="label">Options</span>
          <Toggle label="Regular expression" checked={s.regex} onChange={(v) => set({ regex: v })} />
          <Toggle label="Case sensitive" checked={s.caseSensitive} onChange={(v) => set({ caseSensitive: v })} />
        </div>
      </>
    ),
    run: (input, s) => {
      if (!s.find) return input;
      let pattern = s.regex ? s.find : s.find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      let flags = "g";
      if (!s.caseSensitive) flags += "i";
      return input.replace(new RegExp(pattern, flags), s.replace);
    },
    sample: "The cat sat on the mat.",
    filename: "replaced.txt",
  },
);
