// Network category — local utilities plus honest network-dependent lookups.
// Network tools show the banner (registry drives it) and disclose exactly what
// is sent. Nothing here uploads user files.
import { useMemo, useState, type ComponentType } from "react";
import ToolLayout from "../../components/ToolLayout";
import { Note, NumField, OptionsBar, OutputArea, RunButton, SelField, StatGrid, Toggle } from "../../components/ui";

// ── DNS lookup (DNS-over-HTTPS, Cloudflare) ──
const DNS_TYPES = ["A", "AAAA", "CNAME", "MX", "NS", "TXT", "SOA", "SRV", "CAA"] as const;
export const DnsLookupTool: ComponentType = () => {
  const [domain, setDomain] = useState("example.com");
  const [type, setType] = useState<string>("A");
  const [result, setResult] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const lookup = async () => {
    const name = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, {
        headers: { accept: "application/dns-json" },
      });
      if (!res.ok) throw new Error(`DNS server responded ${res.status}`);
      const data = await res.json();
      const records: { name: string; type: number; data: string; TTL: number }[] = data.Answer ?? [];
      const typeNames: Record<number, string> = { 1: "A", 28: "AAAA", 5: "CNAME", 15: "MX", 2: "NS", 16: "TXT", 6: "SOA", 33: "SRV", 257: "CAA" };
      if (!records.length) {
        setResult(`No ${type} records for ${name}. (DNSSEC: ${data.AD ? "verified" : "not verified"}, status ${data.Status})`);
      } else {
        setResult(records.map((r) => `${typeNames[r.type] ?? r.type}\t${r.data}\t(TTL ${r.TTL}s)`).join("\n"));
      }
      setHistory((h) => [`${name} (${type})`, ...h].slice(0, 8));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block flex-1 min-w-56"><span className="label">Domain</span>
            <input className="input font-mono" value={domain} onChange={(e) => setDomain(e.target.value)} onKeyDown={(e) => e.key === "Enter" && lookup()} placeholder="example.com" /></label>
          <SelField label="Record type" value={type} onChange={setType} options={DNS_TYPES.map((t) => ({ value: t, label: t }))} />
          <RunButton onClick={lookup} busy={busy} label="Look up" />
        </OptionsBar>
        {error && <Note kind="error">{error}</Note>}
        {result && <OutputArea text={result} rows={5} label="Records" />}
        {history.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {history.map((h, i) => <span key={i} className="chip font-mono">{h}</span>)}
          </div>
        )}
        <Note>Queries Cloudflare DNS-over-HTTPS (1.1.1.1).</Note>
      </div>
    </ToolLayout>
  );
};

