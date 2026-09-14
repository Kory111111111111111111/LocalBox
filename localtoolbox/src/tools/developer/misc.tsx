// Misc developer tools: HTML viewer, HTTP status reference, gitignore generator,
// git commit builder, cron parser, regex tester & library.
import { useMemo, useState, type ComponentType } from "react";
import ToolLayout from "../../components/ToolLayout";
import EditorPane from "../../components/EditorPane";
import { CopyButton, Note, OptionsBar, OutputArea, SelField, Toggle } from "../../components/ui";

// ── HTML viewer ──
export const HtmlViewerTool: ComponentType = () => {
  const [code, setCode] = useState("<div style=\"font-family: system-ui; padding: 2rem; text-align: center\">\n  <h1>Hello from your own HTML</h1>\n  <p>Edit the code on the left — this sandbox updates live.</p>\n</div>");
  const [allowScripts, setAllowScripts] = useState(false);
  const sandboxAttr = allowScripts ? "allow-scripts" : "";
  return (
    <ToolLayout>
      <EditorPane value={code} onChange={setCode} inputLabel="HTML" outputLabel="Rendered preview" rows={12} filename="preview.html"
        options={<OptionsBar><Toggle label="Allow scripts (sandboxed)" checked={allowScripts} onChange={setAllowScripts} /></OptionsBar>}
        outputNode={
          <iframe
            title="HTML preview"
            className="card w-full min-h-80 bg-white"
            sandbox={sandboxAttr}
            srcDoc={code}
          />
        } />
      <Note>The preview runs in a sandboxed iframe — no network access to your files, and scripts stay off unless you enable them.</Note>
    </ToolLayout>
  );
};

