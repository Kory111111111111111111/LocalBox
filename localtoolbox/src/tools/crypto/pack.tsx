// Crypto & Security category — 12 tools. Web Crypto first; legacy hashes hand-rolled MD5/SHA-1.
import { useEffect, useMemo, useState, type ComponentType } from "react";
import ToolLayout from "../../components/ToolLayout";
import EditorPane from "../../components/EditorPane";
import Dropzone, { toDropped, type DroppedFile } from "../../components/Dropzone";
import { CopyButton, Note, NumField, OptionsBar, OutputArea, ProgressBar, RunButton, SelField, StatGrid, Toggle } from "../../components/ui";
import { formatBytes } from "../../lib/download";

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const b64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));

async function subtleDigest(algo: string, data: Uint8Array): Promise<ArrayBuffer> {
  return crypto.subtle.digest(algo, data as unknown as BufferSource);
}

// hand-rolled MD5 (public-domain algorithm) for the legacy row
function md5(bytes: Uint8Array): string {
  const rl = (x: number, c: number) => (x << c) | (x >>> (32 - c));
  const add = (a: number, b: number) => (((a >> 16) + (b >> 16) + (((a & 0xffff) + (b & 0xffff)) >> 16)) << 16) | (((a & 0xffff) + (b & 0xffff)) & 0xffff);
  const cmn = (q: number, a: number, b: number, x: number, s: number, t: number) => add(rl(add(add(a, q), add(x, t)), s), b);
  const ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn((b & c) | (~b & d), a, b, x, s, t);
  const gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn((b & d) | (c & ~d), a, b, x, s, t);
  const hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn(b ^ c ^ d, a, b, x, s, t);
  const ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn(c ^ (b | ~d), a, b, x, s, t);
  const len = bytes.length;
  const withPad = new Uint8Array((((len + 8) >> 6) + 1) << 6);
  withPad.set(bytes);
  withPad[len] = 0x80;
  const bitLen = len * 8;
  const dv = new DataView(withPad.buffer);
  dv.setUint32(withPad.length - 8, bitLen >>> 0, true);
  dv.setUint32(withPad.length - 4, Math.floor(bitLen / 0x100000000), true);
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  const S = [
    [7, 12, 17, 22], [5, 9, 14, 20], [4, 11, 16, 23], [6, 10, 15, 21],
  ];
  const K = new Uint32Array(64).map((_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32));
  for (let chunk = 0; chunk < withPad.length; chunk += 64) {
    const M = new Uint32Array(16);
    for (let i = 0; i < 16; i++) M[i] = dv.getUint32(chunk + i * 4, true);
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) { F = ff(A, B, C, D, M[i], S[0][i % 4], K[i]); g = i; }
      else if (i < 32) { F = gg(A, B, C, D, M[(5 * i + 1) % 16], S[1][i % 4], K[i]); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = hh(A, B, C, D, M[(3 * i + 5) % 16], S[2][i % 4], K[i]); g = (3 * i + 5) % 16; }
      else { F = ii(A, B, C, D, M[(7 * i) % 16], S[3][i % 4], K[i]); g = (7 * i) % 16; }
      // standard MD5 step: b := ((a + f + m + k) <<< s) + b, then roles rotate
      const temp = D; D = C; C = B; B = F; A = temp;
    }
    a0 = add(a0, A); b0 = add(b0, B); c0 = add(c0, C); d0 = add(d0, D);
  }
  const out = new DataView(new ArrayBuffer(16));
  [a0, b0, c0, d0].forEach((v, i) => out.setUint32(i * 4, v >>> 0, true));
  return hex(out.buffer);
}

// ── Hash generator ──
export const HashGeneratorTool: ComponentType = () => {
  const [text, setText] = useState("");
  const [hashes, setHashes] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!text) { setHashes({}); return; }
    const bytes = new TextEncoder().encode(text);
    (async () => {
      const out: Record<string, string> = { MD5: md5(bytes) };
      for (const algo of ["SHA-1", "SHA-256", "SHA-384", "SHA-512"]) {
        out[algo] = hex(await subtleDigest(algo, bytes));
      }
      setHashes(out);
    })();
  }, [text]);
  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} inputLabel="Text to hash" outputLabel="Digests" rows={5} sample="hello local toolbox"
        outputNode={
          <div className="card divide-y divide-border-subtle overflow-hidden">
            {Object.entries(hashes).map(([algo, digest]) => (
              <div key={algo} className="flex items-center gap-3 px-3 py-2 text-[12px]">
                <span className="w-16 text-ink-muted font-medium">{algo}</span>
                <code className="flex-1 font-mono text-accent break-all">{digest}</code>
                <CopyButton text={digest} label=" " />
              </div>
            ))}
            {Object.keys(hashes).length === 0 && <div className="px-3 py-6 text-sm text-ink-dim text-center">Type text to compute hashes.</div>}
          </div>
        } />
      <Note>MD5 and SHA-1 are included for verifying legacy checksums only — they are broken for security purposes. Prefer SHA-256 or SHA-512.</Note>
    </ToolLayout>
  );
};