// ── WHOIS via RDAP ──
export const WhoisTool: ComponentType = () => {
  const [domain, setDomain] = useState("example.com");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const lookup = async () => {
    const name = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(name)}`, { headers: { accept: "application/rdap+json" } });
      if (res.status === 404) throw new Error("Domain not found in the registry (RDAP returned 404).");
      if (!res.ok) throw new Error(`Registry responded ${res.status}`);
      const data = await res.json();
      const lines: string[] = [];
      lines.push(`Domain: ${(Array.isArray(data.ldhName) ? data.ldhName[0] : data.ldhName) ?? name}`);
      const events = (data.events ?? []).map((e: { eventAction: string; eventDate: string }) => `${e.eventAction}: ${new Date(e.eventDate).toLocaleString()}`);
      lines.push(...events);
      for (const ent of data.entities ?? []) {
        const roles = (ent.roles ?? []).join(",");
        const name2 = ent.vcardArray?.[1]?.find((f: string[]) => f[0] === "fn")?.[3];
        if (roles) lines.push(`${roles}: ${name2 ?? ent.handle ?? "?"}`);
      }
      const ns = (data.nameservers ?? []).map((n: { ldhName: string }) => `NS: ${n.ldhName}`);
      lines.push(...ns);
      if (data.status) lines.push(`Status: ${data.status.join(", ")}`);
      setResult(lines.join("\n"));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block flex-1 min-w-56"><span className="label">Domain</span>
            <input className="input font-mono" value={domain} onChange={(e) => setDomain(e.target.value)} onKeyDown={(e) => e.key === "Enter" && lookup()} /></label>
          <RunButton onClick={lookup} busy={busy} label="WHOIS lookup" />
        </OptionsBar>
        {error && <Note kind="error">{error}</Note>}
        {result && <OutputArea text={result} rows={8} label="Registry data (RDAP)" />}
        <Note>Uses RDAP (rdap.org). Some registries return less than classic port-43 WHOIS, including privacy redactions.</Note>
      </div>
    </ToolLayout>
  );
};

// ── Ping (HTTP reachability — honest about not being ICMP) ──
export const PingTool: ComponentType = () => {
  const [host, setHost] = useState("https://example.com");
  const [count, setCount] = useState(4);
  const [rows, setRows] = useState<{ seq: number; ms: number | null; ok: boolean }[]>([]);
  const [busy, setBusy] = useState(false);
  const ping = async () => {
    let url = host.trim();
    if (!/^https?:\/\//.test(url)) url = "https://" + url;
    setBusy(true);
    setRows([]);
    for (let i = 0; i < Math.min(10, Math.max(1, count)); i++) {
      const t0 = performance.now();
      try {
        await fetch(`${url.replace(/\/$/, "")}/favicon.ico?_=${Date.now()}`, { mode: "no-cors", cache: "no-store" });
        setRows((r) => [...r, { seq: i + 1, ms: performance.now() - t0, ok: true }]);
      } catch {
        setRows((r) => [...r, { seq: i + 1, ms: performance.now() - t0, ok: false }]);
      }
      await new Promise((res) => setTimeout(res, 350));
    }
    setBusy(false);
  };
  const okRows = rows.filter((r) => r.ok);
  const avg = okRows.length ? okRows.reduce((a, r) => a + (r.ms ?? 0), 0) / okRows.length : null;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block flex-1 min-w-56"><span className="label">URL or host</span>
            <input className="input font-mono" value={host} onChange={(e) => setHost(e.target.value)} placeholder="example.com" /></label>
          <NumField label="Probes" value={count} min={1} max={10} onChange={(v) => setCount(Math.min(10, Math.max(1, v || 4)))} />
          <RunButton onClick={ping} busy={busy} label="Start probing" />
        </OptionsBar>
        {rows.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full text-[13px] font-mono">
              <thead><tr className="text-left text-[11px] uppercase text-ink-dim border-b border-border"><th className="px-3 py-2">Probe</th><th className="px-3 py-2">Result</th></tr></thead>
              <tbody className="divide-y divide-border-subtle">
                {rows.map((r) => (
                  <tr key={r.seq}>
                    <td className="px-3 py-1.5">#{r.seq}</td>
                    <td className={`px-3 py-1.5 ${r.ok ? "text-success" : "text-danger"}`}>
                      {r.ok ? `replied in ${r.ms?.toFixed(0)} ms` : "no answer (blocked, offline, or no favicon)"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {avg !== null && <StatGrid items={[{ label: "Average HTTP reply", value: `${avg.toFixed(0)} ms`, strong: true }, { label: "Success rate", value: `${Math.round((okRows.length / rows.length) * 100)}%` }]} />}
        <Note kind="warn">Browsers can't send ICMP, so this is HTTP round-trip time — not a terminal ping.</Note>
      </div>
    </ToolLayout>
  );
};

// ── SSL checker (connection validation, honest) ──
export const SslCheckerTool: ComponentType = () => {
  const [host, setHost] = useState("example.com");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; ms: number; proto: string }>(null);
  const check = async () => {
    let url = host.trim();
    if (!/^https?:\/\//.test(url)) url = "https://" + url;
    setBusy(true);
    setResult(null);
    const t0 = performance.now();
    try {
      await fetch(`${url.replace(/\/$/, "")}/favicon.ico?_=${Date.now()}`, { mode: "no-cors", cache: "no-store" });
      setResult({ ok: true, ms: performance.now() - t0, proto: "HTTPS" });
    } catch {
      setResult({ ok: false, ms: performance.now() - t0, proto: "HTTPS" });
    }
    setBusy(false);
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block flex-1 min-w-56"><span className="label">Domain</span>
            <input className="input font-mono" value={host} onChange={(e) => setHost(e.target.value)} onKeyDown={(e) => e.key === "Enter" && check()} /></label>
          <RunButton onClick={check} busy={busy} label="Check HTTPS" />
        </OptionsBar>
        {result && (
          <div className={`card p-5 text-center ${result.ok ? "text-success" : "text-danger"}`}>
            <div className="text-2xl font-semibold">{result.ok ? "🔒 Valid HTTPS connection" : "✗ HTTPS connection failed"}</div>
            <div className="text-sm text-ink-muted mt-1">
              {result.ok
                ? "Your browser completed the TLS handshake, which means the certificate chain was valid, current, and trusted — otherwise it would have blocked the request."
                : "The TLS handshake failed or the host didn't answer. Could be an expired certificate, no HTTPS support, or an unreachable host."}
            </div>
            <div className="text-xs text-ink-dim mt-1">handshake + first response: {result.ms.toFixed(0)} ms</div>
          </div>
        )}
        <StatGrid items={[{ label: "Details view", value: "SSL Labs (external)", strong: false }]} />
        <a className="btn-ghost self-start" href={`https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(host.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, ""))}`} target="_blank" rel="noreferrer">Open full analysis on SSL Labs ↗</a>
        <Note>Browsers can't read raw certificates from JavaScript. This reports the handshake your browser already validated; SSL Labs has the cert details.</Note>
      </div>
    </ToolLayout>
  );
};

// ── Network speed test (Cloudflare endpoint, documented) ──
export const SpeedTestTool: ComponentType = () => {
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");
  const [mbps, setMbps] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const run = async () => {
    setBusy(true);
    setMbps(null);
    setLatency(null);
    try {
      setPhase("Measuring latency…");
      const lats: number[] = [];
      for (let i = 0; i < 5; i++) {
        const t0 = performance.now();
        await fetch(`https://speed.cloudflare.com/__down?bytes=1&_=${Math.random()}`, { cache: "no-store" });
        lats.push(performance.now() - t0);
      }
      setLatency(Math.min(...lats));
      setPhase("Downloading 25 MB test payload…");
      const t0 = performance.now();
      const res = await fetch(`https://speed.cloudflare.com/__down?bytes=25000000&_=${Math.random()}`, { cache: "no-store" });
      const buf = await res.arrayBuffer();
      const seconds = (performance.now() - t0) / 1000;
      setMbps((buf.byteLength * 8) / seconds / 1e6);
      setPhase("Done.");
    } catch {
      setPhase("Speed endpoint unreachable.");
    }
    setBusy(false);
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar><RunButton onClick={run} busy={busy} label="Start speed test" /></OptionsBar>
        {phase && !busy && <span className="text-sm text-ink-muted">{phase}</span>}
        {busy && phase && <span className="text-sm text-accent">{phase}</span>}
        {(mbps !== null || latency !== null) && (
          <StatGrid items={[
            { label: "Download", value: mbps === null ? "—" : `${mbps.toFixed(1)} Mbps`, strong: true },
            { label: "Best latency", value: latency === null ? "—" : `${latency.toFixed(0)} ms`, strong: true },
          ]} />
        )}
        <Note>Downloads 25 MB from Cloudflare's public speed-test endpoint. Results vary with Wi-Fi, VPNs, and congestion.</Note>
      </div>
    </ToolLayout>
  );
};

