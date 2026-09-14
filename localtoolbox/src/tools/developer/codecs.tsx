// Codec tools: Base64, Base32, URL, HTML entities, JWT decoding.
import { useMemo, useState, type ComponentType } from "react";
import ToolLayout from "../../components/ToolLayout";
import EditorPane from "../../components/EditorPane";
import { Note, OptionsBar, OutputArea, SelField, Toggle } from "../../components/ui";

// unicode-safe base64
function b64encode(text: string, urlSafe = false): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  let out = btoa(bin);
  if (urlSafe) out = out.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return out;
}
function b64decode(text: string): string {
  let t = text.trim().replace(/-/g, "+").replace(/_/g, "/");
  while (t.length % 4) t += "=";
  const bin = atob(t);
  const bytes = new Uint8Array([...bin].map((c) => c.charCodeAt(0)));
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

// base32 RFC 4648
const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function b32encode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 31];
  while (out.length % 8) out += "=";
  return out;
}
function b32decode(text: string): string {
  const clean = text.trim().toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = B32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error(`Invalid Base32 character: “${ch}”`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(out));
}

// Generic encode/decode pair factory
function codecTool(fns: {
  encode: (s: string, opts: Record<string, unknown>) => string;
  decode: (s: string, opts: Record<string, unknown>) => string;
  extraControls?: (state: any, set: (p: any) => void) => React.ReactNode;
  sample?: string;
}): ComponentType {
  return function CodecTool() {
    const [text, setText] = useState("");
    const [dir, setDir] = useState<"encode" | "decode">("encode");
    const [opts, setOpts] = useState<Record<string, unknown>>({});
    const set = (p: Record<string, unknown>) => setOpts((o) => ({ ...o, ...p }));
    const { output, error } = useMemo(() => {
      if (!text) return { output: "", error: null as string | null };
      try {
        return { output: dir === "encode" ? fns.encode(text, opts) : fns.decode(text, opts), error: null };
      } catch (e) {
        return { output: "", error: e instanceof Error ? e.message : String(e) };
      }
    }, [text, dir, opts]);
    return (
      <ToolLayout>
        <EditorPane
          value={text}
          onChange={setText}
          output={output}
          error={error}
          rows={8}
          sample={fns.sample ?? (dir === "encode" ? "Hello, LocalToolBox!" : "")}
          options={
            <OptionsBar>
              <SelField label="Direction" value={dir} onChange={setDir}
                options={[{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }]} />
              {fns.extraControls?.(opts, set)}
            </OptionsBar>
          }
        />
      </ToolLayout>
    );
  };
}

export const Base64EncodeTool: ComponentType = codecTool({
  encode: (s) => b64encode(s),
  decode: (s) => b64decode(s),
  sample: "Encode me, locally!",
});

export const Base64DecodeTool: ComponentType = codecTool({
  encode: (s) => b64encode(s),
  decode: (s) => b64decode(s),
  sample: "RW5jb2RlIG1lLCBsb2NhbGx5IQ==",
});

export const Base64AdvancedTool: ComponentType = codecTool({
  encode: (s, o) => {
    let out = b64encode(s, !!o.urlSafe);
    if (o.wrap) out = (out.match(/.{1,76}/g) ?? [out]).join("\n");
    return out;
  },
  decode: (s) => b64decode(s),
  extraControls: (st, set) => (
    <>
      <Toggle label="URL-safe alphabet (-_)" checked={!!st.urlSafe} onChange={(v) => set({ urlSafe: v })} />
      <Toggle label="Wrap at 76 chars (MIME)" checked={!!st.wrap} onChange={(v) => set({ wrap: v })} />
    </>
  ),
});

export const Base32Tool: ComponentType = codecTool({
  encode: (s) => b32encode(s),
  decode: (s) => b32decode(s),
  sample: "Base32 in the browser",
});

export const UrlEncodeTool: ComponentType = codecTool({
  encode: (s, o) => (o.mode === "component" ? encodeURIComponent(s) : encodeURI(s)),
  decode: (s, o) => (o.mode === "component" ? decodeURIComponent(s) : decodeURI(s)),
  extraControls: (st, set) => (
    <SelField label="Encoding" value={(st.mode as string) ?? "component"} onChange={(v) => set({ mode: v })}
      options={[
        { value: "component", label: "encodeURIComponent (query parts)" },
        { value: "uri", label: "encodeURI (whole URLs)" },
      ]} />
  ),
  sample: "https://example.com/search?q=hello world&lang=en",
});

export const UrlDecodeTool: ComponentType = codecTool({
  encode: (s, o) => (o.mode === "component" ? encodeURIComponent(s) : encodeURI(s)),
  decode: (s, o) => (o.mode === "component" ? decodeURIComponent(s) : decodeURI(s)),
  extraControls: (st, set) => (
    <SelField label="Encoding" value={(st.mode as string) ?? "component"} onChange={(v) => set({ mode: v })}
      options={[
        { value: "component", label: "decodeURIComponent (query parts)" },
        { value: "uri", label: "decodeURI (whole URLs)" },
      ]} />
  ),
  sample: "https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world",
});

