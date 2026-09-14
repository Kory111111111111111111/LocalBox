// JSON/XML/YAML/TOML/CSV data tools.
import { useMemo, useState, type ComponentType } from "react";
import yaml from "js-yaml";
import Papa from "papaparse";
import ToolLayout from "../../components/ToolLayout";
import EditorPane from "../../components/EditorPane";
import { Field, Note, NumField, OptionsBar, OutputArea, RunButton, SelField, Toggle } from "../../components/ui";

const JSON_SAMPLE = `{
  "name": "localtoolbox",
  "version": "0.1.0",
  "local": true,
  "categories": ["pdf", "image", "text"],
  "stats": { "tools": 316, "offline": true }
}`;

function useParsedJson(text: string): { value: unknown | undefined; error: string | null } {
  return useMemo(() => {
    if (!text.trim()) return { value: undefined, error: null };
    try {
      return { value: JSON.parse(text), error: null };
    } catch (e) {
      return { value: undefined, error: e instanceof Error ? e.message : String(e) };
    }
  }, [text]);
}

// ── json formatter / beautifier / minifier ──
function makeJsonTool(mode: "format" | "minify"): ComponentType {
  return function JsonTool() {
    const [text, setText] = useState("");
    const [indent, setIndent] = useState(2);
    const [sortKeys, setSortKeys] = useState(false);
    const sortDeep = (v: unknown): unknown => {
      if (Array.isArray(v)) return v.map(sortDeep);
      if (v && typeof v === "object") {
        return Object.fromEntries(
          Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, sortDeep(x)]),
        );
      }
      return v;
    };
    const { output, error, stats } = useMemo(() => {
      if (!text.trim()) return { output: "", error: null as string | null, stats: null as string | null };
      try {
        const parsed = JSON.parse(text) as unknown;
        const value = sortKeys ? sortDeep(parsed) : parsed;
        const out = mode === "minify" ? JSON.stringify(value) : JSON.stringify(value, null, indent);
        const keys = (text.match(/"[^"]*"\\s*:/g) ?? []).length;
        const depth = (() => {
          let d = 0;
          let max = 0;
          for (const ch of text) {
            if (ch === "{" || ch === "[") max = Math.max(max, ++d);
            if (ch === "}" || ch === "]") d--;
          }
          return max;
        })();
        return {
          output: out,
          error: null,
          stats: `${out.length.toLocaleString()} chars · ${keys.toLocaleString()} keys · max depth ${depth} · ${out.length < text.length ? `${(100 - (out.length / text.length) * 100).toFixed(1)}% smaller` : `${((out.length / text.length - 1) * 100).toFixed(1)}% larger`}`,
        };
      } catch (e) {
        return { output: "", error: e instanceof Error ? e.message : String(e), stats: null };
      }
    }, [text, indent, sortKeys]);
    return (
      <ToolLayout>
        <EditorPane value={text} onChange={setText} output={output} error={error} sample={JSON_SAMPLE} rows={10} filename={mode === "minify" ? "minified.json" : "formatted.json"}
          options={
            <OptionsBar>
              {mode === "format" && <NumField label="Indent spaces" value={indent} min={0} max={8} onChange={(v) => setIndent(Math.min(8, Math.max(0, v ?? 2)))} />}
              <Toggle label="Sort keys alphabetically" checked={sortKeys} onChange={setSortKeys} />
              {stats && <span className="text-xs text-ink-dim self-center ml-auto">{stats}</span>}
            </OptionsBar>
          } />
      </ToolLayout>
    );
  };
}
export const JsonFormatterTool: ComponentType = makeJsonTool("format");
export const JsonMinifyTool: ComponentType = makeJsonTool("minify");
export const JsonBeautifierTool: ComponentType = function () {
  const [text, setText] = useState("");
  const parsed = useParsedJson(text);
  const valid = !parsed.error && !!text.trim();
  const countNodes = (v: unknown): number =>
    Array.isArray(v) ? v.reduce((a: number, x) => a + countNodes(x), 1)
      : v && typeof v === "object"
        ? Object.values(v as object).reduce((a: number, x) => a + countNodes(x), 1)
        : 1;
  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} output={valid ? JSON.stringify(parsed.value, null, 2) : ""} error={parsed.error} sample={JSON_SAMPLE} rows={10} filename="beautified.json"
        options={
          <OptionsBar>
            {valid && <span className="text-xs text-success self-center">✓ Valid JSON · {countNodes(parsed.value!)} values</span>}
          </OptionsBar>
        } />
    </ToolLayout>
  );
};

