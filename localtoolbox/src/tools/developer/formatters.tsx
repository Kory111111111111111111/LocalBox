// Formatter / minifier / code-converter tools.
import { useMemo, useState, type ComponentType } from "react";
import { format as formatSql } from "sql-formatter";
import { marked } from "marked";
import DOMPurify from "dompurify";
import ToolLayout from "../../components/ToolLayout";
import EditorPane from "../../components/EditorPane";
import { transformTool } from "../text/kit";
import { diffLines } from "../../lib/diff";

// ── XML formatter ──
function prettyXml(xml: string, indent = 2): string {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("Invalid XML: " + (doc.querySelector("parsererror")?.textContent ?? "parse error").slice(0, 200));
  }
  const ser = (node: Element, depth: number): string => {
    const pad = " ".repeat(indent * depth);
    const attrs = Array.from(node.attributes).map((a) => ` ${a.name}="${a.value}"`).join("");
    const children = Array.from(node.childNodes).filter((n) => !(n.nodeType === 3 && !n.textContent?.trim()));
    if (children.length === 0) {
      const text = node.textContent?.trim();
      return text !== undefined && text !== "" ? `${pad}<${node.tagName}${attrs}>${escapeXmlText(text)}</${node.tagName}>` : `${pad}<${node.tagName}${attrs}/>`;
    }
    const onlyText = children.length === 1 && children[0].nodeType === 3;
    if (onlyText) return `${pad}<${node.tagName}${attrs}>${escapeXmlText(node.textContent?.trim() ?? "")}</${node.tagName}>`;
    const inner = children.map((c) => (c.nodeType === 1 ? ser(c as Element, depth + 1) : `${" ".repeat(indent * (depth + 1))}${c.textContent?.trim()}`)).filter(Boolean).join("\n");
    return `${pad}<${node.tagName}${attrs}>\n${inner}\n${pad}</${node.tagName}>`;
  };
  const kids = Array.from(doc.childNodes).filter((n) => n.nodeType === 1 || n.nodeType === 7);
  return kids.map((n) => (n.nodeType === 7 ? `<?${(n as ProcessingInstruction).target} ${(n as ProcessingInstruction).data}?>` : ser(n as Element, 0))).join("\n");
}
const escapeXmlText = (s: string) => s.replace(/&(?![a-z]+;|#\d+;)/g, "&amp;").replace(/</g, "&lt;");

export const XmlFormatterTool: ComponentType = transformTool({
  init: { indent: 2 },
  controls: () => null,
  run: (input, s) => prettyXml(input, s.indent),
  sample: '<?xml version="1.0"?><toolbox><category id="pdf">PDF Tools</category><category id="text">Text Tools</category></toolbox>',
  filename: "formatted.xml",
});

// ── HTML formatter (DOM-based) ──
function prettyHtml(html: string, indent = 2): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const walk = (node: Element, depth: number): string => {
    const pad = " ".repeat(indent * depth);
    const tag = node.tagName.toLowerCase();
    const attrs = Array.from(node.attributes).map((a) => ` ${a.name}="${a.value}"`).join("");
    if (["script", "style", "pre", "textarea"].includes(tag)) {
      return `${pad}<${tag}${attrs}>${node.innerHTML}</${tag}>`;
    }
    const children = Array.from(node.children);
    if (children.length === 0) {
      const text = node.textContent?.trim() ?? "";
      return text ? `${pad}<${tag}${attrs}>${text}</${tag}>` : `${pad}<${tag}${attrs}></${tag}>`;
    }
    const inner = children.map((c) => walk(c, depth + 1)).join("\n");
    return `${pad}<${tag}${attrs}>\n${inner}\n${pad}</${tag}>`;
  };
  const body = doc.body;
  return Array.from(body.children).map((c, i) => walk(c, 0) + (i < body.children.length - 1 ? "\n" : "")).join("\n");
}

export const HtmlFormatterTool: ComponentType = transformTool({
  init: {},
  run: (input) => prettyHtml(input),
  sample: '<!DOCTYPE html>\n<html><head><title>Hi</title></head><body><div id="app"><p>Local <b>tools</b></p><ul><li>PDF</li><li>Text</li></ul></div></body></html>',
  filename: "formatted.html",
});

// ── CSS formatter / minifier ──
function formatCss(css: string): string {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: string[] = [];
  let depth = 0;
  let buf = "";
  const flushRule = () => {
    if (!buf.trim()) return;
    const decls = buf.split(";").map((d) => d.trim()).filter(Boolean);
    for (const d of decls) out.push("  ".repeat(depth + 1) + d + ";");
    buf = "";
  };
  for (const ch of stripped) {
    if (ch === "{") {
      out.push("  ".repeat(depth) + buf.trim().replace(/\s+/g, " ") + " {");
      buf = "";
      depth++;
    } else if (ch === "}") {
      flushRule();
      depth = Math.max(0, depth - 1);
      out.push("  ".repeat(depth) + "}");
    } else if (ch === ";") {
      flushRule();
    } else {
      buf += ch;
    }
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}
function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>~+])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