// ── IP address info (ipapi.co) ──
export const IpInfoTool: ComponentType = () => {
  const [ip, setIp] = useState("");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lookup = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`https://ipapi.co/${ip.trim() ? encodeURIComponent(ip.trim()) : ""}/json/`);
      if (!res.ok) throw new Error(`ipapi.co responded ${res.status} (free tier is rate-limited)`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  };
  const fields: [string, string][] = [["ip", "IP"], ["version", "IP version"], ["city", "City"], ["region", "Region"], ["country_name", "Country"], ["postal", "Postal code"], ["latitude", "Latitude"], ["longitude", "Longitude"], ["timezone", "Timezone"], ["org", "Network / ISP"], ["asn", "AS number"]];
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block flex-1 min-w-56"><span className="label">IP address (blank = this device's public IP)</span>
            <input className="input font-mono" value={ip} onChange={(e) => setIp(e.target.value)} onKeyDown={(e) => e.key === "Enter" && lookup()} placeholder="8.8.8.8" /></label>
          <RunButton onClick={lookup} busy={busy} label="Look up" />
        </OptionsBar>
        {error && <Note kind="error">{error}</Note>}
        {data && (
          <StatGrid items={fields.filter(([k]) => data[k] !== undefined && data[k] !== "").map(([k, label]) => ({ label, value: String(data[k]) }))} />
        )}
        <Note kind="warn">Sends the IP to ipapi.co. City-level accuracy at best.</Note>
      </div>
    </ToolLayout>
  );
};