// ── JSON <-> CSV ──
export const JsonToCsvTool: ComponentType = () => {
  const [text, setText] = useState("");
  const [flatten, setFlatten] = useState(true);
  const { output, error } = useMemo(() => {
    if (!text.trim()) return { output: "", error: null as string | null };
    try {
      const data = JSON.parse(text);
      const rows: Record<string, unknown>[] = Array.isArray(data)
        ? data
        : typeof data === "object" && data !== null
          ? [data as Record<string, unknown>]
          : [];
      if (rows.length === 0) throw new Error("Expected an array of objects (or a single object).");
      const flat: Record<string, unknown>[] = rows.map((r) => {
        if (!flatten) return r;
        const out: Record<string, unknown> = {};
        const walk = (obj: Record<string, unknown>, prefix = "") => {
          for (const [k, v] of Object.entries(obj)) {
            const key = prefix ? `${prefix}.${k}` : k;
            if (v && typeof v === "object" && !Array.isArray(v)) walk(v as Record<string, unknown>, key);
            else out[key] = Array.isArray(v) ? v.join("|") : v;
          }
        };
        walk(r);
        return out;
      });
      return { output: Papa.unparse(flat), error: null };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : String(e) };
    }
  }, [text, flatten]);
  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} output={output} error={error} sample={JSON.stringify([{ id: 1, name: "Merge PDF", tags: ["pdf", "merge"] }, { id: 2, name: "Word Counter", tags: ["text"] }], null, 2)} rows={10} filename="data.csv"
        options={<OptionsBar><Toggle label="Flatten nested objects (a.b.c columns)" checked={flatten} onChange={setFlatten} /></OptionsBar>} />
    </ToolLayout>
  );
};

export const CsvToJsonTool: ComponentType = () => {
  const [text, setText] = useState("");
  const [header, setHeader] = useState(true);
  const { output, error } = useMemo(() => {
    if (!text.trim()) return { output: "", error: null as string | null };
    try {
      const res = Papa.parse(text.trim(), { header, skipEmptyLines: true, dynamicTyping: true });
      return { output: JSON.stringify(res.data, null, 2), error: null };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : String(e) };
    }
  }, [text, header]);
  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} output={output} error={error} sample={"id,name,local\n1,Merge PDF,true\n2,Word Counter,true"} rows={10} filename="data.json"
        options={<OptionsBar><Toggle label="First row is a header" checked={header} onChange={setHeader} /></OptionsBar>} />
    </ToolLayout>
  );
};

// ── XML <-> JSON ──
function xmlToJson(node: Element): unknown {
  const obj: Record<string, unknown> = {};
  for (const attr of Array.from(node.attributes)) obj[`@${attr.name}`] = attr.value;
  const children = Array.from(node.children);
  if (children.length === 0) {
    const text = node.textContent?.trim() ?? "";
    if (Object.keys(obj).length === 0) return text;
    if (text) obj["#text"] = text;
    return obj;
  }
  for (const child of children) {
    const val = xmlToJson(child);
    if (child.tagName in obj) {
      const existing = obj[child.tagName];
      if (Array.isArray(existing)) (existing as unknown[]).push(val);
      else obj[child.tagName] = [existing, val];
    } else {
      obj[child.tagName] = val;
    }
  }
  return obj;
}

function jsonToXml(value: unknown, rootName = "root", indent = 2): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const render = (v: unknown, name: string, depth: number): string => {
    const pad = " ".repeat(indent * depth);
    if (v === null || v === undefined) return `${pad}<${name}/>`;
    if (Array.isArray(v)) return v.map((x) => render(x, name, depth)).join("\n");
    if (typeof v === "object") {
      const entries = Object.entries(v as Record<string, unknown>);
      const attrs = entries.filter(([k]) => k.startsWith("@")).map(([k, x]) => ` ${k.slice(1)}="${esc(String(x))}"`).join("");
      const inner = entries.filter(([k]) => !k.startsWith("@") && k !== "#text");
      const text = (v as Record<string, unknown>)["#text"];
      if (inner.length === 0 && text !== undefined) return `${pad}<${name}${attrs}>${esc(String(text))}</${name}>`;
      if (inner.length === 0) return `${pad}<${name}${attrs}/>`;
      const innerStr = inner.map(([k, x]) => render(x, k, depth + 1)).join("\n");
      return `${pad}<${name}${attrs}>\n${innerStr}\n${pad}</${name}>`;
    }
    return `${pad}<${name}>${esc(String(v))}</${name}>`;
  };
  return render(value, rootName, 0);
}

export const XmlToJsonTool: ComponentType = () => {
  const [text, setText] = useState("");
  const { output, error } = useMemo(() => {
    if (!text.trim()) return { output: "", error: null as string | null };
    try {
      const doc = new DOMParser().parseFromString(text, "application/xml");
      if (doc.querySelector("parsererror")) throw new Error("Invalid XML: " + (doc.querySelector("parsererror")?.textContent ?? "parse error").slice(0, 200));
      const root = doc.documentElement;
      return { output: JSON.stringify({ [root.tagName]: xmlToJson(root) }, null, 2), error: null };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : String(e) };
    }
  }, [text]);
  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} output={output} error={error} sample={'<?xml version="1.0"?>\n<toolbox local="true">\n  <category id="pdf">PDF Tools</category>\n  <category id="text">Text Tools</category>\n</toolbox>'} rows={10} filename="converted.json" />
    </ToolLayout>
  );
};