// ── File hash / checksum ──
function FileHashTool({ label }: { label: string }) {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const run = async () => {
    const file = files[0]?.file;
    if (!file) return;
    setBusy(true);
    setHashes({});
    const bytes = new Uint8Array(await file.arrayBuffer());
    const out: Record<string, string> = { MD5: md5(bytes) };
    for (const algo of ["SHA-1", "SHA-256", "SHA-512"]) out[algo] = hex(await subtleDigest(algo, bytes));
    setHashes(out);
    setBusy(false);
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <Dropzone files={files} onFiles={(f) => setFiles(toDropped(f))} hint={label} />
        <RunButton onClick={run} busy={busy} disabled={!files.length} label="Compute hashes" />
        <div className="card divide-y divide-border-subtle overflow-hidden">
          {Object.entries(hashes).map(([algo, digest]) => (
            <div key={algo} className="flex items-center gap-3 px-3 py-2 text-[12px]">
              <span className="w-16 text-ink-muted font-medium">{algo}</span>
              <code className="flex-1 font-mono text-accent break-all">{digest}</code>
              <CopyButton text={digest} label=" " />
            </div>
          ))}
          {Object.keys(hashes).length === 0 && <div className="px-3 py-5 text-sm text-ink-dim text-center">Drop a file — it is read in your browser, hashed, and never uploaded.</div>}
        </div>
      </div>
    </ToolLayout>
  );
}
export const ChecksumTool: ComponentType = () => FileHashTool({ label: "Any file — checksums are computed locally" });
export const FileHashToolExport: ComponentType = () => FileHashTool({ label: "Any file type — MD5/SHA digests, computed in your browser" });

// ── HMAC ──
export const HmacTool: ComponentType = () => {
  const [message, setMessage] = useState("");
  const [secret, setSecret] = useState("");
  const [algo, setAlgo] = useState("SHA-256");
  const [mac, setMac] = useState("");
  useEffect(() => {
    if (!message || !secret) { setMac(""); return; }
    (async () => {
      const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: algo }, false, ["sign"]);
      const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
      setMac(hex(sig));
    })();
  }, [message, secret, algo]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block flex-1 min-w-48"><span className="label">Secret key</span>
            <input className="input font-mono" type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="shared secret" /></label>
          <SelField label="Algorithm" value={algo} onChange={setAlgo} options={["SHA-1", "SHA-256", "SHA-384", "SHA-512"].map((a) => ({ value: a, label: a }))} />
        </OptionsBar>
        <EditorPane value={message} onChange={setMessage} inputLabel="Message" outputLabel={`HMAC (${algo})`} rows={5} sample="The quick brown fox" filename="hmac.txt"
          outputNode={<OutputArea text={mac} rows={2} label={`HMAC-${algo}`} />} />
      </div>
    </ToolLayout>
  );
};

