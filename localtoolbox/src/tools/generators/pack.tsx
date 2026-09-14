// Generators category — 15 tools, all local randomness or rendering.
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import QRCode from "qrcode";
import ToolLayout from "../../components/ToolLayout";
import EditorPane from "../../components/EditorPane";
import { CopyButton, Note, NumField, OptionsBar, OutputArea, RunButton, SelField, Toggle } from "../../components/ui";
import { downloadBlob } from "../../lib/download";

const rnd = (max: number) => crypto.getRandomValues(new Uint32Array(1))[0] % max;

// ── UUID generator ──
function uuidV4(): string {
  return crypto.randomUUID();
}
function uuidV1(): string {
  // timestamp-based (60-bit time + clock seq + random node)
  const now = BigInt(Date.now()) * 10000n + 0x01b21dd213814000n;
  const timeLow = (now & 0xffffffffn).toString(16).padStart(8, "0");
  const timeMid = ((now >> 32n) & 0xffffn).toString(16).padStart(4, "0");
  const timeHi = (((now >> 48n) & 0x0fffn) | 0x1000n).toString(16).padStart(4, "0");
  const seq = crypto.getRandomValues(new Uint16Array(1))[0];
  const clockSeq = ((seq & 0x3fff) | 0x8000).toString(16).padStart(4, "0");
  const node = [...crypto.getRandomValues(new Uint8Array(6))].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${timeLow}-${timeMid}-${timeHi}-${clockSeq}-${node}`;
}
async function uuidV5(name: string, namespace: string): Promise<string> {
  const NS = { dns: "6ba7b810-9dad-11d1-80b4-00c04fd430c8", url: "6ba7b811-9dad-11d1-80b4-00c04fd430c8", oid: "6ba7b812-9dad-11d1-80b4-00c04fd430c8", x500: "6ba7b814-9dad-11d1-80b4-00c04fd430c8" };
  const nsHex = (NS[namespace as keyof typeof NS] ?? namespace).replace(/-/g, "");
  const nsBytes = new Uint8Array(nsHex.match(/../g)!.map((h) => parseInt(h, 16)));
  const nameBytes = new TextEncoder().encode(name);
  const data = new Uint8Array(nsBytes.length + nameBytes.length);
  data.set(nsBytes);
  data.set(nameBytes, nsBytes.length);
  const hash = await crypto.subtle.digest("SHA-1", data as unknown as BufferSource);
  const b = new Uint8Array(hash.slice(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
export const UuidTool: ComponentType = () => {
  const [version, setVersion] = useState("v4");
  const [count, setCount] = useState(5);
  const [name, setName] = useState("example.com");
  const [ns, setNs] = useState("dns");
  const [upper, setUpper] = useState(false);
  const [ids, setIds] = useState<string[]>([]);
  const generate = async () => {
    const out: string[] = [];
    for (let i = 0; i < Math.min(500, Math.max(1, count)); i++) {
      out.push(version === "v1" ? uuidV1() : version === "v5" ? await uuidV5(name, ns) : uuidV4());
    }
    setIds(upper ? out.map((u) => u.toUpperCase()) : out);
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <SelField label="Version" value={version} onChange={setVersion} options={[
            { value: "v4", label: "v4 — random" }, { value: "v1", label: "v1 — timestamp" }, { value: "v5", label: "v5 — name (SHA-1)" },
          ]} />
          <NumField label="How many" value={count} min={1} max={500} onChange={(v) => setCount(Math.min(500, Math.max(1, v || 1)))} />
          {version === "v5" && (
            <>
              <label className="block"><span className="label">Name</span>
                <input className="input !w-40" value={name} onChange={(e) => setName(e.target.value)} /></label>
              <SelField label="Namespace" value={ns} onChange={setNs} options={["dns", "url", "oid", "x500"].map((n) => ({ value: n, label: n }))} />
            </>
          )}
          <Toggle label="Uppercase" checked={upper} onChange={setUpper} />
          <RunButton label="Generate" onClick={generate} />
        </OptionsBar>
        <OutputArea text={ids.join("\n")} filename="uuids.txt" rows={8} label={`${ids.length} UUID${ids.length === 1 ? "" : "s"}`} />
      </div>
    </ToolLayout>
  );
};

// ── ULID generator ──
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const UlidTool: ComponentType = () => {
  const [count, setCount] = useState(5);
  const [ids, setIds] = useState<string[]>([]);
  const generate = () => {
    const out: string[] = [];
    let lastTime = -1;
    const rand = (n: number) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => CROCKFORD[b % 32]).join("");
    for (let i = 0; i < Math.min(100, Math.max(1, count)); i++) {
      const now = Date.now();
      const timePart = CROCKFORD.split("").reduce((acc, _) => acc, "") || "";
      let time = now;
      let ts = "";
      for (let j = 9; j >= 0; j--) {
        const mod = time % 32;
        ts = CROCKFORD[mod] + ts;
        time = (time - mod) / 32;
      }
      void timePart;
      void lastTime;
      out.push(ts + rand(16));
      lastTime = now;
    }
    setIds(out);
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="How many" value={count} min={1} max={100} onChange={(v) => setCount(Math.min(100, Math.max(1, v || 1)))} />
          <RunButton label="Generate" onClick={generate} />
        </OptionsBar>
        <OutputArea text={ids.join("\n")} filename="ulids.txt" rows={8} label={`${ids.length} ULIDs`} />
        <Note>ULIDs are 26-character, lexicographically sortable identifiers: a 10-char timestamp followed by 16 chars of randomness. Same-millisecond IDs still sort by randomness.</Note>
      </div>
    </ToolLayout>
  );
};

// ── Passwords / random string / random number list / random email / names ──
const FIRST_NAMES: Record<string, string[]> = {
  English: ["James", "Mary", "Oliver", "Amelia", "Harry", "Isla", "Jack", "Emily", "George", "Sophie", "Charlotte", "Thomas"],
  Spanish: ["Mateo", "Sofía", " Santiago", "Valentina", "Diego", "Lucía", "Alejandro", "Carmen", "Javier", "Elena"],
  French: ["Louis", "Emma", "Gabriel", "Jade", "Raphaël", "Alice", "Arthur", "Louise", "Hugo", "Chloé"],
  German: ["Lukas", "Anna", "Felix", "Marie", "Jonas", "Lena", "Leon", "Emma", "Paul", "Hannah"],
  Japanese: ["Haruto", "Yui", "Sōta", "Rin", "Yūto", "Hina", "Kaito", "Sakura", "Riku", "Aoi"],
  Indian: ["Aarav", "Ananya", "Vihaan", "Diya", "Aditya", "Aadhya", "Arjun", "Myra", "Rohan", "Ira"],
};
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "García", "Miller", "Davis", "Rodríguez", "Martínez", "Hernández", "López", "González", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sánchez", "Clark", "Ramírez", "Lewis", "Robinson"];
const STREETS = ["Maple St", "Oak Ave", "Cedar Ln", "Pine Rd", "Elm Dr", "Willow Way", "Birch Blvd", "Sunset Ct", "River Rd", "Hilltop Ter"];
const CITIES = ["Springfield", "Riverside", "Fairview", "Greenville", "Madison", "Georgetown", "Arlington", "Clinton"];

export const FakeDataTool: ComponentType = () => {
  const [count, setCount] = useState(5);
  const [locale, setLocale] = useState("English");
  const [rows, setRows] = useState<string[][]>([]);
  const generate = () => {
    const first = FIRST_NAMES[locale] ?? FIRST_NAMES.English;
    const out: string[][] = [];
    for (let i = 0; i < Math.min(200, Math.max(1, count)); i++) {
      const fn = first[rnd(first.length)].trim();
      const ln = LAST_NAMES[rnd(LAST_NAMES.length)];
      out.push([
        `${fn} ${ln}`,
        `${fn.toLowerCase()}.${ln.toLowerCase().replace(/[^a-z]/g, "")}${rnd(900) + 100}@example.com`,
        `${rnd(9000) + 1000} ${STREETS[rnd(STREETS.length)]}`,
        `${CITIES[rnd(CITIES.length)]}, ${String(rnd(50) + 10000)}`,
        `+1-${rnd(900) + 200}-555-${String(rnd(10000)).padStart(4, "0")}`,
      ]);
    }
    setRows(out);
  };
  const tsv = rows.map((r) => r.join("\t")).join("\n");
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="How many people" value={count} min={1} max={200} onChange={(v) => setCount(Math.min(200, Math.max(1, v || 1)))} />
          <SelField label="Name origin" value={locale} onChange={setLocale} options={Object.keys(FIRST_NAMES).map((l) => ({ value: l, label: l }))} />
          <RunButton label="Generate" onClick={generate} />
        </OptionsBar>
        {rows.length > 0 && (
          <>
            <div className="card overflow-auto max-h-96">
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 bg-surface">
                  <tr className="text-left text-[11px] uppercase tracking-wide text-ink-dim border-b border-border">
                    {["Name", "Email", "Street", "City", "Phone"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-surface-2">{r.map((c, j) => <td key={j} className="px-3 py-1.5 whitespace-nowrap">{c}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => navigator.clipboard.writeText(tsv)}>Copy as TSV</button>
              <button className="btn-ghost" onClick={() => downloadBlob("fake-data.csv", new Blob([rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")], { type: "text/csv" }))}>Download CSV</button>
            </div>
            <Note>All data is randomly assembled on your device and clearly fake (example.com emails, 555 phone numbers). Never present it as real identity data.</Note>
          </>
        )}
      </div>
    </ToolLayout>
  );
};

export const RandomStringTool: ComponentType = () => {
  const [length, setLength] = useState(32);
  const [count, setCount] = useState(5);
  const [charset, setCharset] = useState("alnum");
  const [out, setOut] = useState<string[]>([]);
  const CHARSETS: Record<string, string> = {
    alnum: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    hex: "0123456789abcdef",
    alpha: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    digits: "0123456789",
    all: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*-_=+",
  };
  const generate = () => {
    const pool = CHARSETS[charset] ?? CHARSETS.alnum;
    setOut(Array.from({ length: Math.min(100, Math.max(1, count)) }, () =>
      [...crypto.getRandomValues(new Uint32Array(Math.min(256, Math.max(1, length))))].map((n) => pool[n % pool.length]).join(""),
    ));
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="Length" value={length} min={1} max={256} onChange={(v) => setLength(Math.min(256, Math.max(1, v || 1)))} />
          <NumField label="How many" value={count} min={1} max={100} onChange={(v) => setCount(Math.min(100, Math.max(1, v || 1)))} />
          <SelField label="Characters" value={charset} onChange={setCharset} options={[
            { value: "alnum", label: "Letters + digits" }, { value: "hex", label: "Hex" }, { value: "alpha", label: "Letters" },
            { value: "digits", label: "Digits" }, { value: "all", label: "Letters + digits + symbols" },
          ]} />
          <RunButton label="Generate" onClick={generate} />
        </OptionsBar>
        <OutputArea text={out.join("\n")} filename="tokens.txt" rows={6} label={`${out.length} strings`} />
      </div>
    </ToolLayout>
  );
};

export const RandomEmailTool: ComponentType = () => {
  const [count, setCount] = useState(5);
  const [domain, setDomain] = useState("example.com");
  const [emails, setEmails] = useState<string[]>([]);
  const WORDS = ["fox", "river", "stone", "cloud", "ember", "willow", "frost", "comet", "maple", "raven", "cove", "dune"];
  const generate = () => {
    setEmails(Array.from({ length: Math.min(100, Math.max(1, count)) }, () => {
      const style = rnd(3);
      const a = WORDS[rnd(WORDS.length)];
      const b = WORDS[rnd(WORDS.length)];
      const n = rnd(1000);
      const local = style === 0 ? `${a}.${b}${n}` : style === 1 ? `${a}${b}${n}` : `${a[0]}${b}${n}`;
      return `${local}@${domain}`;
    }));
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="How many" value={count} min={1} max={100} onChange={(v) => setCount(Math.min(100, Math.max(1, v || 1)))} />
          <label className="block"><span className="label">Domain</span>
            <input className="input !w-44" value={domain} onChange={(e) => setDomain(e.target.value.replace(/[^a-z0-9.-]/gi, ""))} /></label>
          <RunButton label="Generate" onClick={generate} />
        </OptionsBar>
        <OutputArea text={emails.join("\n")} filename="test-emails.txt" rows={6} label={`${emails.length} addresses`} />
        <Note>For testing forms and seed data only — these addresses belong to the example.com-style domain you pick and shouldn't be used to sign up for real services.</Note>
      </div>
    </ToolLayout>
  );
};

export const NameGeneratorTool: ComponentType = () => {
  const [count, setCount] = useState(10);
  const [origin, setOrigin] = useState("English");
  const [names, setNames] = useState<string[]>([]);
  const generate = () => {
    const first = FIRST_NAMES[origin] ?? FIRST_NAMES.English;
    setNames(Array.from({ length: Math.min(200, Math.max(1, count)) }, () =>
      `${first[rnd(first.length)].trim()} ${LAST_NAMES[rnd(LAST_NAMES.length)]}`,
    ));
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="How many" value={count} min={1} max={200} onChange={(v) => setCount(Math.min(200, Math.max(1, v || 1)))} />
          <SelField label="Origin" value={origin} onChange={setOrigin} options={Object.keys(FIRST_NAMES).map((l) => ({ value: l, label: l }))} />
          <RunButton label="Generate" onClick={generate} />
        </OptionsBar>
        <div className="flex flex-wrap gap-1.5">
          {names.map((n, i) => <span key={i} className="chip !text-[13px] !py-1">{n}</span>)}
        </div>
      </div>
    </ToolLayout>
  );
};

export const NumberListTool: ComponentType = () => {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(10);
  const [sort, setSort] = useState(false);
  const [unique, setUnique] = useState(false);
  const [nums, setNums] = useState<number[]>([]);
  const generate = () => {
    let out: number[] = [];
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    if (unique) {
      const pool = Array.from({ length: Math.max(0, hi - lo + 1) }, (_, i) => lo + i);
      for (let i = 0; i < Math.min(count, pool.length); i++) out.push(...pool.splice(rnd(pool.length), 1));
    } else {
      out = Array.from({ length: Math.min(10000, Math.max(1, count)) }, () => lo + rnd(hi - lo + 1));
    }
    if (sort) out.sort((a, b) => a - b);
    setNums(out);
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="Min" value={min} onChange={setMin} />
          <NumField label="Max" value={max} onChange={setMax} />
          <NumField label="How many" value={count} min={1} max={10000} onChange={(v) => setCount(Math.max(1, v || 1))} />
          <div><span className="label">Options</span>
            <Toggle label="Sorted" checked={sort} onChange={setSort} />
            <Toggle label="Unique only" checked={unique} onChange={setUnique} />
          </div>
          <RunButton label="Generate" onClick={generate} />
        </OptionsBar>
        <OutputArea text={nums.join("\n")} filename="numbers.txt" rows={8} label={`${nums.length} numbers`} />
      </div>
    </ToolLayout>
  );
};

// ── Number sequence ──
export const NumberSequenceTool: ComponentType = () => {
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(20);
  const [step, setStep] = useState(1);
  const [pad, setPad] = useState(0);
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [sep, setSep] = useState("\n");
  const out = useMemo(() => {
    const s: string[] = [];
    const safeStep = step === 0 ? 1 : step;
    const count = Math.min(100000, Math.floor((end - start) / safeStep) + 1);
    for (let i = 0; i < count; i++) {
      const v = start + i * safeStep;
      s.push(prefix + String(v).padStart(pad, "0") + suffix);
    }
    return s.join(sep === "\n" ? "\n" : sep);
  }, [start, end, step, pad, prefix, suffix, sep]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="Start" value={start} onChange={setStart} />
          <NumField label="End" value={end} onChange={setEnd} />
          <NumField label="Step" value={step} onChange={(v) => setStep(v || 1)} />
          <NumField label="Zero-pad width" value={pad} min={0} max={10} onChange={(v) => setPad(Math.max(0, v || 0))} />
          <label className="block"><span className="label">Prefix</span>
            <input className="input !w-20" value={prefix} onChange={(e) => setPrefix(e.target.value)} /></label>
          <label className="block"><span className="label">Suffix</span>
            <input className="input !w-20" value={suffix} onChange={(e) => setSuffix(e.target.value)} /></label>
          <label className="block"><span className="label">Separator</span>
            <input className="input !w-16" value={sep === "\n" ? "\\n" : sep} onChange={(e) => setSep(e.target.value === "\\n" ? "\n" : e.target.value)} /></label>
        </OptionsBar>
        <OutputArea text={out} filename="sequence.txt" rows={8} label="Sequence" />
      </div>
    </ToolLayout>
  );
};

// ── MAC address ──
const OUI_PREFIXES: [string, string][] = [
  ["00:1A:2B", "Ayecom"], ["3C:5A:B4", "Google"], ["00:50:56", "VMware"], ["B8:27:EB", "Raspberry Pi"],
  ["D8:3A:DD", "Raspberry Pi"], ["AC:DE:48", "Private"], ["00:0C:29", "VMware"], ["F0:9F:C2", "Ubiquiti"],
];
export const MacAddressTool: ComponentType = () => {
  const [count, setCount] = useState(5);
  const [caseUp, setCaseUp] = useState(true);
  const [sep, setSep] = useState(":");
  const [vendor, setVendor] = useState("random");
  const [macs, setMacs] = useState<string[]>([]);
  const generate = () => {
    const out: string[] = [];
    for (let i = 0; i < Math.min(100, Math.max(1, count)); i++) {
      const prefix = vendor === "random"
        ? [...crypto.getRandomValues(new Uint8Array(3))]
        : (OUI_PREFIXES.find(([o]) => o === vendor)?.[0] ?? "00:1A:2B").split(":").map((h) => parseInt(h, 16));
      const bytes = [...prefix, ...crypto.getRandomValues(new Uint8Array(3))];
      // set locally-administered bit when random
      if (vendor === "random") bytes[0] = (bytes[0] | 0x02) & 0xfe;
      const str = bytes.map((b) => b.toString(16).padStart(2, caseUp ? "0" : "0")).map((s) => (caseUp ? s.toUpperCase() : s)).join(sep);
      out.push(str);
    }
    setMacs(out);
  };
  const [validate, setValidate] = useState("");
  const macValid = /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(validate.trim());
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="How many" value={count} min={1} max={100} onChange={(v) => setCount(Math.min(100, Math.max(1, v || 1)))} />
          <SelField label="Vendor prefix" value={vendor} onChange={setVendor} options={[{ value: "random", label: "Random (locally administered)" }, ...OUI_PREFIXES.map(([o, n]) => ({ value: o, label: `${o} (${n})` }))]} />
          <SelField label="Separator" value={sep} onChange={setSep} options={[{ value: ":", label: ":" }, { value: "-", label: "-" }, { value: "", label: "none" }]} />
          <Toggle label="Uppercase" checked={caseUp} onChange={setCaseUp} />
          <RunButton label="Generate" onClick={generate} />
        </OptionsBar>
        <OutputArea text={macs.join("\n")} filename="macs.txt" rows={6} label={`${macs.length} MACs`} />
        <OptionsBar>
          <label className="block flex-1"><span className="label">Validate a MAC address</span>
            <input className="input font-mono" value={validate} onChange={(e) => setValidate(e.target.value)} placeholder="00:1A:2B:3C:4D:5E" /></label>
          {validate && <span className={`self-end text-sm ${macValid ? "text-success" : "text-danger"}`}>{macValid ? "✓ Valid format" : "✗ Not a valid MAC (need 6 hex pairs)"}</span>}
        </OptionsBar>
      </div>
    </ToolLayout>
  );
};

// ── Test credit card (Luhn) ──
export const CreditCardTool: ComponentType = () => {
  const [brand, setBrand] = useState("visa");
  const [count, setCount] = useState(5);
  const [cards, setCards] = useState<string[]>([]);
  const PREFIX: Record<string, { len: number; prefixes: string[]; name: string }> = {
    visa: { len: 16, prefixes: ["4"], name: "Visa" },
    mastercard: { len: 16, prefixes: ["51", "52", "53", "54", "55"], name: "Mastercard" },
    amex: { len: 15, prefixes: ["34", "37"], name: "Amex" },
    discover: { len: 16, prefixes: ["6011", "65"], name: "Discover" },
  };
  const luhnComplete = (partial: string): string => {
    // build to len-1 then compute check digit
    let digits = partial;
    while (digits.length < PREFIX[brand].len - 1) digits += String(rnd(10));
    let sum = 0;
    const full = digits + "0";
    for (let i = 0; i < full.length; i++) {
      let d = parseInt(full[full.length - 1 - i], 10);
      if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
    }
    const check = (10 - (sum % 10)) % 10;
    return digits + String(check);
  };
  const generate = () => {
    const spec = PREFIX[brand];
    setCards(Array.from({ length: Math.min(50, Math.max(1, count)) }, () => {
      const p = spec.prefixes[rnd(spec.prefixes.length)];
      return luhnComplete(p).replace(/(.{4})/g, "$1 ").trim();
    }));
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <div className="border border-danger/40 bg-danger/10 rounded-tool p-3.5 text-[13px] text-danger flex items-start gap-2">
          <span className="text-lg leading-none">⚠</span>
          <div><strong>For software testing only.</strong> These are mathematically valid Luhn numbers that do NOT correspond to real accounts. Attempting to use generated numbers for purchases, identity fraud, or any deceptive purpose is illegal.</div>
        </div>
        <OptionsBar>
          <SelField label="Card network" value={brand} onChange={setBrand} options={Object.entries(PREFIX).map(([k, v]) => ({ value: k, label: `${v.name} (${v.len} digits)` }))} />
          <NumField label="How many" value={count} min={1} max={50} onChange={(v) => setCount(Math.min(50, Math.max(1, v || 1)))} />
          <RunButton label="Generate test numbers" onClick={generate} />
        </OptionsBar>
        <OutputArea text={cards.join("\n")} filename="test-cards.txt" rows={6} label={`${cards.length} test numbers`} />
      </div>
    </ToolLayout>
  );
};

// ── IBAN ──
const IBAN_SPECS: Record<string, { len: number; bankLen: number; acctLen: number }> = {
  DE: { len: 22, bankLen: 8, acctLen: 10 }, FR: { len: 27, bankLen: 10, acctLen: 13 },
  NL: { len: 18, bankLen: 4, acctLen: 10 }, ES: { len: 24, bankLen: 4, acctLen: 12 },
  IT: { len: 27, bankLen: 6, acctLen: 13 }, GB: { len: 22, bankLen: 6, acctLen: 8 },
};
function ibanChecksum(iban: string): string {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = [...rearranged].map((c) => (/[A-Z]/.test(c) ? String(c.charCodeAt(0) - 55) : c)).join("");
  // mod-97 via chunked BigInt-free reduction
  let remainder = 0;
  for (const ch of numeric) remainder = (remainder * 10 + parseInt(ch, 10)) % 97;
  return String(98 - remainder).padStart(2, "0");
}
export const IbanTool: ComponentType = () => {
  const [country, setCountry] = useState("DE");
  const [ibans, setIbans] = useState<string[]>([]);
  const [validate, setValidate] = useState("");
  const generate = () => {
    const spec = IBAN_SPECS[country];
    const out: string[] = [];
    for (let i = 0; i < 5; i++) {
      let body = country + "00" + [...crypto.getRandomValues(new Uint8Array(2))].map((b) => String.fromCharCode(65 + (b % 26))).join("");
      while (body.length < spec.len - 2) body += String(rnd(10));
      const check = ibanChecksum(body);
      out.push((body.slice(0, 2) + check + body.slice(4)).replace(/(.{4})/g, "$1 ").trim());
    }
    setIbans(out);
  };
  const ibanValid = useMemo(() => {
    const clean = validate.replace(/\s+/g, "").toUpperCase();
    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$/.test(clean)) return null;
    const spec = IBAN_SPECS[clean.slice(0, 2)];
    if (spec && clean.length !== spec.len) return false;
    return ibanChecksum(clean) === "98" ? true : false;
  }, [validate]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <SelField label="Country" value={country} onChange={setCountry} options={Object.keys(IBAN_SPECS).map((c) => ({ value: c, label: `${c} (${IBAN_SPECS[c].len} chars)` }))} />
          <RunButton label="Generate 5 test IBANs" onClick={generate} />
        </OptionsBar>
        <OutputArea text={ibans.join("\n")} filename="test-ibans.txt" rows={5} label="Test IBANs (valid checksum, fake accounts)" />
        <OptionsBar>
          <label className="block flex-1"><span className="label">Validate an IBAN (checksum + length)</span>
            <input className="input font-mono" value={validate} onChange={(e) => setValidate(e.target.value)} placeholder="DE89 3704 0044 0532 0130 00" /></label>
          {ibanValid !== null && <span className={`self-end text-sm ${ibanValid ? "text-success" : "text-danger"}`}>{ibanValid ? "✓ Valid checksum" : "✗ Invalid"}</span>}
        </OptionsBar>
        <Note>Generated IBANs pass the mod-97 checksum so payment-form testing works, but they don't reference real bank accounts.</Note>
      </div>
    </ToolLayout>
  );
};

// ── QR code ──
export const QrTool: ComponentType = () => {
  const [text, setText] = useState("https://example.com");
  const [size, setSize] = useState(256);
  const [ec, setEc] = useState<"L" | "M" | "Q" | "H">("M");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    if (!text.trim()) {
      const ctx = canvasRef.current.getContext("2d")!;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      return;
    }
    QRCode.toCanvas(canvasRef.current, text, { width: size, errorCorrectionLevel: ec, margin: 2, color: { dark: "#0a0e17", light: "#ffffff" } }, () => {});
  }, [text, size, ec]);
  const download = (mime: string) => {
    canvasRef.current?.toBlob((b) => b && downloadBlob(`qr.${mime === "image/png" ? "png" : "jpg"}`, b), mime, 0.95);
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <EditorPane value={text} onChange={setText} rows={4} inputLabel="Content (URL, text, WIFI:…, tel:…)" placeholder="https://…" sample="https://example.com/local-tools" />
        <OptionsBar>
          <label className="block"><span className="label">Size — {size}px</span>
            <input type="range" min={128} max={1024} step={32} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-44 accent-[var(--color-accent)]" /></label>
          <SelField label="Error correction" value={ec} onChange={setEc} options={[{ value: "L", label: "L — 7%" }, { value: "M", label: "M — 15%" }, { value: "Q", label: "Q — 25%" }, { value: "H", label: "H — 30%" }]} />
        </OptionsBar>
        <div className="card p-6 flex justify-center">
          <canvas ref={canvasRef} className="rounded-tool-sm" aria-label="QR code preview" />
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={() => download("image/png")}>Download PNG</button>
          <button className="btn-ghost" onClick={() => download("image/jpeg")}>Download JPG</button>
        </div>
      </div>
    </ToolLayout>
  );
};

// ── Barcode ──
export const BarcodeTool: ComponentType = () => {
  const [format, setFormat] = useState("CODE128");
  const [value, setValue] = useState("LOCAL-TOOLBOX-316");
  const [displayValue, setDisplayValue] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!svgRef.current) return;
    import("jsbarcode").then(({ default: JsBarcode }) => {
      try {
        JsBarcode(svgRef.current!, value || " ", { format, displayValue, width: 2, height: 80, background: "#ffffff", lineColor: "#0a0e17" });
      } catch {
        // invalid value for the chosen format — leave the previous rendering
      }
    });
  }, [format, value, displayValue]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <SelField label="Format" value={format} onChange={setFormat} options={["CODE128", "CODE39", "EAN13", "EAN8", "UPC", "ITF14", "MSI", "pharmacode"].map((f) => ({ value: f, label: f }))} />
          <label className="block flex-1 min-w-48"><span className="label">Value</span>
            <input className="input font-mono" value={value} onChange={(e) => setValue(e.target.value)} /></label>
          <Toggle label="Show text" checked={displayValue} onChange={setDisplayValue} />
        </OptionsBar>
        <div className="card p-6 flex justify-center">
          <svg ref={svgRef} aria-label="Barcode preview" />
        </div>
        <button className="btn-primary self-start" onClick={() => {
          if (!svgRef.current) return;
          const xml = new XMLSerializer().serializeToString(svgRef.current);
          downloadBlob("barcode.svg", new Blob([xml], { type: "image/svg+xml" }));
        }}>Download SVG</button>
        <Note>EAN13 needs exactly 12–13 digits, EAN8 needs 7–8, UPC needs 11–12. CODE128 accepts any text.</Note>
      </div>
    </ToolLayout>
  );
};

// ── Random color ──
export const RandomColorTool: ComponentType = () => {
  const [mode, setMode] = useState("hex");
  const [count, setCount] = useState(6);
  const [colors, setColors] = useState<string[]>([]);
  const generate = () => {
    setColors(Array.from({ length: Math.min(48, Math.max(1, count)) }, () => {
      const h = rnd(360);
      const s = 55 + rnd(40);
      const l = mode === "pastel" ? 75 + rnd(15) : mode === "dark" ? 25 + rnd(20) : 40 + rnd(30);
      const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
        const v = l / 100 - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
        return Math.round(255 * v).toString(16).padStart(2, "0");
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    }));
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <SelField label="Style" value={mode} onChange={setMode} options={[{ value: "hex", label: "Vivid" }, { value: "pastel", label: "Pastel" }, { value: "dark", label: "Dark" }]} />
          <NumField label="How many" value={count} min={1} max={48} onChange={(v) => setCount(Math.min(48, Math.max(1, v || 1)))} />
          <RunButton label="Generate" onClick={generate} />
        </OptionsBar>
        <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))" }}>
          {colors.map((c, i) => (
            <button key={i} className="rounded-tool border border-border overflow-hidden group text-left" onClick={() => navigator.clipboard.writeText(c)} title="Click to copy">
              <div className="h-16 group-hover:h-20 transition-all" style={{ background: c }} />
              <div className="px-2 py-1 font-mono text-[11px] text-ink-muted">{c}</div>
            </button>
          ))}
        </div>
        {colors.length > 0 && <CopyButton text={colors.join("\n")} label="Copy all hex codes" />}
      </div>
    </ToolLayout>
  );
};

// ── NATO alphabet ──
const NATO: Record<string, string> = { a: "Alfa", b: "Bravo", c: "Charlie", d: "Delta", e: "Echo", f: "Foxtrot", g: "Golf", h: "Hotel", i: "India", j: "Juliett", k: "Kilo", l: "Lima", m: "Mike", n: "November", o: "Oscar", p: "Papa", q: "Quebec", r: "Romeo", s: "Sierra", t: "Tango", u: "Uniform", v: "Victor", w: "Whiskey", x: "X-ray", y: "Yankee", z: "Zulu", "0": "Zero", "1": "One", "2": "Two", "3": "Three", "4": "Four", "5": "Five", "6": "Six", "7": "Seven", "8": "Eight", "9": "Nine" };
export const NatoTool: ComponentType = () => {
  const [text, setText] = useState("");
  const out = useMemo(() =>
    [...text.toLowerCase()].map((c) => (c === " " ? "(space)" : NATO[c] ?? "")).filter(Boolean).join(" · "), [text]);
  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} output={out} rows={4} inputLabel="Text" outputLabel="NATO phonetic" sample="ltb 316" filename="nato.txt" />
    </ToolLayout>
  );
};

export const tools: Record<string, ComponentType> = {
  "uuid-generator": UuidTool,
  "ulid-gen": UlidTool,
  "qr-generator": QrTool,
  "barcode-generator": BarcodeTool,
  "random-string": RandomStringTool,
  "random-email": RandomEmailTool,
  "name-generator": NameGeneratorTool,
  "credit-card-gen": CreditCardTool,
  "iban-gen": IbanTool,
  "color-generator": RandomColorTool,
  "number-gen": NumberListTool,
  "number-sequence": NumberSequenceTool,
  "mac-address-gen": MacAddressTool,
  "fake-data-gen-2": FakeDataTool,
  "nato-alphabet": NatoTool,
};