export const JsonToXmlTool: ComponentType = () => {
  const [text, setText] = useState("");
  const [root, setRoot] = useState("root");
  const { output, error } = useMemo(() => {
    if (!text.trim()) return { output: "", error: null as string | null };
    try {
      return { output: jsonToXml(JSON.parse(text), root || "root"), error: null };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : String(e) };
    }
  }, [text, root]);
  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} output={output} error={error} sample={JSON_SAMPLE} rows={10} filename="converted.xml"
        options={<OptionsBar><Field label="Root element name"><input className="input !w-36" value={root} onChange={(e) => setRoot(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))} /></Field></OptionsBar>} />
    </ToolLayout>
  );
};

// ── YAML <-> JSON ──
export const YamlToJsonTool: ComponentType = () => {
  const [text, setText] = useState("");
  const { output, error } = useMemo(() => {
    if (!text.trim()) return { output: "", error: null as string | null };
    try {
      return { output: JSON.stringify(yaml.load(text), null, 2), error: null };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message.split("\n")[0] : String(e) };
    }
  }, [text]);
  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} output={output} error={error} sample={"name: localtoolbox\nlocal: true\ncategories:\n  - pdf\n  - text\nstats:\n  tools: 316"} rows={10} filename="converted.json" />
    </ToolLayout>
  );
};

export const JsonToYamlTool: ComponentType = () => {
  const [text, setText] = useState("");
  const { output, error } = useMemo(() => {
    if (!text.trim()) return { output: "", error: null as string | null };
    try {
      return { output: yaml.dump(JSON.parse(text), { lineWidth: 120, noRefs: true }), error: null };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message.split("\n")[0] : String(e) };
    }
  }, [text]);
  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} output={output} error={error} sample={JSON_SAMPLE} rows={10} filename="converted.yaml" />
    </ToolLayout>
  );
};

// ── TOML -> JSON (small parser: tables, arrays of tables, scalars, arrays, inline tables) ──
function parseToml(src: string): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  let current: Record<string, unknown> = root;
  const lines = src.split(/\r?\n/);
  const stripStr = (s: string) => s;
  const parseValue = (raw: string): unknown => {
    const t = raw.trim();
    if (t === "true") return true;
    if (t === "false") return false;
    if (/^-?\d+$/.test(t)) return parseInt(t, 10);
    if (/^-?\d+\.\d+$/.test(t)) return parseFloat(t);
    if (/^".*"$/.test(t) && !t.includes("\\")) return stripStr(t.slice(1, -1));
    if (/^'[^']*'$/.test(t)) return t.slice(1, -1);
    if (t.startsWith("[")) {
      // array — split top level commas
      const inner = t.slice(1, -1).trim();
      if (!inner) return [];
      const items: string[] = [];
      let depth = 0;
      let quote: string | null = null;
      let cur = "";
      for (const ch of inner) {
        if (quote) {
          cur += ch;
          if (ch === quote) quote = null;
          continue;
        }
        if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
        if (ch === "[" || ch === "{") depth++;
        if (ch === "]" || ch === "}") depth--;
        if (ch === "," && depth === 0) { items.push(cur); cur = ""; continue; }
        cur += ch;
      }
      if (cur.trim()) items.push(cur);
      return items.map((i) => parseValue(i));
    }
    if (t.startsWith("{")) {
      const obj: Record<string, unknown> = {};
      const inner = t.slice(1, -1);
      for (const pair of splitTopCommas(inner)) {
        const eq = pair.indexOf("=");
        if (eq > 0) obj[pair.slice(0, eq).trim()] = parseValue(pair.slice(eq + 1));
      }
      return obj;
    }
    return t; // dates & exotic values as strings
  };
  const splitTopCommas = (s: string): string[] => {
    const items: string[] = [];
    let depth = 0;
    let quote: string | null = null;
    let cur = "";
    for (const ch of s) {
      if (quote) { cur += ch; if (ch === quote) quote = null; continue; }
      if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
      if (ch === "[" || ch === "{") depth++;
      if (ch === "]" || ch === "}") depth--;
      if (ch === "," && depth === 0) { items.push(cur); cur = ""; continue; }
      cur += ch;
    }
    if (cur.trim()) items.push(cur);
    return items;
  };
  const ensurePath = (path: string[], createArr = false): Record<string, unknown> => {
    let node: unknown = root;
    for (let i = 0; i < path.length; i++) {
      const key = path[i];
      const parent = node as Record<string, unknown>;
      let next = parent[key];
      if (Array.isArray(next)) next = next[next.length - 1];
      if (next === undefined) {
        next = i === path.length - 1 && createArr ? [{}] : {};
        parent[key] = next;
      }
      node = next;
    }
    if (Array.isArray(node)) return node[node.length - 1] as Record<string, unknown>;
    return node as Record<string, unknown>;
  };
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const hash = findComment(line);
    if (hash >= 0) line = line.slice(0, hash);
    line = line.trim();
    if (!line) continue;
    if (line.startsWith("[[") && line.endsWith("]]")) {
      const path = line.slice(2, -2).split(".").map((s) => s.trim().replace(/^"|"$/g, ""));
      const parent = ensurePath(path.slice(0, -1));
      const key = path[path.length - 1];
      const arr = parent[key];
      const entry: Record<string, unknown> = {};
      if (Array.isArray(arr)) arr.push(entry);
      else parent[key] = [entry];
      current = entry;
      continue;
    }
    if (line.startsWith("[") && line.endsWith("]")) {
      const path = line.slice(1, -1).split(".").map((s) => s.trim().replace(/^"|"$/g, ""));
      current = ensurePath(path);
      continue;
    }
    const eq = line.indexOf("=");
    if (eq === -1) throw new Error(`Line ${i + 1}: expected key = value`);
    const key = line.slice(0, eq).trim().replace(/^"|"$/g, "");
    const valueRaw = line.slice(eq + 1).trim();
    if (valueRaw.startsWith('"""') || valueRaw.startsWith("'''")) {
      // multi-line string
      const delim = valueRaw.slice(0, 3);
      let val = valueRaw.slice(3);
      if (val.endsWith(delim)) {
        val = val.slice(0, -3);
        current[key] = val.replace(/^\n/, "");
      } else {
        let buf = val;
        let j = i + 1;
        for (; j < lines.length; j++) {
          buf += "\n" + lines[j];
          if (lines[j].includes(delim)) break;
        }
        current[key] = buf.split(delim)[0].replace(/^\n/, "");
        i = j;
      }
      continue;
    }
    current[key] = parseValue(valueRaw);
  }
  function findComment(l: string): number {
    let quote: string | null = null;
    for (let i = 0; i < l.length; i++) {
      const ch = l[i];
      if (quote) { if (ch === quote) quote = null; continue; }
      if (ch === '"' || ch === "'") quote = ch;
      else if (ch === "#") return i;
    }
    return -1;
  }
  return root;
}