// ── HTTP status reference ──
const HTTP_CODES: [number, string, string][] = [
  [100, "Continue", "Client should continue with the request body."],
  [101, "Switching Protocols", "Server is switching protocols (e.g. to WebSocket)."],
  [103, "Early Hints", "Preliminary headers before the final response."],
  [200, "OK", "The request succeeded."],
  [201, "Created", "A new resource was created."],
  [202, "Accepted", "Queued for processing, not complete yet."],
  [204, "No Content", "Success with empty body."],
  [206, "Partial Content", "Partial resource delivered (range requests)."],
  [301, "Moved Permanently", "Resource has a new permanent URL."],
  [302, "Found", "Temporary redirect (method may change)."],
  [303, "See Other", "Redirect with GET to another URL."],
  [304, "Not Modified", "Caching hit — body not resent."],
  [307, "Temporary Redirect", "Temporary redirect preserving method."],
  [308, "Permanent Redirect", "Permanent redirect preserving method."],
  [400, "Bad Request", "Malformed syntax the server won't process."],
  [401, "Unauthorized", "Authentication missing or invalid."],
  [402, "Payment Required", "Reserved for future use."],
  [403, "Forbidden", "Server refuses to authorize the client."],
  [404, "Not Found", "No resource at this URL."],
  [405, "Method Not Allowed", "HTTP method not supported by the resource."],
  [406, "Not Acceptable", "No content matching Accept headers."],
  [408, "Request Timeout", "Client took too long to send."],
  [409, "Conflict", "Request conflicts with current state."],
  [410, "Gone", "Resource permanently removed."],
  [411, "Length Required", "Content-Length header missing."],
  [412, "Precondition Failed", "If-* headers didn't match."],
  [413, "Content Too Large", "Payload exceeds server limits."],
  [415, "Unsupported Media Type", "Format not supported."],
  [418, "I'm a teapot", "RFC 2324 joke status — refused to brew coffee."],
  [422, "Unprocessable Content", "Semantic errors (validation failures)."],
  [425, "Too Early", "Replay risk — retry later."],
  [428, "Precondition Required", "Send conditional request first."],
  [429, "Too Many Requests", "Rate limited."],
  [431, "Request Header Fields Too Large", "Headers too big; shrink them."],
  [451, "Unavailable For Legal Reasons", "Blocked for legal causes."],
  [500, "Internal Server Error", "Server-side failure."],
  [501, "Not Implemented", "Server lacks the ability to fulfill."],
  [502, "Bad Gateway", "Upstream returned an invalid response."],
  [503, "Service Unavailable", "Temporarily overloaded or down."],
  [504, "Gateway Timeout", "Upstream didn't answer in time."],
  [505, "HTTP Version Not Supported", "Protocol version refused."],
  [507, "Insufficient Storage", "Out of space to complete."],
  [511, "Network Authentication Required", "Captive portal login needed."],
];
export const HttpStatusTool: ComponentType = () => {
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("all");
  const list = HTTP_CODES.filter(([code, name, desc]) => {
    if (cls !== "all") {
      const c = Math.floor(code / 100) * 100;
      if (String(c) !== cls) return false;
    }
    const s = `${code} ${name} ${desc}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });
  const colorFor = (code: number) => (code < 300 ? "text-success" : code < 400 ? "text-info" : code < 500 ? "text-warning" : "text-danger");
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <input className="input max-w-xs" placeholder="Search code or meaning…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search status codes" />
          <SelField label="Class" value={cls} onChange={setCls} options={[
            { value: "all", label: "All" }, { value: "100", label: "1xx Informational" }, { value: "200", label: "2xx Success" },
            { value: "300", label: "3xx Redirection" }, { value: "400", label: "4xx Client error" }, { value: "500", label: "5xx Server error" },
          ]} />
          <span className="text-xs text-ink-dim self-center ml-auto">{list.length} codes</span>
        </OptionsBar>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {list.map(([code, name, desc]) => (
            <div key={code} className="card p-3 flex gap-3">
              <span className={`font-mono text-lg font-semibold ${colorFor(code)} tabular-nums`}>{code}</span>
              <div>
                <div className="text-sm font-medium">{name}</div>
                <div className="text-xs text-ink-muted mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
};

// ── .gitignore generator ──
const GITIGNORE_TEMPLATES: Record<string, string[]> = {
  Node: ["node_modules/", "dist/", "build/", "npm-debug.log*", ".npm", ".DS_Store", "*.log"],
  React: ["node_modules/", "build/", "dist/", ".env*", "npm-debug.log*", ".DS_Store", "coverage/"],
  Vite: ["node_modules/", "dist/", "dist-ssr/", "*.local", ".env", ".DS_Store"],
  Nextjs: ["node_modules/", ".next/", "out/", "build/", ".env*", "npm-debug.log*", ".vercel", "*.tsbuildinfo", "next-env.d.ts"],
  Python: ["__pycache__/", "*.py[cod]", "*.egg-info/", ".venv/", "venv/", "env/", ".env", "dist/", "build/", ".pytest_cache/", ".mypy_cache/", "*.sqlite3"],
  Java: ["target/", "*.class", "*.jar", "!gradle-wrapper.jar", ".gradle/", "build/", "out/", "*.hprof", ".idea/"],
  Rust: ["target/", "Cargo.lock", "**/*.rs.bk"],
  Go: ["*.exe", "*.exe~", "*.dll", "*.so", "*.dylib", "*.test", "*.out", "go.work"],
  "C/C++": ["*.o", "*.obj", "*.so", "*.a", "*.lib", "bin/", "build/", "*.exe", "*.out", "compile_commands.json", ".vscode/"],
  macOS: [".DS_Store", ".AppleDouble", ".LSOverride", "Icon ?", "._*", ".Spotlight-V100", ".Trashes", "*.swp"],
  Windows: ["Thumbs.db", "Thumbs.db:encryptable", "ehthumbs.db", "ehthumbs_vista.db", "*.stackdump", "[Dd]esktop.ini", "$RECYCLE.BIN/", "*.lnk"],
  Linux: ["*~", ".fuse_hidden*", ".directory", ".Trash-*", ".nfs*"],
  JetBrains: [".idea/", "*.iml", "out/", ".idea_modules/", "atlassian-ide-plugin.xml", "cmake-build-*/"],
  VSCode: [".vscode/*", "!.vscode/settings.json", "!.vscode/tasks.json", "!.vscode/launch.json", "!.vscode/extensions.json", "*.code-workspace"],
  Env: [".env", ".env.*", "!.env.example", "*.pem", "*.key", "!*.pem.example"],
};
export const GitignoreTool: ComponentType = () => {
  const [selected, setSelected] = useState<string[]>(["Node", "Env"]);
  const output = useMemo(() => {
    const lines = new Set<string>();
    for (const key of selected) {
      for (const line of GITIGNORE_TEMPLATES[key] ?? []) lines.add(line);
    }
    return `# Generated by LocalToolBox .gitignore generator\n${[...lines].join("\n")}\n`;
  }, [selected]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <div className="card p-3.5">
          <div className="label">Pick your stack (combines automatically)</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {Object.keys(GITIGNORE_TEMPLATES).map((name) => {
              const active = selected.includes(name);
              return (
                <button key={name} className={`chip hover:!text-ink ${active ? "!border-accent !text-accent bg-accent-muted" : ""}`}
                  onClick={() => setSelected((s) => (active ? s.filter((x) => x !== name) : [...s, name]))}>
                  {name}
                </button>
              );
            })}
          </div>
        </div>
        <OutputArea text={output} filename=".gitignore" rows={12} label=".gitignore" />
      </div>
    </ToolLayout>
  );
};