// ── AES encrypt/decrypt ──
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt as unknown as BufferSource, iterations: 150000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
export const AesTool: ComponentType = () => {
  const [text, setText] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [out, setOut] = useState("");
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    if (!text || !password) { setError("Provide both text and a password."); return; }
    setError(null);
    try {
      if (mode === "encrypt") {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await deriveKey(password, salt);
        const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as unknown as BufferSource }, key, new TextEncoder().encode(text));
        const blob = new Uint8Array(salt.length + iv.length + cipher.byteLength);
        blob.set(salt, 0);
        blob.set(iv, salt.length);
        blob.set(new Uint8Array(cipher), salt.length + iv.length);
        let bin = "";
        blob.forEach((b) => (bin += String.fromCharCode(b)));
        setOut(btoa(bin));
      } else {
        const bin = atob(text.trim());
        const blob = new Uint8Array([...bin].map((c) => c.charCodeAt(0)));
        const salt = blob.slice(0, 16);
        const iv = blob.slice(16, 28);
        const data = blob.slice(28);
        const key = await deriveKey(password, salt);
        const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as unknown as BufferSource }, key, data as unknown as BufferSource);
        setOut(new TextDecoder().decode(plain));
      }
    } catch {
      setError(mode === "decrypt" ? "Decryption failed — wrong password or corrupted data." : "Encryption failed.");
      setOut("");
    }
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block flex-1 min-w-48"><span className="label">Password</span>
            <input className="input font-mono" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <SelField label="Action" value={mode} onChange={setMode} options={[{ value: "encrypt", label: "Encrypt" }, { value: "decrypt", label: "Decrypt" }]} />
          <RunButton onClick={run} label={mode === "encrypt" ? "Encrypt" : "Decrypt"} />
        </OptionsBar>
        {error && <Note kind="error">{error}</Note>}
        <EditorPane value={text} onChange={setText} output={out} inputLabel={mode === "encrypt" ? "Plaintext" : "Ciphertext (base64)"} outputLabel={mode === "encrypt" ? "Ciphertext (base64)" : "Plaintext"} rows={7}
          sample={mode === "encrypt" ? "Secret message" : ""} filename={mode === "encrypt" ? "encrypted.txt" : "decrypted.txt"} />
        <Note>AES-256-GCM with a PBKDF2-derived key (150,000 iterations, random salt per message). There is no password recovery — if you lose the password, the data is gone.</Note>
      </div>
    </ToolLayout>
  );
};

// ── Password generator ──
export const PasswordGeneratorTool: ComponentType = () => {
  const [length, setLength] = useState(20);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [avoidAmbiguous, setAvoid] = useState(false);
  const gen = () => {
    let pool = "";
    if (upper) pool += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (lower) pool += "abcdefghijklmnopqrstuvwxyz";
    if (digits) pool += "0123456789";
    if (symbols) pool += "!@#$%^&*()-_=+[]{};:,.?/";
    if (avoidAmbiguous) pool = pool.replace(/[O0oIl1|]/g, "");
    if (!pool) return "";
    const rand = crypto.getRandomValues(new Uint32Array(length));
    return [...rand].map((n) => pool[n % pool.length]).join("");
  };
  const [passwords, setPasswords] = useState<string[]>([]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block"><span className="label">Length — {length}</span>
            <input type="range" min={6} max={128} value={length} onChange={(e) => setLength(Number(e.target.value))} className="w-40 accent-[var(--color-accent)]" /></label>
          <div>
            <span className="label">Characters</span>
            <Toggle label="A–Z" checked={upper} onChange={setUpper} />
            <Toggle label="a–z" checked={lower} onChange={setLower} />
            <Toggle label="0–9" checked={digits} onChange={setDigits} />
            <Toggle label="!@#$…" checked={symbols} onChange={setSymbols} />
            <Toggle label="Avoid lookalikes (O0, Il)" checked={avoidAmbiguous} onChange={setAvoid} />
          </div>
          <RunButton label="Generate 5" onClick={() => setPasswords(Array.from({ length: 5 }, gen))} />
        </OptionsBar>
        <div className="card divide-y divide-border-subtle overflow-hidden">
          {passwords.map((p, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2">
              <code className="flex-1 font-mono text-sm text-accent break-all">{p}</code>
              <CopyButton text={p} />
            </div>
          ))}
          {passwords.length === 0 && <div className="px-3 py-5 text-sm text-ink-dim text-center">Press Generate — randomness comes from crypto.getRandomValues.</div>}
        </div>
      </div>
    </ToolLayout>
  );
};