export const TomlToJsonTool: ComponentType = () => {
  const [text, setText] = useState("");
  const { output, error } = useMemo(() => {
    if (!text.trim()) return { output: "", error: null as string | null };
    try {
      return { output: JSON.stringify(parseToml(text), null, 2), error: null };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : String(e) };
    }
  }, [text]);
  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} output={output} error={error} sample={'title = "LocalToolBox"\noffline = true\n[stats]\ntools = 316\n[[tools]]\nname = "Merge PDF"\ncategory = "pdf"'} rows={10} filename="converted.json" />
    </ToolLayout>
  );
};

// ── JSON diff ──
type JsonDiffRow = { path: string; type: "added" | "removed" | "changed"; a?: string; b?: string };
function deepDiff(a: unknown, b: unknown, path: string, out: JsonDiffRow[]) {
  const typeOf = (v: unknown) => (Array.isArray(v) ? "array" : v === null ? "null" : typeof v);
  if (typeOf(a) !== typeOf(b)) {
    out.push({ path, type: "changed", a: JSON.stringify(a), b: JSON.stringify(b) });
    return;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ao = a as Record<string, unknown>;
    const bo = b as Record<string, unknown>;
    for (const k of new Set([...Object.keys(ao), ...Object.keys(bo)])) {
      const p = path ? `${path}.${k}` : k;
      if (!(k in bo)) out.push({ path: p, type: "removed", a: JSON.stringify(ao[k]) });
      else if (!(k in ao)) out.push({ path: p, type: "added", b: JSON.stringify(bo[k]) });
      else deepDiff(ao[k], bo[k], p, out);
    }
    return;
  }
  if (a !== b) out.push({ path, type: "changed", a: JSON.stringify(a), b: JSON.stringify(b) });
}