// ── Git commit message builder ──
export const GitCommitTool: ComponentType = () => {
  const [type, setType] = useState("feat");
  const [scope, setScope] = useState("");
  const [breaking, setBreaking] = useState(false);
  const [subject, setSubject] = useState("add background remover tool");
  const [body, setBody] = useState("");
  const [issue, setIssue] = useState("");
  const [emoji, setEmoji] = useState(true);
  const TYPES: [string, string, string][] = [
    ["feat", "✨", "new feature"], ["fix", "🐛", "bug fix"], ["docs", "📝", "documentation"],
    ["style", "💄", "formatting, no logic change"], ["refactor", "♻️", "code change, no behavior change"],
    ["perf", "⚡", "performance improvement"], ["test", "✅", "adding tests"],
    ["build", "📦", "build system or deps"], ["ci", "👷", "CI configuration"], ["chore", "🔧", "misc tasks"],
  ];
  const msg = useMemo(() => {
    const e = TYPES.find((t) => t[0] === type)?.[1];
    const head = `${emoji && e ? `${e} ` : ""}${type}${scope ? `(${scope})` : ""}${breaking ? "!" : ""}: ${subject}`;
    const lines = [head];
    if (body.trim()) lines.push("", body.trim());
    if (breaking) lines.push("", "BREAKING CHANGE: describe what broke and how to migrate.");
    if (issue.trim()) lines.push("", `Closes #${issue.replace("#", "")}`);
    return lines.join("\n");
  }, [type, scope, breaking, subject, body, issue, emoji]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <SelField label="Type" value={type} onChange={setType} options={TYPES.map(([v, e, d]) => ({ value: v, label: `${v} — ${d}` }))} />
          <label className="block">
            <span className="label">Scope (optional)</span>
            <input className="input !w-32" value={scope} onChange={(e) => setScope(e.target.value.replace(/[^a-z0-9-]/gi, ""))} placeholder="tools" />
          </label>
          <label className="block flex-1 min-w-56">
            <span className="label">Subject (imperative, ≤50 chars)</span>
            <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={100} />
          </label>
          <Toggle label="Breaking change" checked={breaking} onChange={setBreaking} />
          <Toggle label="Type emoji" checked={emoji} onChange={setEmoji} />
        </OptionsBar>
        <OptionsBar>
          <label className="block flex-1">
            <span className="label">Body (optional — what & why)</span>
            <textarea className="textarea !font-sans" rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Issue #</span>
            <input className="input !w-24" value={issue} onChange={(e) => setIssue(e.target.value.replace(/[^0-9]/g, ""))} placeholder="42" />
          </label>
        </OptionsBar>
        <OutputArea text={msg} filename="commit-message.txt" rows={8} label="Commit message" />
      </div>
    </ToolLayout>
  );
};