export const HtmlEncodeTool: ComponentType = codecTool({
  encode: (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"),
  decode: (s) => {
    const doc = new DOMParser().parseFromString(s, "text/html");
    return doc.documentElement.textContent ?? "";
  },
  sample: '<a href="index.html">Tom & Jerry</a>',
});

export const HtmlDecodeTool: ComponentType = codecTool({
  encode: (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"),
  decode: (s) => {
    const doc = new DOMParser().parseFromString(s, "text/html");
    return doc.documentElement.textContent ?? "";
  },
  sample: "&lt;a href=&quot;index.html&quot;&gt;Tom &amp; Jerry&lt;/a&gt;",
});

// ── HTML entities reference ──
const ENTITIES: [string, string, string][] = [
  ["&amp;", "&", "ampersand"], ["&lt;", "<", "less than"], ["&gt;", ">", "greater than"],
  ["&quot;", '"', "quotation mark"], ["&apos;", "'", "apostrophe"], ["&nbsp;", " ", "non-breaking space"],
  ["&copy;", "©", "copyright"], ["&reg;", "®", "registered"], ["&trade;", "™", "trademark"],
  ["&hellip;", "…", "ellipsis"], ["&mdash;", "—", "em dash"], ["&ndash;", "–", "en dash"],
  ["&lsquo;", "\u2018", "left single quote"], ["&rsquo;", "\u2019", "right single quote"],
  ["&ldquo;", "\u201C", "left double quote"], ["&rdquo;", "\u201D", "right double quote"],
  ["&laquo;", "«", "left angle quote"], ["&raquo;", "»", "right angle quote"],
  ["&cent;", "¢", "cent"], ["&pound;", "£", "pound"], ["&euro;", "€", "euro"], ["&yen;", "¥", "yen"],
  ["&sect;", "§", "section"], ["&para;", "¶", "paragraph"], ["&dagger;", "†", "dagger"],
  ["&bull;", "•", "bullet"], ["&permil;", "‰", "per mille"], ["&prime;", "′", "prime"],
  ["&deg;", "°", "degree"], ["&micro;", "µ", "micro"], ["&middot;", "·", "middle dot"],
  ["&frac12;", "½", "one half"], ["&frac14;", "¼", "one quarter"], ["&frac34;", "¾", "three quarters"],
  ["&times;", "×", "multiplication"], ["&divide;", "÷", "division"], ["&plusmn;", "±", "plus-minus"],
  ["&le;", "≤", "less or equal"], ["&ge;", "≥", "greater or equal"], ["&ne;", "≠", "not equal"],
  ["&asymp;", "≈", "almost equal"], ["&infin;", "∞", "infinity"], ["&radic;", "√", "square root"],
  ["&sum;", "Σ", "sum"], ["&prod;", "Π", "product"], ["&int;", "∫", "integral"],
  ["&alpha;", "α", "alpha"], ["&beta;", "β", "beta"], ["&gamma;", "γ", "gamma"], ["&pi;", "π", "pi"],
  ["&larr;", "←", "left arrow"], ["&uarr;", "↑", "up arrow"], ["&rarr;", "→", "right arrow"], ["&darr;", "↓", "down arrow"],
  ["&harr;", "↔", "left-right arrow"], ["&spades;", "♠", "spade suit"], ["&clubs;", "♣", "club suit"],
  ["&hearts;", "♥", "heart suit"], ["&diams;", "♦", "diamond suit"], ["&check;", "✓", "check mark"],
  ["&cross;", "✗", "cross mark"], ["&star;", "☆", "star"], ["&sung;", "♪", "note"],
  ["&crarr;", "↵", "carriage return"], ["&euro;", "€", "euro sign"], ["&fnof;", "ƒ", "function"],
  ["&circ;", "ˆ", "circumflex"], ["&tilde;", "˜", "tilde"], ["&ensp;", " ", "en space"],
];

export const HtmlEntitiesTool: ComponentType = () => {
  const [q, setQ] = useState("");
  const [text, setText] = useState("");
  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return ENTITIES;
    return ENTITIES.filter(([ent, ch, name]) => ent.includes(query) || name.includes(query) || ch === query);
  }, [q]);
  const encoded = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const decoded = new DOMParser().parseFromString(text, "text/html").documentElement.textContent ?? "";
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <EditorPane value={text} onChange={setText} output={encoded} inputLabel="Text → entities" outputLabel="Encoded" rows={4}
          sample="Fish & chips < tasty >? “maybe”" />
        <OutputArea text={decoded} label="Decoded (entities → characters)" rows={3} />
        <div className="card overflow-hidden">
          <div className="p-3 border-b border-border">
            <input className="input" placeholder="Filter entities (name, symbol, code)…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter entities" />
          </div>
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-surface">
                <tr className="text-left text-[11px] uppercase tracking-wide text-ink-dim border-b border-border">
                  <th className="px-3 py-2">Entity</th><th className="px-3 py-2">Character</th><th className="px-3 py-2">Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {list.map(([ent, ch, name]) => (
                  <tr key={ent} className="hover:bg-surface-2">
                    <td className="px-3 py-1.5 font-mono text-accent">{ent}</td>
                    <td className="px-3 py-1.5 text-base">{ch}</td>
                    <td className="px-3 py-1.5 text-ink-muted">{name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

// ── JWT decoder ──
export const JwtDecoderTool: ComponentType = () => {
  const [token, setToken] = useState("");
  const [showVerify, setShowVerify] = useState(false);
  const [secret, setSecret] = useState("");
  const [verifyResult, setVerifyResult] = useState<string | null>(null);

  const parts = useMemo(() => token.trim().split("."), [token]);
  const header = useMemo(() => {
    if (parts.length < 2) return null;
    try {
      return JSON.stringify(JSON.parse(b64decode(parts[0])), null, 2);
    } catch {
      return null;
    }
  }, [parts]);
  const payload = useMemo(() => {
    if (parts.length < 2) return null;
    try {
      return JSON.parse(b64decode(parts[1]));
    } catch {
      return null;
    }
  }, [parts]);

  const claimsTable = useMemo(() => {
    if (!payload || typeof payload !== "object") return [];
    const known: Record<string, string> = {
      iss: "Issuer", sub: "Subject", aud: "Audience", exp: "Expiration time",
      nbf: "Not before", iat: "Issued at", jti: "JWT ID",
    };
    return Object.entries(payload).map(([k, v]) => ({
      key: k,
      label: known[k] ?? k,
      value: typeof v === "number" && ["exp", "nbf", "iat"].includes(k)
        ? `${v} (${new Date(v * 1000).toISOString()})`
        : JSON.stringify(v),
    }));
  }, [payload]);

  const expired = useMemo(() => {
    if (!payload || typeof payload.exp !== "number") return null;
    return payload.exp * 1000 < Date.now();
  }, [payload]);

  const verify = async () => {
    setVerifyResult(null);
    if (parts.length < 3) {
      setVerifyResult("This token has no signature segment.");
      return;
    }
    try {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${parts[0]}.${parts[1]}`));
    const expected = btoa(String.fromCharCode(...new Uint8Array(sig)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    setVerifyResult(expected === parts[2] ? "✓ Signature is valid (HMAC-SHA256)." : "✗ Signature does NOT match this secret.");
    } catch (e) {
      setVerifyResult(`Could not verify: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <label className="block">
          <span className="label">JWT token</span>
          <textarea className="textarea" rows={4} value={token} placeholder="eyJhbGciOi… paste your token" onChange={(e) => setToken(e.target.value)} />
        </label>
        {token.trim() && parts.length < 3 && (
          <Note kind="warn">A JWT should have three dot-separated segments (header.payload.signature). This one has {parts.length}.</Note>
        )}
        <div className="grid lg:grid-cols-2 gap-4">
          <OutputArea text={header ?? ""} label="Header (decoded)" rows={6} filename="jwt-header.json" />
          <OutputArea text={payload ? JSON.stringify(payload, null, 2) : ""} label="Payload (decoded)" rows={6} filename="jwt-payload.json" />
        </div>
        {claimsTable.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-ink-dim border-b border-border">
                  <th className="px-3 py-2">Claim</th><th className="px-3 py-2">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {claimsTable.map((c) => (
                  <tr key={c.key} className="hover:bg-surface-2">
                    <td className="px-3 py-1.5 font-mono text-accent">{c.key}</td>
                    <td className="px-3 py-1.5 font-mono break-all">{c.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expired !== null && (
              <div className={`px-3 py-2 text-[13px] ${expired ? "text-danger" : "text-success"}`}>
                {expired ? "⚠ This token is EXPIRED." : "✓ This token is not expired."}
              </div>
            )}
          </div>
        )}
        <div className="card p-3.5 flex flex-col gap-3">
          <Toggle label="Verify HMAC-SHA256 signature (HS256) with a shared secret" checked={showVerify} onChange={setShowVerify} />
          {showVerify && (
            <div className="flex items-end gap-2 flex-wrap">
              <label className="flex-1 min-w-48">
                <span className="label">Shared secret</span>
                <input className="input font-mono" type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="your-256-bit-secret" />
              </label>
              <button className="btn-primary" onClick={verify} disabled={!secret || !payload}>Verify</button>
            </div>
          )}
          {verifyResult && (
            <Note kind={verifyResult.startsWith("✓") ? "info" : "warn"}>{verifyResult}</Note>
          )}
          <Note>Decoding happens locally in your browser. Verification only supports symmetric HS256 tokens and never sends the token anywhere.</Note>
        </div>
      </div>
    </ToolLayout>
  );
};