export const JsonDiffTool: ComponentType = () => {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const result = useMemo(() => {
    if (!a.trim() && !b.trim()) return null;
    try {
      const rows: JsonDiffRow[] = [];
      deepDiff(JSON.parse(a), JSON.parse(b), "", rows);
      return { rows, error: null as string | null };
    } catch (e) {
      return { rows: [] as JsonDiffRow[], error: e instanceof Error ? e.message : String(e) };
    }
  }, [a, b]);
  return (
    <ToolLayout>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="label">Original JSON</span>
          <textarea className="textarea" rows={10} value={a} onChange={(e) => setA(e.target.value)} placeholder='{"a": 1, "b": 2}' spellCheck={false} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="label">New JSON</span>
          <textarea className="textarea" rows={10} value={b} onChange={(e) => setB(e.target.value)} placeholder='{"a": 1, "c": 3}' spellCheck={false} />
        </div>
      </div>
      {result?.error && <Note kind="error">{result.error}</Note>}
      {result && !result.error && (
        <div className="card overflow-hidden">
          <div className="px-3 py-2 border-b border-border text-xs text-ink-dim">
            {result.rows.length === 0 ? "The two documents are identical." : `${result.rows.length} difference${result.rows.length === 1 ? "" : "s"} found`}
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-ink-dim border-b border-border">
                <th className="px-3 py-2">Path</th><th className="px-3 py-2">Change</th><th className="px-3 py-2">Before</th><th className="px-3 py-2">After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle font-mono">
              {result.rows.map((r, i) => (
                <tr key={i} className={r.type === "added" ? "bg-success/5" : r.type === "removed" ? "bg-danger/5" : ""}>
                  <td className="px-3 py-1.5 text-accent break-all">{r.path}</td>
                  <td className="px-3 py-1.5">
                    <span className={r.type === "added" ? "text-success" : r.type === "removed" ? "text-danger" : "text-warning"}>{r.type}</span>
                  </td>
                  <td className="px-3 py-1.5 text-ink-muted break-all">{r.a ?? "—"}</td>
                  <td className="px-3 py-1.5 text-ink-muted break-all">{r.b ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ToolLayout>
  );
};

// ── JSON -> typed code ──
type Lang = "ts" | "go" | "python" | "java" | "csharp" | "rust";
function inferTsType(value: unknown, name: string, interfaces: Map<string, Map<string, string>>): string {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return "unknown[]";
    const inner = [...new Set(value.map((v) => inferTsType(v, name, interfaces)))];
    return inner.length === 1 ? `${inner[0]}[]` : `(${inner.join(" | ")})[]`;
  }
  if (typeof value === "object") {
    const fields = new Map<string, string>();
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      fields.set(k.replace(/[^a-zA-Z0-9_$]/g, "_"), inferTsType(v, cap(singular(k)) || "Item", interfaces));
    }
    const ifaceName = uniqueName(name, interfaces);
    interfaces.set(ifaceName, fields);
    return ifaceName;
  }
  return typeof value;
}
function cap(s: string) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function singular(s: string) { return s.endsWith("s") && s.length > 1 ? s.slice(0, -1) : s; }
function uniqueName(name: string, map: Map<string, unknown>) {
  let n = name.replace(/[^a-zA-Z0-9]/g, "") || "Type";
  let i = 2;
  while (map.has(n)) n = name + i++;
  return n;
}
const tsTypeMap: Record<string, string> = { number: "number", string: "string", boolean: "boolean", null: "null" };
const goTypeMap: Record<string, string> = { number: "float64", string: "string", boolean: "bool", null: "any" };
const pyTypeMap: Record<string, string> = { number: "float", string: "str", boolean: "bool", null: "None" };
const javaTypeMap: Record<string, string> = { number: "double", string: "String", boolean: "boolean", null: "Object" };
const csTypeMap: Record<string, string> = { number: "double", string: "string", boolean: "bool", null: "object" };
const rustTypeMap: Record<string, string> = { number: "f64", string: "String", boolean: "bool", null: "Option<serde_json::Value>" };

export const JsonToCodeTool: ComponentType = () => {
  const [text, setText] = useState("");
  const [lang, setLang] = useState<Lang>("ts");
  const [rootName, setRootName] = useState("Root");

  const output = useMemo(() => {
    if (!text.trim()) return "";
    try {
      const data = JSON.parse(text);
      const rows: unknown[] = Array.isArray(data) ? data : [data];
      const interfaces = new Map<string, Map<string, string>>();
      const rootType = inferTsType(rows, rootName || "Root", interfaces);
      if (lang !== "ts") {
        // reuse inferred structure, map type names per language
        const map = lang === "go" ? goTypeMap : lang === "python" ? pyTypeMap : lang === "java" ? javaTypeMap : lang === "csharp" ? csTypeMap : rustTypeMap;
        const chunks: string[] = [];
        if (Array.isArray(data)) {
          chunks.push(lang === "go" ? `type ${(rootName || "Root")} = []${rootType}` : "");
        }
        for (const [iname, fields] of interfaces) {
          if (lang === "go") {
            chunks.push(`type ${iname} struct {`);
            for (const [f, t] of fields) chunks.push(`\t${cap(f)} ${map[t] ?? t}${t.endsWith("[]") ? "" : ""} \`json:"${f}"\``);
            chunks.push("}");
          } else if (lang === "python") {
            chunks.push(`class ${iname}(BaseModel):`);
            if (fields.size === 0) chunks.push("\tpass");
            for (const [f, t] of fields) chunks.push(`\t${f}: ${map[t] ?? t}`);
          } else if (lang === "java") {
            chunks.push(`public class ${iname} {`);
            for (const [f, t] of fields) chunks.push(`    private ${map[t] ?? t} ${f};`);
            chunks.push("}");
          } else if (lang === "csharp") {
            chunks.push(`public class ${iname} {`);
            for (const [f, t] of fields) chunks.push(`    public ${map[t] ?? t} ${cap(f)} { get; set; }`);
            chunks.push("}");
          } else {
            chunks.push(`#[derive(Debug, Serialize, Deserialize)]\npub struct ${iname} {`);
            for (const [f, t] of fields) chunks.push(`    pub ${f}: ${map[t] ?? t},`);
            chunks.push("}");
          }
        }
        return chunks.filter(Boolean).join("\n\n");
      }
      const chunks: string[] = [];
      if (Array.isArray(data)) chunks.push(`type ${rootName || "Root"} = ${rootType};\n`);
      for (const [iname, fields] of interfaces) {
        chunks.push(`export interface ${iname} {`);
        for (const [f, t] of fields) chunks.push(`  ${f}: ${tsTypeMap[t] ?? t}${t === "unknown[]" ? "[]" : ""};`);
        chunks.push("}");
      }
      return chunks.join("\n\n");
    } catch {
      return "";
    }
  }, [text, lang, rootName]);

  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} output={output} sample={JSON_SAMPLE} rows={10} filename={`types.${lang === "csharp" ? "cs" : lang === "python" ? "py" : lang === "rust" ? "rs" : lang === "go" ? "go" : "ts"}`}
        options={
          <OptionsBar>
            <SelField label="Language" value={lang} onChange={setLang}
              options={[
                { value: "ts", label: "TypeScript" }, { value: "go", label: "Go" }, { value: "python", label: "Python (pydantic)" },
                { value: "java", label: "Java" }, { value: "csharp", label: "C#" }, { value: "rust", label: "Rust (serde)" },
              ]} />
            <Field label="Root type name">
              <input className="input !w-32" value={rootName} onChange={(e) => setRootName(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))} />
            </Field>
          </OptionsBar>
        } />
    </ToolLayout>
  );
};

// ── JSON schema validator (draft subset) ──
function validateSchema(value: unknown, schema: any, path: string, errors: string[]) {
  if (!schema || typeof schema !== "object") return;
  if (schema.type) {
    const t = Array.isArray(value) ? "array" : value === null ? "null" : typeof value;
    const expected = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!expected.includes(t)) {
      errors.push(`${path}: expected type ${expected.join("|")}, got ${t}`);
      return;
    }
  }
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path}: value ${JSON.stringify(value)} not in enum [${schema.enum.map((v: unknown) => JSON.stringify(v)).join(", ")}]`);
  }
  if (typeof value === "string") {
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${path}: does not match pattern ${schema.pattern}`);
    if (typeof schema.minLength === "number" && value.length < schema.minLength) errors.push(`${path}: shorter than minLength ${schema.minLength}`);
    if (typeof schema.maxLength === "number" && value.length > schema.maxLength) errors.push(`${path}: longer than maxLength ${schema.maxLength}`);
  }
  if (typeof value === "number") {
    if (typeof schema.minimum === "number" && value < schema.minimum) errors.push(`${path}: ${value} < minimum ${schema.minimum}`);
    if (typeof schema.maximum === "number" && value > schema.maximum) errors.push(`${path}: ${value} > maximum ${schema.maximum}`);
  }
  if (Array.isArray(value)) {
    if (typeof schema.minItems === "number" && value.length < schema.minItems) errors.push(`${path}: fewer than minItems ${schema.minItems}`);
    if (schema.items) value.forEach((v, i) => validateSchema(v, schema.items, `${path}[${i}]`, errors));
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const req of schema.required ?? []) {
      if (!(req in (value as object))) errors.push(`${path}: missing required property “${req}”`);
    }
    if (schema.properties) {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (schema.properties[k]) validateSchema(v, schema.properties[k], path ? `${path}.${k}` : k, errors);
      }
    }
  }
}