export const CssFormatterTool: ComponentType = transformTool({
  init: { mode: "format" as string },
  controls: () => null,
  run: (input, s) => (s.mode === "format" ? formatCss(input) : minifyCss(input)),
  sample: ".card{background:#141b2d;border:1px solid #2a3548;border-radius:10px}/* calm card */\n.card:hover{background:#1a2336}",
  filename: "styles.css",
});
export const MinifyCssTool: ComponentType = transformTool({
  init: {},
  run: (input) => minifyCss(input),
  sample: ".card {\n  /* calm card */\n  background: #141b2d;\n  border: 1px solid #2a3548;\n}\n.card:hover { background: #1a2336; }",
  filename: "styles.min.css",
});

// ── JS formatter & minifier (conservative, string/comment aware) ──
function stripJsComments(code: string): string {
  let out = "";
  let i = 0;
  let mode: "code" | "line" | "block" | "squote" | "dquote" | "template" = "code";
  let prev = "";
  while (i < code.length) {
    const ch = code[i];
    const next = code[i + 1] ?? "";
    if (mode === "code") {
      if (ch === "/" && next === "/") { mode = "line"; i += 2; continue; }
      if (ch === "/" && next === "*") { mode = "block"; i += 2; continue; }
      if (ch === "'") { mode = "squote"; out += ch; i++; continue; }
      if (ch === '"') { mode = "dquote"; out += ch; i++; continue; }
      if (ch === "`") { mode = "template"; out += ch; i++; continue; }
      out += ch;
    } else if (mode === "line") {
      if (ch === "\n") { mode = "code"; out += "\n"; }
    } else if (mode === "block") {
      if (ch === "*" && next === "/") { mode = "code"; i += 2; out += " "; continue; }
    } else {
      out += ch;
      if (mode === "squote" && ch === "'" && prev !== "\\") mode = "code";
      if (mode === "dquote" && ch === '"' && prev !== "\\") mode = "code";
      if (mode === "template" && ch === "`" && prev !== "\\") mode = "code";
    }
    prev = ch;
    i++;
  }
  return out;
}
function formatJs(code: string): string {
  const noComments = stripJsComments(code);
  const lines = noComments.split("\n").map((l) => l.trim()).filter((l) => l !== "");
  let depth = 0;
  const out: string[] = [];
  for (const line of lines) {
    const opens = (line.match(/[{[(]/g) ?? []).length;
    const closes = (line.match(/[}\])]/g) ?? []).length;
    // special-case lines that open & close equally but end with { or start with }
    const opensBraces = (line.match(/\{/g) ?? []).length;
    const closesBraces = (line.match(/\}/g) ?? []).length;
    if (/^[}\])]/.test(line)) depth = Math.max(0, depth - 1);
    out.push("  ".repeat(depth) + line);
    const net = opensBraces - closesBraces;
    if (net > 0) depth += net;
    else if (net < 0) depth = Math.max(0, depth + net);
    void opens; void closes;
  }
  return out.join("\n");
}
function minifyJs(code: string): string {
  // Conservative: strip comments + leading/trailing whitespace per line and
  // collapse blank lines. Not as small as a real minifier, but always safe.
  return stripJsComments(code)
    .split("\n")
    .map((l) => l.trim())
    .filter((l, i, arr) => !(l === "" && (i === 0 || arr[i - 1] === "")))
    .join("\n");
}