// ── Port checker (educational + best-effort HTTPS probe) ──
const PORT_INFO: [number, string, string][] = [
  [20, "FTP data", "Legacy file transfer channel"], [21, "FTP control", "Legacy file transfer"],
  [22, "SSH", "Secure shell / SFTP"], [23, "Telnet", "Unencrypted remote shell — avoid"],
  [25, "SMTP", "Mail relay"], [53, "DNS", "Domain name service"],
  [80, "HTTP", "Web, unencrypted"], [110, "POP3", "Mail retrieval"], [143, "IMAP", "Mail retrieval"],
  [443, "HTTPS", "Web over TLS"], [465, "SMTPS", "Secure mail submission"], [587, "SMTP submission", "Mail sending"],
  [993, "IMAPS", "Secure IMAP"], [3306, "MySQL", "Database"], [3389, "RDP", "Windows remote desktop"],
  [5432, "PostgreSQL", "Database"], [8080, "HTTP alt", "Common web app port"], [8443, "HTTPS alt", "Common TLS app port"],
];
export const PortCheckerTool: ComponentType = () => {
  const [host, setHost] = useState("");
  const [port, setPort] = useState(443);
  const [result, setResult] = useState<{ open: boolean | null; note: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const info = PORT_INFO.find(([p]) => p === port);
  const check = async () => {
    const h = host.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
    if (!h) return;
    setBusy(true);
    if (port === 443 || port === 8443) {
      const t0 = performance.now();
      try {
        await fetch(`https://${h}:${port}/favicon.ico?_=${Date.now()}`, { mode: "no-cors", cache: "no-store" });
        setResult({ open: true, note: `answered in ${(performance.now() - t0).toFixed(0)} ms` });
      } catch {
        setResult({ open: null, note: "no answer — closed, filtered, or the browser blocked the probe" });
      }
    } else {
      setResult({ open: null, note: "browsers can only probe TLS ports from an HTTPS page — see the note below" });
    }
    setBusy(false);
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block flex-1 min-w-48"><span className="label">Host you own or are authorized to test</span>
            <input className="input font-mono" value={host} onChange={(e) => setHost(e.target.value)} placeholder="myserver.example.com" /></label>
          <NumField label="Port" value={port} min={1} max={65535} onChange={(v) => setPort(Math.min(65535, Math.max(1, v || 443)))} />
          <RunButton onClick={check} busy={busy} label="Probe port" />
        </OptionsBar>
        {info && (
          <div className="card p-3 text-[13px]">
            <strong>Port {port}</strong> — {info[1]}: {info[2]}
          </div>
        )}
        {result && (
          <div className={`card p-4 text-sm ${result.open === true ? "text-success" : result.open === false ? "text-danger" : "text-warning"}`}>
            {result.open === true ? `✓ Port ${port} answered` : result.open === false ? `✗ Port ${port} refused` : `? ${result.note}`}
            {result.note && result.open === true ? ` — ${result.note}` : ""}
          </div>
        )}
        <div className="card p-3.5">
          <div className="label">Common ports reference</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[12px] mt-1">
            {PORT_INFO.map(([p, name, desc]) => (
              <button key={p} className="text-left hover:text-accent transition-colors truncate" onClick={() => setPort(p)} title={desc}>
                <span className="font-mono text-accent">{p}</span> {name}
              </button>
            ))}
          </div>
        </div>
        <Note kind="warn">Browsers can't open arbitrary TCP sockets, so this is a best-effort TLS probe, not a real port scan. Only test systems you own.</Note>
      </div>
    </ToolLayout>
  );
};

// ── IP subnet calculator (fully local) ──
export const SubnetCalcTool: ComponentType = () => {
  const [cidr, setCidr] = useState("192.168.1.130/26");
  const info = useMemo(() => {
    const m = cidr.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/);
    if (!m) return null;
    const oct = m.slice(1, 5).map(Number);
    if (oct.some((o) => o > 255)) return null;
    const prefix = Number(m[5]);
    if (prefix > 32) return null;
    const ipInt = oct.reduce((a, o) => a * 256 + o, 0);
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    const network = (ipInt & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const total = 2 ** (32 - prefix);
    const usable = prefix >= 31 ? total : total - 2;
    const toIp = (n: number) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".");
    const first = prefix >= 31 ? network : network + 1;
    const last = prefix >= 31 ? broadcast : broadcast - 1;
    return {
      network: toIp(network), broadcast: toIp(broadcast), mask: toIp(mask),
      wildcard: toIp(~mask >>> 0), first: toIp(first), last: toIp(last),
      total, usable, prefix, classChar: oct[0] < 128 ? "A" : oct[0] < 192 ? "B" : oct[0] < 224 ? "C" : oct[0] < 240 ? "D" : "E",
      isPrivate: oct[0] === 10 || (oct[0] === 172 && oct[1] >= 16 && oct[1] <= 31) || (oct[0] === 192 && oct[1] === 168),
    };
  }, [cidr]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block">
            <span className="label">IPv4 address + CIDR</span>
            <input className="input !w-56 font-mono" value={cidr} onChange={(e) => setCidr(e.target.value)} placeholder="192.168.1.130/26" />
          </label>
          <div className="flex gap-1.5 self-end flex-wrap">
            {["10.0.0.0/8", "172.16.4.21/20", "192.168.1.130/26", "203.0.113.42/29"].map((p) => (
              <button key={p} className="chip font-mono hover:text-ink" onClick={() => setCidr(p)}>{p}</button>
            ))}
          </div>
        </OptionsBar>
        {info ? (
          <StatGrid items={[
            { label: "Network", value: info.network, strong: true },
            { label: "Broadcast", value: info.broadcast, strong: true },
            { label: "First host", value: info.first },
            { label: "Last host", value: info.last },
            { label: "Subnet mask", value: info.mask },
            { label: "Wildcard", value: info.wildcard },
            { label: "Total addresses", value: info.total.toLocaleString() },
            { label: "Usable hosts", value: info.usable.toLocaleString() },
            { label: "Address class", value: `${info.classChar}${info.isPrivate ? " (private range)" : ""}` },
          ]} />
        ) : <Note kind="error">Enter a valid IPv4 CIDR like 192.168.1.130/26.</Note>}
      </div>
    </ToolLayout>
  );
};