export const JsonSchemaValidatorTool: ComponentType = () => {
  const [dataText, setDataText] = useState("");
  const [schemaText, setSchemaText] = useState("");
  const result = useMemo(() => {
    if (!dataText.trim() || !schemaText.trim()) return null;
    try {
      const data = JSON.parse(dataText);
      const schema = JSON.parse(schemaText);
      const errors: string[] = [];
      validateSchema(data, schema, "$", errors);
      return { valid: errors.length === 0, errors, error: null as string | null };
    } catch (e) {
      return { valid: false, errors: [], error: e instanceof Error ? e.message : String(e) };
    }
  }, [dataText, schemaText]);
  return (
    <ToolLayout>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="label">JSON data</span>
          <textarea className="textarea" rows={10} value={dataText} onChange={(e) => setDataText(e.target.value)} placeholder='{"name": "pdf-merge", "pages": 3}' spellCheck={false} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="label">JSON Schema</span>
          <textarea className="textarea" rows={10} value={schemaText} onChange={(e) => setSchemaText(e.target.value)} placeholder={'{\n  "type": "object",\n  "required": ["name"],\n  "properties": {\n    "name": {"type": "string"},\n    "pages": {"type": "number", "minimum": 1}\n  }\n}'} spellCheck={false} />
        </div>
      </div>
      {result?.error && <Note kind="error">{result.error}</Note>}
      {result && !result.error && (result.valid
        ? <Note>✓ The data matches the schema.</Note>
        : (
          <div className="card border-danger/40 p-3.5">
            <div className="text-sm text-danger font-medium mb-2">{result.errors.length} validation error{result.errors.length === 1 ? "" : "s"}:</div>
            <ul className="list-disc pl-5 text-[13px] text-ink-muted space-y-1 font-mono">
              {result.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        ))}
      <Note>Supports a practical subset of JSON Schema: type, required, properties, items, enum, pattern, min/max constraints.</Note>
    </ToolLayout>
  );
};

// ── JSONPath tester ──
function evalJsonPath(expr: string, data: unknown): unknown[] {
  const results: unknown[] = [];
  const clean = expr.trim().replace(/^\$\.?/, "");
  if (!clean) return [data];
  const tokens = clean.match(/\.\.|(?:^)\.|\[|\]|"[^"]*"|'[^']*'|\*|\d+|[^\[\].]+/g) ?? [];
  type Step = { op: "child" | "index" | "wild" | "recurse"; name?: string; index?: number };
  const steps: Step[] = [];
  let childNext = true;
  for (const t of tokens) {
    if (t === "..") { steps.push({ op: "recurse" }); childNext = true; continue; }
    if (t === "." || t === "[") { childNext = true; continue; }
    if (t === "]") continue;
    if (t === "*") { steps.push({ op: "wild" }); childNext = false; continue; }
    if (/^\d+$/.test(t)) { steps.push({ op: "index", index: parseInt(t, 10) }); childNext = false; continue; }
    const name = t.replace(/^["']|["']$/g, "");
    steps.push({ op: "child", name });
    childNext = false;
  }
  let current: unknown[] = [data];
  const byName = (v: unknown, name: string): unknown => (v && typeof v === "object" ? (v as Record<string, unknown>)[name] : undefined);
  const collect = (v: unknown, out: unknown[]) => {
    if (v && typeof v === "object") {
      if (Array.isArray(v)) v.forEach((x) => collect(x, out));
      else Object.values(v as object).forEach((x) => collect(x, out));
    }
  };
  void childNext;
  for (const step of steps) {
    const next: unknown[] = [];
    if (step.op === "child") {
      for (const v of current) {
        if (v && typeof v === "object" && step.name && step.name in (v as object)) next.push(byName(v, step.name));
      }
    } else if (step.op === "index") {
      for (const v of current) if (Array.isArray(v) && step.index !== undefined) next.push(v[step.index]);
    } else if (step.op === "wild") {
      for (const v of current) {
        if (Array.isArray(v)) next.push(...v);
        else if (v && typeof v === "object") next.push(...Object.values(v as object));
      }
    } else if (step.op === "recurse") {
      for (const v of current) {
        next.push(v);
        collect(v, next);
      }
    }
    current = next;
  }
  results.push(...current);
  return results;
}

export const JsonPathTool: ComponentType = () => {
  const [text, setText] = useState("");
  const [expr, setExpr] = useState("$.stats.tools");
  const parsed = useParsedJson(text);
  const results = useMemo(() => {
    if (parsed.error || parsed.value === undefined || !expr.trim()) return null;
    try {
      return { matches: evalJsonPath(expr, parsed.value), error: null as string | null };
    } catch (e) {
      return { matches: [], error: e instanceof Error ? e.message : String(e) };
    }
  }, [expr, parsed]);
  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} output={results ? JSON.stringify(results.matches, null, 2) : ""} error={results?.error ?? parsed.error} sample={JSON_SAMPLE} rows={8} filename="matches.json"
        options={
          <OptionsBar>
            <Field label="JSONPath expression">
              <input className="input !w-72 font-mono" value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="$.categories[*]" />
            </Field>
            {results && <span className="text-xs text-ink-dim self-center ml-auto">{results.matches.length} match{results.matches.length === 1 ? "" : "es"}</span>}
          </OptionsBar>
        } />
      <Note>Supported syntax: <code className="font-mono">$.a.b</code>, array indexes <code className="font-mono">$[0]</code>, wildcards <code className="font-mono">[*]</code> / <code className="font-mono">.*</code>, and recursive descent <code className="font-mono">..</code>. Filters and scripts are not supported.</Note>
    </ToolLayout>
  );
};

// ── Markdown table generators ──
function mdTable(rows: string[][], aligns: ("none" | "left" | "center" | "right")[]): string {
  const cols = Math.max(...rows.map((r) => r.length), 1);
  const alignMark = (a: string) => (a === "left" ? ":--" : a === "center" ? ":-:" : a === "right" ? "--:" : "---");
  const esc = (s: string) => s.replace(/\|/g, "\\|");
  const lines: string[] = [];
  const header = rows[0] ?? [];
  lines.push(`| ${Array.from({ length: cols }, (_, i) => esc(header[i] ?? "")).join(" | ")} |`);
  lines.push(`| ${Array.from({ length: cols }, (_, i) => alignMark(aligns[i] ?? "none")).join(" | ")} |`);
  for (let r = 1; r < rows.length; r++) {
    lines.push(`| ${Array.from({ length: cols }, (_, i) => esc(rows[r][i] ?? "")).join(" | ")} |`);
  }
  return lines.join("\n");
}
function parseCsvToRows(text: string): string[][] {
  const res = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true });
  return res.data as string[][];
}