// ── Password strength ──
export const PasswordStrengthTool: ComponentType = () => {
  const [pw, setPw] = useState("");
  const s = useMemo(() => {
    if (!pw) return null;
    let pool = 0;
    if (/[a-z]/.test(pw)) pool += 26;
    if (/[A-Z]/.test(pw)) pool += 26;
    if (/\d/.test(pw)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(pw)) pool += 33;
    const entropy = pw.length * Math.log2(pool || 1);
    const guesses = 2 ** entropy;
    // assume 1e10 guesses/sec offline attack
    const seconds = guesses / 1e10;
    const humanTime = (sec: number): string => {
      if (sec < 1) return "instantly";
      const units: [number, string][] = [[60, "seconds"], [60, "minutes"], [24, "hours"], [365, "days"], [100, "years"], [Infinity, "centuries"]];
      let v = sec;
      let name = "seconds";
      for (const [div, label] of units) { if (v < div) { name = label; break; } v /= div; name = label; }
      return v > 1e6 ? `${v.toExponential(2)} ${name}` : `${v.toFixed(1)} ${name}`;
    };
    return {
      entropy,
      pool,
      score: entropy < 28 ? 0 : entropy < 36 ? 1 : entropy < 60 ? 2 : entropy < 80 ? 3 : 4,
      cracked: humanTime(seconds),
      issues: [
        pw.length < 12 && "Shorter than 12 characters",
        !/[A-Z]/.test(pw) && "No uppercase letters",
        !/[a-z]/.test(pw) && "No lowercase letters",
        !/\d/.test(pw) && "No digits",
        !/[^a-zA-Z0-9]/.test(pw) && "No symbols",
        /(.)\1\1/.test(pw) && "Repeated characters",
        /^(?:password|qwerty|admin|letmein|welcome|123456)/i.test(pw) && "Starts with a very common word",
      ].filter(Boolean) as string[],
    };
  }, [pw]);
  const LABELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
  const COLORS = ["text-danger", "text-danger", "text-warning", "text-success", "text-success"];
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <label className="block">
          <span className="label">Password (stays in your browser)</span>
          <input className="input font-mono" type="text" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Type or paste a password…" autoComplete="off" />
        </label>
        {s && (
          <>
            <div className={`card p-4 text-center text-lg font-semibold ${COLORS[s.score]}`}>{LABELS[s.score]} — {s.entropy.toFixed(0)} bits of entropy</div>
            <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
              <div className={`h-full transition-all ${["bg-danger", "bg-danger", "bg-warning", "bg-success", "bg-success"][s.score]}`} style={{ width: `${(s.score + 1) * 20}%` }} />
            </div>
            <StatGrid items={[
              { label: "Character pool", value: `${s.pool} symbols` },
              { label: "Est. offline crack time", value: s.cracked, strong: true },
            ]} />
            {s.issues.length > 0 && (
              <div className="card border-warning/30 p-3.5">
                <div className="text-sm text-warning font-medium mb-1.5">Improvements</div>
                <ul className="list-disc pl-5 text-[13px] text-ink-muted space-y-0.5">{s.issues.map((i) => <li key={i}>{i}</li>)}</ul>
              </div>
            )}
          </>
        )}
        <Note>The estimate assumes a fast offline attack (~10 billion guesses/second). Nothing you type here is stored or sent anywhere.</Note>
      </div>
    </ToolLayout>
  );
};

// ── bcrypt ──
export const BcryptTool: ComponentType = () => {
  const [pw, setPw] = useState("");
  const [rounds, setRounds] = useState(10);
  const [hash, setHash] = useState("");
  const [verify, setVerify] = useState("");
  const [match, setMatch] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (!pw) return;
    setBusy(true);
    const bcrypt = (await import("bcryptjs")).default;
    setHash(await bcrypt.hash(pw, rounds));
    setMatch(null);
    setBusy(false);
  };
  const check = async () => {
    if (!verify || !hash) return;
    setBusy(true);
    const bcrypt = (await import("bcryptjs")).default;
    setMatch(await bcrypt.compare(verify, hash));
    setBusy(false);
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block flex-1 min-w-48"><span className="label">Password</span>
            <input className="input font-mono" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="off" /></label>
          <NumField label="Cost (rounds)" value={rounds} min={4} max={14} onChange={(v) => setRounds(Math.min(14, Math.max(4, v || 10)))} />
          <RunButton onClick={run} busy={busy} disabled={!pw} label="Hash" />
        </OptionsBar>
        {hash && (
          <>
            <OutputArea text={hash} rows={2} label="bcrypt hash" />
            <OptionsBar>
              <label className="block flex-1 min-w-48"><span className="label">Verify a password against this hash</span>
                <input className="input font-mono" value={verify} onChange={(e) => setVerify(e.target.value)} autoComplete="off" /></label>
              <RunButton onClick={check} busy={busy} disabled={!verify} label="Verify" />
              {match !== null && <span className={`self-end text-sm font-medium ${match ? "text-success" : "text-danger"}`}>{match ? "✓ Matches" : "✗ Does not match"}</span>}
            </OptionsBar>
          </>
        )}
        <Note>bcrypt is intentionally slow — that's the point. Cost 10 takes roughly a tenth of a second in your browser; each +1 doubles it.</Note>
      </div>
    </ToolLayout>
  );
};