// ── URL builder / parser ──
export const UrlBuilderTool: ComponentType = () => {
  const [proto, setProto] = useState("https");
  const [host, setHost] = useState("example.com");
  const [path, setPath] = useState("/search");
  const [params, setParams] = useState("q=local tools\nlang=en");
  const [fragment, setFragment] = useState("");
  const url = useMemo(() => {
    try {
      const u = new URL(`${proto}://${host}${path.startsWith("/") ? path : "/" + path}`);
      for (const line of params.split("\n")) {
        const eq = line.indexOf("=");
        if (eq > 0) u.searchParams.set(line.slice(0, eq).trim(), line.slice(eq + 1).trim());
      }
      if (fragment) u.hash = fragment.startsWith("#") ? fragment : "#" + fragment;
      return u.toString();
    } catch {
      return "";
    }
  }, [proto, host, path, params, fragment]);
  const [parseInput, setParseInput] = useState("https://example.com:8443/docs/guide?lang=en&page=2#setup");
  const parsed = useMemo(() => {
    try {
      const u = new URL(parseInput);
      return [
        ["Protocol", u.protocol.replace(":", "")],
        ["Host", u.hostname],
        ["Port", u.port || (u.protocol === "https:" ? "443 (default)" : "80 (default)")],
        ["Path", u.pathname],
        ["Query string", u.search || "—"],
        ["Parameters", [...u.searchParams.entries()].map(([k, v]) => `${k} = ${v}`).join("\n") || "—"],
        ["Fragment", u.hash || "—"],
        ["Origin", u.origin],
      ] as [string, string][];
    } catch {
      return null;
    }
  }, [parseInput]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <div className="card p-3.5 grid sm:grid-cols-2 gap-3">
          <label className="block"><span className="label">Protocol</span>
            <select className="select" value={proto} onChange={(e) => setProto(e.target.value)}>
              {["https", "http", "ftp", "ws", "wss"].map((p) => <option key={p}>{p}</option>)}
            </select></label>
          <label className="block"><span className="label">Host</span>
            <input className="input font-mono" value={host} onChange={(e) => setHost(e.target.value)} /></label>
          <label className="block"><span className="label">Path</span>
            <input className="input font-mono" value={path} onChange={(e) => setPath(e.target.value)} /></label>
          <label className="block"><span className="label">Fragment (#)</span>
            <input className="input font-mono" value={fragment} onChange={(e) => setFragment(e.target.value)} /></label>
          <label className="block sm:col-span-2"><span className="label">Query parameters (one per line: key=value)</span>
            <textarea className="textarea" rows={3} value={params} onChange={(e) => setParams(e.target.value)} /></label>
        </div>
        <OutputArea text={url} rows={2} label="Built URL" />
        <div className="card p-3.5 flex flex-col gap-2">
          <span className="label !mb-0">Parse an existing URL</span>
          <input className="input font-mono" value={parseInput} onChange={(e) => setParseInput(e.target.value)} />
        </div>
        {parsed && (
          <div className="card divide-y divide-border-subtle overflow-hidden">
            {parsed.map(([k, v]) => (
              <div key={k} className="flex gap-3 px-3 py-1.5 text-[13px]">
                <span className="w-28 text-ink-dim shrink-0">{k}</span>
                <code className="font-mono break-all whitespace-pre-wrap">{v}</code>
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
export const UrlParserTool: ComponentType = () => <UrlBuilderTool />;

// ── User agent parser (local regexes) ──
export const UserAgentTool: ComponentType = () => {
  const [ua, setUa] = useState(navigator.userAgent);
  const parsed = useMemo(() => {
    const s = ua;
    const browser =
      /Edg\/([\d.]+)/.exec(s) ? { name: "Edge", version: RegExp.$1 } :
      /OPR\/([\d.]+)/.exec(s) ? { name: "Opera", version: RegExp.$1 } :
      /Chrome\/([\d.]+)/.exec(s) ? { name: "Chrome", version: RegExp.$1 } :
      /Firefox\/([\d.]+)/.exec(s) ? { name: "Firefox", version: RegExp.$1 } :
      /Version\/([\d.]+).*Safari/.exec(s) ? { name: "Safari", version: RegExp.$1 } :
      { name: "Unknown", version: "—" };
    const os =
      /Windows NT 10/.test(s) ? "Windows 10/11" :
      /Windows NT ([\d.]+)/.exec(s) ? `Windows NT ${RegExp.$1}` :
      /Mac OS X ([\d_.]+)/.exec(s) ? `macOS ${RegExp.$1.replace(/_/g, ".")}` :
      /Android ([\d.]+)/.exec(s) ? `Android ${RegExp.$1}` :
      /(iPhone|iPad)/.test(s) ? `iOS ${/OS ([\d_]+)/.exec(s)?.[1]?.replace(/_/g, ".") ?? ""}` :
      /Linux/.test(s) ? "Linux" : "Unknown OS";
    const device = /Mobile/.test(s) ? "Mobile" : /Tablet|iPad/.test(s) ? "Tablet" : "Desktop";
    const engine = /Gecko\/|Firefox/.test(s) && !/like Gecko/.test(s) ? "Gecko" : /AppleWebKit/.test(s) ? (/Chrome|Edg|OPR/.test(s) ? "Blink" : "WebKit") : "Unknown";
    return { browser, os, device, engine };
  }, [ua]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <label className="block">
          <span className="label">User-Agent string</span>
          <textarea className="textarea" rows={3} value={ua} onChange={(e) => setUa(e.target.value)} />
        </label>
        <StatGrid items={[
          { label: "Browser", value: `${parsed.browser.name} ${parsed.browser.version}`, strong: true },
          { label: "Operating system", value: parsed.os, strong: true },
          { label: "Device type", value: parsed.device },
          { label: "Rendering engine", value: parsed.engine },
        ]} />
        <button className="btn-ghost self-start" onClick={() => setUa(navigator.userAgent)}>Reset to this browser's UA</button>
        <Note>UA strings are often frozen (Chromium browsers all say "Chrome") — engine and version are best-effort.</Note>
      </div>
    </ToolLayout>
  );
};

// ── HTTP headers reference ──
const HEADERS: [string, string, string][] = [
  ["Accept", "Request", "Content types the client can handle (text/html, application/json…)"],
  ["Accept-Encoding", "Request", "Compression algorithms supported (gzip, br, zstd)"],
  ["Authorization", "Request", "Credentials (Bearer tokens, Basic) for authenticated requests"],
  ["Cache-Control", "Both", "Caching policy: max-age, no-cache, no-store, immutable"],
  ["Content-Disposition", "Response", "Inline vs attachment; sets download filename"],
  ["Content-Length", "Both", "Body size in bytes"],
  ["Content-Security-Policy", "Response", "Whitelist of script/style/frame sources; core XSS defense"],
  ["Content-Type", "Both", "Media type of the body (application/json; charset=utf-8)"],
  ["Cookie / Set-Cookie", "Both", "Session state; Set-Cookie carries HttpOnly, Secure, SameSite"],
  ["Cross-Origin-Embedder-Policy", "Response", "require-corp enables SharedArrayBuffer / threaded WASM"],
  ["Cross-Origin-Opener-Policy", "Response", "same-origin isolates the browsing context"],
  ["ETag", "Response", "Version identifier for conditional requests (If-None-Match)"],
  ["Host", "Request", "Target host and port — required in HTTP/1.1"],
  ["Location", "Response", "Redirect target for 3xx responses"],
  ["Origin", "Request", "Where the request came from; core of the CORS model"],
  ["Referer", "Request", "Previous page URL (historic misspelling of Referrer)"],
  ["Retry-After", "Response", "Seconds or date to wait after 429/503"],
  ["Strict-Transport-Security", "Response", "Forces HTTPS for future visits (HSTS)"],
  ["User-Agent", "Request", "Client software identifier"],
  ["X-Content-Type-Options", "Response", "nosniff prevents MIME-type guessing"],
  ["X-Frame-Options", "Response", "DENY / SAMEORIGIN clickjacking protection"],
  ["Access-Control-Allow-Origin", "Response", "CORS: which origins may read the response"],
];
export const HttpHeadersTool: ComponentType = () => {
  const [q, setQ] = useState("");
  const list = HEADERS.filter(([n, dir, d]) => (n + dir + d).toLowerCase().includes(q.toLowerCase()));
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <input className="input max-w-sm" placeholder="Search headers…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search HTTP headers" />
        <div className="card divide-y divide-border-subtle overflow-hidden">
          {list.map(([name, dir, desc]) => (
            <div key={name} className="px-3 py-2.5">
              <div className="flex items-center gap-2">
                <code className="font-mono text-sm text-accent">{name}</code>
                <span className={`chip ${dir === "Request" ? "!text-info !border-info/30" : dir === "Response" ? "!text-success !border-success/30" : ""}`}>{dir}</span>
              </div>
              <p className="text-[13px] text-ink-muted mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
};

// ── .htaccess generator ──
export const HtaccessTool: ComponentType = () => {
  const [https, setHttps] = useState(true);
  const [www, setWww] = useState<"none" | "to-www" | "to-naked">("none");
  const [spa, setSpa] = useState(false);
  const [cache, setCache] = useState(true);
  const [gzip, setGzip] = useState(true);
  const [custom, setCustom] = useState("");
  const rules = useMemo(() => {
    const r: string[] = ["# Generated by LocalToolBox htaccess generator", "RewriteEngine On", ""];
    if (https) r.push("# Force HTTPS", "RewriteCond %{HTTPS} off", "RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]", "");
    if (www === "to-www") r.push("# Force www", "RewriteCond %{HTTP_HOST} !^www\\.", "RewriteRule ^(.*)$ https://www.%{HTTP_HOST}%{REQUEST_URI} [L,R=301]", "");
    if (www === "to-naked") r.push("# Strip www", "RewriteCond %{HTTP_HOST} ^www\\.", "RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]", "");
    if (spa) r.push("# SPA fallback — serve index.html for unknown paths", "RewriteCond %{REQUEST_FILENAME} !-f", "RewriteCond %{REQUEST_FILENAME} !-d", "RewriteRule ^ index.html [L]", "");
    if (cache) r.push("# Static asset caching", "<IfModule mod_expires.c>", "  ExpiresActive On", "  ExpiresByType text/css \"access plus 1 year\"", "  ExpiresByType application/javascript \"access plus 1 year\"", "  ExpiresByType image/webp \"access plus 1 year\"", "  ExpiresByType image/png \"access plus 1 month\"", "  ExpiresByType image/jpeg \"access plus 1 month\"", "</IfModule>", "");
    if (gzip) r.push("# Compression", "<IfModule mod_deflate.c>", "  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml", "</IfModule>", "");
    if (custom) r.push("# Custom rules", custom, "");
    return r.join("\n");
  }, [https, www, spa, cache, gzip, custom]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <div>
            <span className="label">Rules</span>
            <Toggle label="Force HTTPS" checked={https} onChange={setHttps} />
            <Toggle label="SPA fallback to index.html" checked={spa} onChange={setSpa} />
            <Toggle label="Browser caching (Expires)" checked={cache} onChange={setCache} />
            <Toggle label="Gzip compression" checked={gzip} onChange={setGzip} />
          </div>
          <SelField label="Canonical host" value={www} onChange={setWww} options={[
            { value: "none", label: "Leave as-is" }, { value: "to-www", label: "Redirect to www" }, { value: "to-naked", label: "Redirect to naked domain" },
          ]} />
        </OptionsBar>
        <label className="block">
          <span className="label">Custom rules (appended verbatim)</span>
          <textarea className="textarea" rows={3} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="# Redirect old page\nRedirect 301 /old /new" />
        </label>
        <OutputArea text={rules} filename=".htaccess" rows={12} label=".htaccess" />
      </div>
    </ToolLayout>
  );
};

// ── robots.txt generator ──
export const RobotsTxtTool: ComponentType = () => {
  const [allowAll, setAllowAll] = useState(true);
  const [blocked, setBlocked] = useState("/private/\n/tmp/");
  const [crawlDelay, setCrawlDelay] = useState(0);
  const [sitemap, setSitemap] = useState("https://example.com/sitemap.xml");
  const [disallowAi, setDisallowAi] = useState(false);
  const output = useMemo(() => {
    const lines: string[] = ["User-agent: *"];
    if (!allowAll) {
      lines.push("Disallow:");
    } else {
      lines.push("Allow: /");
      for (const b of blocked.split("\n").map((l) => l.trim()).filter(Boolean)) lines.push(`Disallow: ${b}`);
    }
    if (crawlDelay > 0) lines.push(`Crawl-delay: ${crawlDelay}`);
    if (disallowAi) {
      lines.push("", "# AI crawlers", "User-agent: GPTBot", "Disallow: /", "User-agent: CCBot", "Disallow: /");
    }
    if (sitemap) lines.push("", `Sitemap: ${sitemap}`);
    return lines.join("\n") + "\n";
  }, [allowAll, blocked, crawlDelay, sitemap, disallowAi]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <Toggle label="Allow everything except the paths below" checked={allowAll} onChange={setAllowAll} />
          <NumField label="Crawl-delay (s, 0 = none)" value={crawlDelay} min={0} max={30} onChange={(v) => setCrawlDelay(Math.max(0, v || 0))} />
          <Toggle label="Block common AI crawlers (GPTBot, CCBot)" checked={disallowAi} onChange={setDisallowAi} />
        </OptionsBar>
        <label className="block">
          <span className="label">Disallowed paths (one per line)</span>
          <textarea className="textarea" rows={3} value={blocked} onChange={(e) => setBlocked(e.target.value)} disabled={!allowAll} />
        </label>
        <label className="block">
          <span className="label">Sitemap URL</span>
          <input className="input font-mono" value={sitemap} onChange={(e) => setSitemap(e.target.value)} />
        </label>
        <OutputArea text={output} filename="robots.txt" rows={8} label="robots.txt" />
      </div>
    </ToolLayout>
  );
};

export const tools: Record<string, ComponentType> = {
  "dns-lookup": DnsLookupTool,
  "whois": WhoisTool,
  "ping-tool": PingTool,
  "ssl-checker": SslCheckerTool,
  "network-speed-test": SpeedTestTool,
  "ip-address": IpInfoTool,
  "port-checker": PortCheckerTool,
  "ip-subnet-calc": SubnetCalcTool,
  "url-builder": UrlBuilderTool,
  "url-parser": UrlParserTool,
  "user-agent": UserAgentTool,
  "http-headers": HttpHeadersTool,
  "htaccess-gen": HtaccessTool,
  "robots-txt": RobotsTxtTool,
};