export const MarkdownTableTool: ComponentType = () => {
  const [csvText, setCsvText] = useState("Tool,Category,Local\nMerge PDF,pdf,yes\nWord Counter,text,yes");
  const [header, setHeader] = useState(true);
  const rows = useMemo(() => {
    const raw = parseCsvToRows(csvText);
    return header ? raw : [["Column 1", "Column 2", "Column 3"], ...raw];
  }, [csvText, header]);
  const out = useMemo(() => mdTable(rows, ["none", "none", "none"]), [rows]);
  return (
    <ToolLayout>
      <EditorPane value={csvText} onChange={setCsvText} output={out} inputLabel="Rows (CSV, first row = header)" rows={8} filename="table.md"
        options={<OptionsBar><Toggle label="First row is the header" checked={header} onChange={setHeader} /></OptionsBar>} />
    </ToolLayout>
  );
};

export const MarkdownTableBuilderTool: ComponentType = () => {
  const [rows, setRows] = useState<string[][]>([
    ["Feature", "LocalToolBox", "Others"],
    ["Runs offline", "yes", "rarely"],
    ["No account", "yes", "no"],
  ]);
  const [aligns, setAligns] = useState<("none" | "left" | "center" | "right")[]>(["none", "none", "none"]);
  const [imported, setImported] = useState("");

  const setCell = (r: number, c: number, v: string) => {
    setRows((old) => old.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? v : cell)) : row)));
  };
  const addRow = () => setRows((old) => [...old, new Array(old[0].length).fill("")]);
  const addCol = () => {
    setRows((old) => old.map((r) => [...r, ""]));
    setAligns((a) => [...a, "none"]);
  };
  const out = mdTable(rows, aligns);

  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <div className="card overflow-x-auto p-3">
          <table className="text-[13px]">
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="p-1">
                      <input
                        className={`input !w-40 ${ri === 0 ? "font-semibold" : ""}`}
                        value={cell}
                        aria-label={`Cell ${ri + 1},${ci + 1}`}
                        onChange={(e) => setCell(ri, ci, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="p-1">
                    {rows.length > 2 && (
                      <button className="btn-ghost !px-2 !py-1" aria-label="Remove row"
                        onClick={() => setRows((old) => old.filter((_, i) => i !== ri))}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
              <tr>
                {rows[0].map((_, ci) => (
                  <td key={ci} className="p-1">
                    <select className="select !w-40" value={aligns[ci] ?? "none"}
                      onChange={(e) => setAligns((a) => a.map((x, i) => (i === ci ? e.target.value as typeof x : x)))}
                      aria-label={`Column ${ci + 1} alignment`}>
                      <option value="none">no align</option>
                      <option value="left">left</option>
                      <option value="center">center</option>
                      <option value="right">right</option>
                    </select>
                  </td>
                ))}
                <td />
              </tr>
            </tbody>
          </table>
          <div className="flex gap-2 mt-2">
            <button className="btn-ghost !py-1 !px-2 text-xs" onClick={addRow}>+ Row</button>
            <button className="btn-ghost !py-1 !px-2 text-xs" onClick={addCol}>+ Column</button>
          </div>
        </div>
        <div className="card p-3 flex flex-col gap-2">
          <span className="label">Import CSV</span>
          <textarea className="textarea" rows={3} value={imported} placeholder="Paste CSV here, then press Import…" onChange={(e) => setImported(e.target.value)} />
          <div>
            <button className="btn-primary !py-1 !px-3 text-xs" onClick={() => {
              const parsed = parseCsvToRows(imported);
              if (parsed.length) {
                setRows(parsed);
                setAligns(new Array(parsed[0].length).fill("none"));
              }
            }}>Import</button>
          </div>
        </div>
        <OutputArea text={out} filename="table.md" rows={8} label="Markdown table" />
      </div>
    </ToolLayout>
  );
};