// ── RSA keygen ──
export const RsaKeygenTool: ComponentType = () => {
  const [bits, setBits] = useState(2048);
  const [keys, setKeys] = useState<{ pub: string; priv: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const generate = async () => {
    setBusy(true);
    setProgress(0.1);
    const pair = await crypto.subtle.generateKey({ name: "RSA-OAEP", modulusLength: bits, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["encrypt", "decrypt"]);
    setProgress(0.6);
    const pem = async (key: CryptoKey, isPublic: boolean) => {
      const exported = await crypto.subtle.exportKey(isPublic ? "spki" : "pkcs8", key);
      const b64Str = b64(exported);
      const lines = b64Str.match(/.{1,64}/g) ?? [];
      return `-----BEGIN ${isPublic ? "PUBLIC" : "PRIVATE"} KEY-----\n${lines.join("\n")}\n-----END ${isPublic ? "PUBLIC" : "PRIVATE"} KEY-----\n`;
    };
    setKeys({ pub: await pem(pair.publicKey, true), priv: await pem(pair.privateKey, false) });
    setProgress(1);
    setBusy(false);
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <SelField label="Key size" value={String(bits)} onChange={(v) => setBits(Number(v))} options={[{ value: "2048", label: "2048 bits (fast)" }, { value: "3072", label: "3072 bits" }, { value: "4096", label: "4096 bits (slow)" }]} />
          <RunButton onClick={generate} busy={busy} label="Generate key pair" />
        </OptionsBar>
        {busy && <ProgressBar value={progress} label="Generating primes (can take a moment)…" />}
        {keys && (
          <>
            <OutputArea text={keys.pub} filename="public.pem" rows={5} label="Public key (PEM — safe to share)" />
            <OutputArea text={keys.priv} filename="private.pem" rows={5} label="Private key (PEM — keep secret!)" />
            <Note kind="warn">The private key was generated in your browser and never left it. Store it somewhere safe — if you only saved it here, it's gone when you close the tab.</Note>
          </>
        )}
      </div>
    </ToolLayout>
  );
};

// ── OTP generator ──
export const OtpTool: ComponentType = () => {
  const [secretB32, setSecretB32] = useState("JBSWY3DPEHPK3PXP");
  const [digits, setDigits] = useState(6);
  const [period, setPeriod] = useState(30);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  const generate = async () => {
    try {
      const { URI, TOTP } = await import("otpauth");
      const totp = new TOTP({ issuer: "LocalToolBox", label: "local", algorithm: "SHA1", digits, period, secret: secretB32.replace(/\s+/g, "").toUpperCase() || undefined });
      setCode(totp.generate());
      setError(null);
      void URI;
    } catch {
      setError("Invalid secret — use standard Base32 (A–Z, 2–7).");
      setCode(null);
    }
  };
  const remaining = period - (now % period);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block flex-1 min-w-56"><span className="label">Base32 secret</span>
            <input className="input font-mono" value={secretB32} onChange={(e) => setSecretB32(e.target.value)} /></label>
          <SelField label="Digits" value={String(digits)} onChange={(v) => setDigits(Number(v))} options={[{ value: "6", label: "6" }, { value: "8", label: "8" }]} />
          <NumField label="Period (s)" value={period} min={15} max={120} step={15} onChange={setPeriod} />
          <RunButton label="Generate code" onClick={generate} />
        </OptionsBar>
        {error && <Note kind="error">{error}</Note>}
        {code && (
          <div className="card p-6 text-center">
            <div className="text-4xl font-mono tracking-[0.3em] text-accent">{code}</div>
            <div className="mt-2 text-sm text-ink-muted">expires in {remaining}s</div>
            <div className="mt-1 h-1 rounded bg-surface-3 overflow-hidden max-w-xs mx-auto">
              <div className="h-full bg-accent transition-[width] duration-1000" style={{ width: `${(remaining / period) * 100}%` }} />
            </div>
          </div>
        )}
        <Note kind="warn">Codes are computed entirely in this tab — nothing is synced or sent. If you need a day-to-day authenticator, use a dedicated app; this tool is for testing and verifying secrets.</Note>
      </div>
    </ToolLayout>
  );
};

// ── JWT generator ──
export const JwtGeneratorTool: ComponentType = () => {
  const [payloadText, setPayloadText] = useState('{\n  "sub": "1234567890",\n  "name": "Local User",\n  "iat": ' + Math.floor(Date.now() / 1000) + "\n}");
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const sign = async () => {
    try {
      const payload = JSON.parse(payloadText);
      const header = { alg: "HS256", typ: "JWT" };
      const enc = new TextEncoder();
      const b64url = (obj: unknown) => btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      const input = `${b64url(header)}.${b64url(payload)}`;
      const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const sig = await crypto.subtle.sign("HMAC", key, enc.encode(input));
      setToken(`${input}.${btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block flex-1 min-w-56"><span className="label">HS256 secret</span>
            <input className="input font-mono" type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="your-256-bit-secret" /></label>
          <RunButton onClick={sign} disabled={!secret} label="Sign JWT" />
        </OptionsBar>
        <EditorPane value={payloadText} onChange={setPayloadText} inputLabel="Payload (JSON)" rows={7} filename="payload.json"
          outputNode={
            <div className="flex flex-col gap-2">
              {error && <Note kind="error">{error}</Note>}
              <OutputArea text={token} rows={4} label="Signed token" filename="token.jwt" />
            </div>
          } />
        <Note>Signs HS256 (symmetric) locally. Never paste a production secret into any web tool you don't fully trust — and remember this page's code is open source, so you can check exactly what it does.</Note>
      </div>
    </ToolLayout>
  );
};

// ── ciphers: caesar + vigenère ──
export const CaesarTool: ComponentType = () => {
  const [text, setText] = useState("");
  const [shift, setShift] = useState(3);
  const out = text.replace(/[a-z]/gi, (ch) => {
    const base = ch <= "Z" ? 65 : 97;
    return String.fromCharCode(((ch.charCodeAt(0) - base + shift + 26 * 100) % 26) + base);
  });
  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} output={out} rows={6} sample="Attack at dawn" filename="caesar.txt"
        options={<OptionsBar>
          <NumField label="Shift" value={shift} min={-25} max={25} onChange={setShift} />
          <div className="flex gap-1.5 self-end flex-wrap">
            {[1, 3, 5, 13, 25].map((s) => <button key={s} className="chip hover:text-ink" onClick={() => setShift(s)}>shift {s}</button>)}
          </div>
        </OptionsBar>} />
    </ToolLayout>
  );
};

export const VigenereTool: ComponentType = () => {
  const [text, setText] = useState("");
  const [key, setKey] = useState("localtoolbox");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const out = useMemo(() => {
    if (!text || !key) return "";
    const k = key.replace(/[^a-z]/gi, "").toLowerCase();
    if (!k) return text;
    let ki = 0;
    return text.replace(/[a-z]/gi, (ch) => {
      const base = ch <= "Z" ? 65 : 97;
      const shift = k.charCodeAt(ki % k.length) - 97;
      ki++;
      const eff = mode === "encode" ? shift : 26 - shift;
      return String.fromCharCode(((ch.charCodeAt(0) - base + eff) % 26) + base);
    });
  }, [text, key, mode]);
  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} output={out} rows={6} sample="Meet me at the bridge" filename="vigenere.txt"
        options={<OptionsBar>
          <label className="block"><span className="label">Key (letters only)</span>
            <input className="input !w-44 font-mono" value={key} onChange={(e) => setKey(e.target.value)} /></label>
          <SelField label="Direction" value={mode} onChange={setMode} options={[{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }]} />
        </OptionsBar>} />
    </ToolLayout>
  );
};

export const tools: Record<string, ComponentType> = {
  "hash-generator": HashGeneratorTool,
  "checksum-calc": ChecksumTool,
  "file-hash": FileHashToolExport,
  "hmac-generator": HmacTool,
  "encryption-aes": AesTool,
  "password-generator": PasswordGeneratorTool,
  "password-strength": PasswordStrengthTool,
  "bcrypt-generator": BcryptTool,
  "rsa-keygen": RsaKeygenTool,
  "otp-generator": OtpTool,
  "jwt-generator": JwtGeneratorTool,
  "caesar-cipher": CaesarTool,
  "vigenere-cipher": VigenereTool,
};