// ── Cron parser ──
const CRON_FIELD_NAMES = ["minute", "hour", "day of month", "month", "day of week"];
function describeCron(expr: string): { text: string; error?: string } {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return { text: "", error: "A cron expression has exactly 5 fields: minute hour day-of-month month day-of-week." };
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const describeField = (field: string, idx: number): string => {
    if (field === "*") return idx === 0 ? "every minute" : idx === 1 ? "every hour" : `every ${CRON_FIELD_NAMES[idx]}`;
    if (field.startsWith("*/")) return `every ${field.slice(2)} ${CRON_FIELD_NAMES[idx]}s`;
    if (field.includes("-")) {
      const [a, b] = field.split("-");
      const fmt = (n: string) => (idx === 3 ? monthNames[+n - 1] : idx === 4 ? dayNames[+n % 7] : n);
      return `${fmt(a)} through ${fmt(b)}`;
    }
    if (field.includes(",")) {
      const vals = field.split(",").map((v) => (idx === 3 ? monthNames[+v - 1] : idx === 4 ? dayNames[+v % 7] : v));
      return vals.slice(0, -1).join(", ") + " and " + vals[vals.length - 1];
    }
    return idx === 3 ? monthNames[+field - 1] : idx === 4 ? dayNames[+field % 7] : `at ${field} ${CRON_FIELD_NAMES[idx]}`;
  };
  const [m, h, dom, mon, dow] = parts.map((p, i) => describeField(p, i));
  const time = h === "every hour" ? "" : ` at ${parts[1].replace("*", "00")}:${String(parts[0] === "*" ? "00" : parts[0].padStart(2, "0"))}`;
  void time;
  return { text: `Runs ${m}, ${h}, on ${dom}, in ${mon}, ${dow}.` };
}
function nextRuns(expr: string, count = 5): Date[] {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return [];
  const parseField = (f: string, min: number, max: number): Set<number> => {
    const out = new Set<number>();
    for (const piece of f.split(",")) {
      const [range, step] = piece.split("/");
      const stepN = step ? parseInt(step, 10) : 1;
      let start = min;
      let end = max;
      if (range !== "*") {
        if (range.includes("-")) {
          const [a, b] = range.split("-").map((n) => parseInt(n, 10));
          start = a;
          end = b;
        } else {
          start = parseInt(range, 10);
          end = step ? max : start;
        }
      }
      for (let i = start; i <= end; i += stepN) out.add(i);
    }
    return out;
  };
  const mins = parseField(parts[0], 0, 59);
  const hours = parseField(parts[1], 0, 23);
  const doms = parseField(parts[2], 1, 31);
  const months = parseField(parts[3], 1, 12);
  const dows = parseField(parts[4], 0, 6);
  const out: Date[] = [];
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);
  while (out.length < count && d.getTime() < Date.now() + 366 * 86400000) {
    if (
      months.has(d.getMonth() + 1) &&
      (doms.has(d.getDate()) || dows.has(d.getDay())) &&
      hours.has(d.getHours()) &&
      mins.has(d.getMinutes())
    ) {
      if (parts[2] !== "*" && parts[4] !== "*" && !doms.has(d.getDate())) { /* standard cron OR-DOW rule simplified */ }
      out.push(new Date(d));
    }
    d.setMinutes(d.getMinutes() + 1);
  }
  return out;
}
export const CronTool: ComponentType = () => {
  const [expr, setExpr] = useState("*/15 9-17 * * 1-5");
  const desc = useMemo(() => describeCron(expr), [expr]);
  const runs = useMemo(() => (desc.error ? [] : nextRuns(expr)), [expr, desc.error]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block">
            <span className="label">Cron expression (5 fields)</span>
            <input className="input !w-72 font-mono" value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="*/15 9-17 * * 1-5" />
          </label>
          <div className="flex gap-1.5 self-end flex-wrap">
            {["* * * * *", "0 9 * * 1-5", "*/30 * * * *", "0 0 1 * *", "0 12 * * 0"].map((p) => (
              <button key={p} className="chip font-mono hover:text-ink" onClick={() => setExpr(p)}>{p}</button>
            ))}
          </div>
        </OptionsBar>
        {desc.error ? <Note kind="error">{desc.error}</Note> : (
          <>
            <div className="card p-4 text-sm">{desc.text}</div>
            <div className="card overflow-hidden">
              <div className="px-3 py-2 border-b border-border text-xs text-ink-dim">Next {runs.length} runs (your local timezone)</div>
              <ul className="divide-y divide-border-subtle text-[13px] font-mono">
                {runs.map((r, i) => <li key={i} className="px-3 py-1.5">{r.toLocaleString()}</li>)}
              </ul>
            </div>
          </>
        )}
        <div className="card p-3.5 text-xs text-ink-dim leading-relaxed">
          <span className="font-mono text-ink-muted">m h dom mon dow</span> — minute (0–59), hour (0–23), day of month (1–31), month (1–12), day of week (0–6, Sunday = 0). Supports <span className="font-mono">*</span>, lists <span className="font-mono">1,15</span>, ranges <span className="font-mono">9-17</span>, and steps <span className="font-mono">*/15</span>.
        </div>
      </div>
    </ToolLayout>
  );
};