export const JsFormatterTool: ComponentType = transformTool({
  init: {},
  run: (input) => formatJs(input),
  sample: "function add(a, b) {\n  // sum two numbers\n  return a + b;\n}\nconst list = [1, 2, 3].map(n => {\n  return n * 2;\n});",
  filename: "formatted.js",
});
export const MinifyJsTool: ComponentType = transformTool({
  init: {},
  run: (input) => minifyJs(input),
  sample: "function add(a, b) {\n  // sum two numbers\n  return a + b;\n}",
  filename: "script.min.js",
});

// ── HTML minifier ──
export const MinifyHtmlTool: ComponentType = transformTool({
  init: { keepComments: false },
  run: (input, s) => {
    let out = input;
    if (!s.keepComments) out = out.replace(/<!--(?!\[if)[\s\S]*?-->/g, "");
    return out
      .replace(/>\s+</g, "><")
      .replace(/\s{2,}/g, " ")
      .trim();
  },
  sample: "<div>\n  <p>   Local   tools   </p>\n  <!-- a comment -->\n</div>",
  filename: "index.min.html",
});

// ── SQL formatter ──
export const SqlFormatterTool: ComponentType = transformTool({
  init: { language: "sql" as string },
  controls: () => null,
  run: (input, s) => formatSql(input, { language: s.language as never }),
  sample: "select u.id, u.name, count(o.id) as orders from users u left join orders o on o.user_id = u.id where u.active = true group by u.id, u.name order by orders desc limit 10;",
  filename: "query.sql",
});

// ── GraphQL formatter (brace indenter) ──
export const GraphqlFormatterTool: ComponentType = transformTool({
  init: {},
  run: (input) => {
    const cleaned = stripJsComments(input);
    const lines: string[] = [];
    let depth = 0;
    for (const raw of cleaned.split("\n")) {
      let line = raw.trim();
      if (!line) { lines.push(""); continue; }
      if (/^[})]/.test(line) || line === "}") depth = Math.max(0, depth - 1);
      lines.push("  ".repeat(depth) + line);
      const opens = (line.match(/{/g) ?? []).length;
      const closes = (line.match(/}/g) ?? []).length;
      if (/[{(]$/.test(line) || opens > closes) depth += opens - closes;
    }
    return lines.join("\n").replace(/\n{3,}/g, "\n\n");
  },
  sample: "query Toolbox($slug: String!) { tool(slug: $slug) { id name category tags needsNetwork } }",
  filename: "query.graphql",
});

// ── Markdown -> HTML ──
export const MarkdownToHtmlTool: ComponentType = transformTool({
  init: { sanitize: true },
  controls: () => null,
  run: (input, s) => {
    const html = marked.parse(input, { async: false }) as string;
    return s.sanitize ? DOMPurify.sanitize(html) : html;
  },
  sample: "# LocalToolBox\n\n**Private** by default. Try `code`, [links](/), and lists:\n\n- runs locally\n- no account",
  filename: "converted.html",
  mime: "text/html",
});

// ── HTML -> Markdown ──
export const HtmlToMarkdownTool: ComponentType = transformTool({
  init: {},
  run: (input) => {
    const doc = new DOMParser().parseFromString(input, "text/html");
    const walk = (node: Node): string => {
      if (node.nodeType === 3) return node.textContent ?? "";
      if (node.nodeType !== 1) return "";
      const el = node as Element;
      const kids = () => Array.from(el.childNodes).map(walk).join("");
      switch (el.tagName.toLowerCase()) {
        case "h1": return `# ${el.textContent?.trim()}\n\n`;
        case "h2": return `## ${el.textContent?.trim()}\n\n`;
        case "h3": return `### ${el.textContent?.trim()}\n\n`;
        case "h4": case "h5": case "h6": return `#### ${el.textContent?.trim()}\n\n`;
        case "p": return `${kids().trim()}\n\n`;
        case "br": return "\n";
        case "hr": return "---\n\n";
        case "strong": case "b": return `**${kids()}**`;
        case "em": case "i": return `*${kids()}*`;
        case "code": return el.closest("pre") ? kids() : `\`${kids()}\``;
        case "pre": return `\`\`\`\n${el.textContent ?? ""}\n\`\`\`\n\n`;
        case "a": return `[${kids()}](${(el as HTMLAnchorElement).getAttribute("href") ?? ""})`;
        case "img": return `![${el.getAttribute("alt") ?? ""}](${el.getAttribute("src") ?? ""})`;
        case "ul": return Array.from(el.children).map((li) => `- ${walk(li).trim()}`).join("\n") + "\n\n";
        case "ol": return Array.from(el.children).map((li, i) => `${i + 1}. ${walk(li).trim()}`).join("\n") + "\n\n";
        case "li": return kids();
        case "blockquote": return (el.textContent ?? "").split("\n").map((l) => `> ${l}`).join("\n") + "\n\n";
        case "table": {
          const rows = Array.from(el.querySelectorAll("tr"));
          if (rows.length === 0) return "";
          const cellsOf = (tr: Element) => Array.from(tr.querySelectorAll("th,td")).map((c) => c.textContent?.trim() ?? "");
          const head = cellsOf(rows[0]);
          const lines = [`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`];
          for (let i = 1; i < rows.length; i++) lines.push(`| ${cellsOf(rows[i]).join(" | ")} |`);
          return lines.join("\n") + "\n\n";
        }
        default: return kids();
      }
    };
    return Array.from(doc.body.childNodes).map(walk).join("").replace(/\n{3,}/g, "\n\n").trim();
  },
  sample: '<h1>LocalToolBox</h1>\n<p><b>Private</b> by default with <a href="/tools">316 tools</a>.</p>\n<ul><li>runs locally</li><li>no account</li></ul>',
  filename: "converted.md",
});

// ── Diff checker ──
export const DiffCheckerTool: ComponentType = () => {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const diff = useMemo(() => (a || b ? diffLines(a, b) : []), [a, b]);
  const added = diff.filter((d) => d.type === "add").length;
  const removed = diff.filter((d) => d.type === "del").length;
  return (
    <ToolLayout>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="label">Original</span>
          <textarea className="textarea" rows={12} value={a} onChange={(e) => setA(e.target.value)} placeholder="Paste the original file…" spellCheck={false} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="label">Changed</span>
          <textarea className="textarea" rows={12} value={b} onChange={(e) => setB(e.target.value)} placeholder="Paste the changed file…" spellCheck={false} />
        </div>
      </div>
      <div className="card overflow-hidden font-mono text-[13px]">
        <div className="flex items-center gap-3 px-3 py-2 border-b border-border text-xs">
          <span className="text-ink-dim">Side-by-side changes</span>
          <span className="text-success">+{added}</span>
          <span className="text-danger">−{removed}</span>
        </div>
        <div className="max-h-[32rem] overflow-auto">
          {diff.map((d, i) => (
            <div key={i} className={`px-3 py-0.5 whitespace-pre-wrap ${d.type === "add" ? "bg-success/10 text-success" : d.type === "del" ? "bg-danger/10 text-danger" : "text-ink-dim"}`}>
              {d.type === "add" ? "+ " : d.type === "del" ? "− " : "  "}{d.text || " "}
            </div>
          ))}
          {diff.length === 0 && <div className="px-3 py-6 text-sm text-ink-dim text-center">Paste two versions of any text or code to compare.</div>}
        </div>
      </div>
    </ToolLayout>
  );
};

// ── SVG optimizer ──
export const SvgOptimizerTool: ComponentType = transformTool({
  init: { removeMetadata: true, removeComments: true },
  controls: () => null,
  run: (input, s) => {
    let svg = input;
    if (s.removeComments) svg = svg.replace(/<!--[\s\S]*?-->/g, "");
    if (s.removeMetadata) {
      svg = svg.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
      svg = svg.replace(/<title>[\s\S]*?<\/title>/gi, "");
      svg = svg.replace(/<desc[\s\S]*?<\/desc>/gi, "");
      svg = svg.replace(/\s(?:sodipodi|inkscape):[^=]*="[^"]*"/g, "");
      svg = svg.replace(/\sxmlns:(?:sodipodi|inkscape)="[^"]*"/g, "");
    }
    svg = svg.replace(/<g(\s[^>]*)?>\s*<\/g>/g, "");
    svg = svg.replace(/>\s+</g, "><").replace(/\s{2,}/g, " ").trim();
    return svg;
  },
  sample: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- layers --><metadata>made with an editor</metadata><g></g><path d="M12 2 22 12 12 22 2 12Z" fill="#3b82f6"/></svg>',
  filename: "optimized.svg",
  mime: "image/svg+xml",
});