// ── Regex tester ──
export const RegexTesterTool: ComponentType = () => {
  const [pattern, setPattern] = useState("\\b(\\w+)@(\\w+\\.\\w+)\\b");
  const [flags, setFlags] = useState("gi");
  const [text, setText] = useState("Email alice@example.com or bob@mail.co for details.");
  const { matches, error } = useMemo(() => {
    if (!pattern) return { matches: [], error: null as string | null };
    try {
      const re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
      const out: { text: string; index: number; groups: string[] }[] = [];
      let m: RegExpExecArray | null;
      let guard = 0;
      while ((m = re.exec(text)) !== null && guard++ < 1000) {
        out.push({ text: m[0], index: m.index, groups: m.slice(1).map((g) => g ?? "—") });
        if (m.index === re.lastIndex) re.lastIndex++;
      }
      return { matches: out, error: null };
    } catch (e) {
      return { matches: [], error: e instanceof Error ? e.message : String(e) };
    }
  }, [pattern, flags, text]);

  const highlighted = useMemo(() => {
    if (error || matches.length === 0) return [{ text, hit: false }];
    const out: { text: string; hit: boolean }[] = [];
    let pos = 0;
    for (const m of matches) {
      if (m.index > pos) out.push({ text: text.slice(pos, m.index), hit: false });
      out.push({ text: m.text, hit: true });
      pos = m.index + m.text.length;
    }
    if (pos < text.length) out.push({ text: text.slice(pos), hit: false });
    return out;
  }, [matches, text, error]);

  const toggleFlag = (f: string) => setFlags((cur) => (cur.includes(f) ? cur.replace(f, "") : cur + f));

  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block flex-1 min-w-64">
            <span className="label">Pattern</span>
            <input className="input font-mono" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="\\d+" />
          </label>
          <div>
            <span className="label">Flags</span>
            <div className="flex gap-1.5">
              {["g", "i", "m", "s", "u"].map((f) => (
                <button key={f} className={`chip font-mono hover:text-ink ${flags.includes(f) ? "!border-accent !text-accent bg-accent-muted" : ""}`} onClick={() => toggleFlag(f)}>{f}</button>
              ))}
            </div>
          </div>
          <span className="text-xs text-ink-dim self-center ml-auto">{matches.length} match{matches.length === 1 ? "" : "es"}</span>
        </OptionsBar>
        {error && <Note kind="error">{error}</Note>}
        <div className="flex flex-col gap-1.5">
          <span className="label">Test text</span>
          <textarea className="textarea" rows={5} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
        </div>
        <div className="card p-3.5 font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-all">
          {highlighted.map((h, i) => h.hit ? <mark key={i} className="bg-accent/30 text-ink rounded px-0.5">{h.text}</mark> : <span key={i} className="text-ink-muted">{h.text}</span>)}
        </div>
        {matches.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-ink-dim border-b border-border">
                  <th className="px-3 py-2">#</th><th className="px-3 py-2">Match</th><th className="px-3 py-2">Position</th><th className="px-3 py-2">Groups</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-mono">
                {matches.map((m, i) => (
                  <tr key={i} className="hover:bg-surface-2">
                    <td className="px-3 py-1.5 text-ink-dim">{i + 1}</td>
                    <td className="px-3 py-1.5 text-accent">{m.text}</td>
                    <td className="px-3 py-1.5">{m.index}</td>
                    <td className="px-3 py-1.5 text-ink-muted">{m.groups.length ? m.groups.join(" | ") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

// ── Regex library ──
const REGEX_LIB: [string, string, string][] = [
  ["Email", "\\b[\\w.+-]+@[\\w-]+\\.[\\w.-]+\\b", "alice@example.com"],
  ["URL", "https?://[^\\s<>\"')\\]]+", "https://example.com/page"],
  ["IPv4 address", "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", "192.168.1.1"],
  ["IPv6 (simple)", "([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
  ["Date (YYYY-MM-DD)", "\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])", "2026-09-14"],
  ["Time (HH:MM 24h)", "([01]\\d|2[0-3]):[0-5]\\d", "23:59"],
  ["Hex color", "#(?:[0-9a-fA-F]{3}){1,2}\\b", "#3b82f6"],
  ["Phone (US)", "\\(?\\d{3}\\)?[ .-]\\d{3}[ .-]\\d{4}", "(555) 123-4567"],
  ["Password (8+, upper, lower, digit)", "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$", "Tr0ub4dor"],
  ["Username (letters, digits, 3-16)", "^[a-zA-Z0-9_]{3,16}$", "local_tools"],
  ["Slug", "^[a-z0-9]+(?:-[a-z0-9]+)*$", "merge-pdf"],
  ["HTML tag", "</?[a-z][^>]*>", "<div class='x'>"],
  ["HTML comment", "<!--[\\s\\S]*?-->", "<!-- note -->"],
  ["Digits only", "^\\d+$", "316"],
  ["Decimal number", "-?\\d+(?:\\.\\d+)?", "-42.5"],
  ["Scientific notation", "-?\\d+(?:\\.\\d+)?[eE][+-]?\\d+", "1.6e-19"],
  ["Whitespace runs", "\\s+", "a    b"],
  ["Duplicate words", "\\b(\\w+)\\s+\\1\\b", "the the"],
  ["Trailing spaces", "[ \\t]+$", "line   "],
  ["Credit card (16 digits)", "\\b(?:\\d[ -]?){15}\\d\\b", "4111 1111 1111 1111"],
  ["UUID v4", "[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}", "9f2c1a7e-5d3b-4c8a-9e1f-2a3b4c5d6e7f"],
  ["JWT", "eyJ[\\w-]+\\.[\\w-]+\\.[\\w-]+", "eyJhbGciOi…"],
  ["Hashtag", "#\\w+", "#localtoolbox"],
  ["Mention", "@\\w+", "@alice"],
  ["Markdown image", "!\\[[^\\]]*\\]\\([^)]+\\)", "![alt](pic.png)"],
  ["Semver", "\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?", "0.1.0-beta.2"],
  ["Postal code (basic)", "\\b\\d{5}(?:-\\d{4})?\\b", "94107-1234"],
  ["CSS hex shorthand", "#[0-9a-fA-F]{3}\\b", "#fff"],
];
export const RegexLibraryTool: ComponentType = () => {  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(0);
  const [text, setText] = useState("Contact alice@example.com about order #316 shipped to 94107!");
  const list = REGEX_LIB.filter(([name, , sample]) => (name + sample).toLowerCase().includes(q.toLowerCase()));
  const entry = list[Math.min(selected, list.length - 1)] ?? REGEX_LIB[0];
  const matches = useMemo(() => {
    try {
      return [...text.matchAll(new RegExp(entry[1], "g"))].map((m) => m[0]);
    } catch {
      return [];
    }
  }, [entry, text]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <input className="input max-w-sm" placeholder="Search the library…" value={q} onChange={(e) => { setQ(e.target.value); setSelected(0); }} aria-label="Search regex library" />
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card overflow-hidden">
            <div className="max-h-96 overflow-auto divide-y divide-border-subtle">
              {list.map(([name, pattern], i) => (
                <button key={name} className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-2 ${i === selected ? "bg-surface-2" : ""}`} onClick={() => setSelected(i)}>
                  <div>{name}</div>
                  <code className="font-mono text-[11px] text-accent break-all">{pattern}</code>
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="card p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="label !mb-0">Pattern</span>
                <CopyButton text={entry[1]} />
              </div>
              <code className="font-mono text-[13px] text-accent break-all">{entry[1]}</code>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="label">Try it on your text</span>
              <textarea className="textarea" rows={4} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
            </div>
            <div className="card p-3">
              <div className="label">{matches.length} match{matches.length === 1 ? "" : "es"}</div>
              <div className="flex flex-wrap gap-1.5 font-mono text-[13px]">
                {matches.length === 0 && <span className="text-ink-dim text-[13px]">No matches in the sample text.</span>}
                {matches.map((m, i) => <span key={i} className="chip !text-accent !border-accent/40 font-mono">{m}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};
