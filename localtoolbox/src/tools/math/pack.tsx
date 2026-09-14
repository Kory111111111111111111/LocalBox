// Math & Numbers category — 20 tools, all local.
import { useMemo, useState, type ComponentType } from "react";
import ToolLayout from "../../components/ToolLayout";
import { Note, NumField, OptionsBar, RunButton, SelField, StatGrid, OutputArea, Toggle } from "../../components/ui";
import { CopyButton } from "../../components/ui";

const fmt = (n: number, d = 6) => {
  if (!Number.isFinite(n)) return "—";
  const r = parseFloat(n.toFixed(d));
  return Math.abs(r) >= 1e15 || (Math.abs(r) < 1e-6 && r !== 0) ? r.toExponential(6) : r.toLocaleString(undefined, { maximumFractionDigits: d });
};

export const FactorialTool: ComponentType = () => {
  const [n, setN] = useState(10);
  const [r, setR] = useState(5);
  const fact = (x: number): bigint => { let out = 1n; for (let i = 2n; i <= BigInt(x); i++) out *= i; return out; };
  const comb = useMemo(() => {
    if (r > n || r < 0) return null;
    const denom = fact(r) * fact(n - r);
    return { c: fact(n) / denom, p: fact(n) / fact(n - r) };
  }, [n, r]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="n" value={n} min={0} max={5000} onChange={(v) => setN(Math.min(5000, Math.max(0, Math.floor(v || 0))))} />
          <NumField label="r (for C/P)" value={r} min={0} max={5000} onChange={(v) => setR(Math.min(5000, Math.max(0, Math.floor(v || 0))))} />
        </OptionsBar>
        <StatGrid items={[
          { label: `${n}!`, value: fact(Math.min(n, 2000)).toString().slice(0, 40) + (n > 2000 ? "… (too long)" : ""), strong: true },
          { label: `C(${n}, ${r})`, value: comb ? comb.c.toString() : "r must be ≤ n" },
          { label: `P(${n}, ${r})`, value: comb ? comb.p.toString() : "—" },
        ]} />
        {n > 200 && <Note>Factorials above ~2000! have millions of digits; display is trimmed but the math is exact (BigInt).</Note>}
      </div>
    </ToolLayout>
  );
};

export const TriangleTool: ComponentType = () => {
  const [mode, setMode] = useState<"sss" | "sas">("sss");
  const [a, setA] = useState(3);
  const [b, setB] = useState(4);
  const [c, setC] = useState(5);
  const [angle, setAngle] = useState(90);
  const res = useMemo(() => {
    if (mode === "sss") {
      if (a + b <= c || a + c <= b || b + c <= a) return { error: "These sides cannot form a triangle (sum of two sides must exceed the third)." };
      const A = Math.acos((b * b + c * c - a * a) / (2 * b * c)) * 180 / Math.PI;
      const B = Math.acos((a * a + c * c - b * b) / (2 * a * c)) * 180 / Math.PI;
      const s = (a + b + c) / 2;
      return { A, B, C: 180 - A - B, area: Math.sqrt(s * (s - a) * (s - b) * (s - c)), per: a + b + c };
    }
    if (a + b <= c || angle <= 0 || angle >= 180) return { error: "Invalid SAS input." };
    const cc = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(angle * Math.PI / 180));
    const A = Math.acos((b * b + cc * cc - a * a) / (2 * b * cc)) * 180 / Math.PI;
    const s = (a + b + cc) / 2;
    return { A, B: 180 - A - angle, C: angle, area: Math.sqrt(s * (s - a) * (s - b) * (s - cc)), per: a + b + cc, third: cc };
  }, [mode, a, b, c, angle]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <SelField label="Method" value={mode} onChange={setMode} options={[{ value: "sss", label: "SSS (three sides)" }, { value: "sas", label: "SAS (two sides + angle)" }]} />
          <NumField label="Side a" value={a} onChange={setA} />
          <NumField label={mode === "sss" ? "Side b" : "Side b"} value={b} onChange={setB} />
          {mode === "sss"
            ? <NumField label="Side c" value={c} onChange={setC} />
            : <NumField label="Angle between (°)" value={angle} min={1} max={179} onChange={setAngle} />}
        </OptionsBar>
        {"error" in res ? <Note kind="error">{res.error as string}</Note> : (
          <StatGrid items={[
            { label: "Area", value: fmt((res as { area: number }).area), strong: true },
            { label: "Perimeter", value: fmt((res as { per: number }).per), strong: true },
            ...(mode === "sas" ? [{ label: "Third side", value: fmt((res as { third: number }).third) }] : []),
            { label: "Angle A", value: `${fmt((res as { A: number }).A, 3)}°` },
            { label: "Angle B", value: `${fmt((res as { B: number }).B, 3)}°` },
            { label: "Angle C", value: `${fmt((res as { C: number }).C, 3)}°` },
          ]} />
        )}
      </div>
    </ToolLayout>
  );
};

export const CircleTool: ComponentType = () => {
  const [known, setKnown] = useState("r");
  const [v, setV] = useState(5);
  const r = known === "r" ? v : known === "d" ? v / 2 : known === "c" ? v / (2 * Math.PI) : Math.sqrt(v / Math.PI);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <SelField label="Given" value={known} onChange={setKnown} options={[{ value: "r", label: "Radius" }, { value: "d", label: "Diameter" }, { value: "c", label: "Circumference" }, { value: "a", label: "Area" }]} />
          <NumField label="Value" value={v} onChange={setV} />
        </OptionsBar>
        <StatGrid items={[
          { label: "Radius", value: fmt(r), strong: true },
          { label: "Diameter", value: fmt(r * 2), strong: true },
          { label: "Circumference", value: fmt(2 * Math.PI * r) },
          { label: "Area", value: fmt(Math.PI * r * r) },
        ]} />
      </div>
    </ToolLayout>
  );
};

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function words(n: number): string {
  if (n < 0) return "negative " + words(-n);
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "");
  if (n < 1000) return ONES[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + words(n % 100) : "");
  const scales: [number, string][] = [[1e9, "billion"], [1e6, "million"], [1e3, "thousand"]];
  for (const [s, name] of scales) {
    if (n >= s) return words(Math.floor(n / s)) + " " + name + (n % s ? " " + words(n % s) : "");
  }
  return String(n);
}
function ordinal(n: number): string {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : n % 10 === 1 ? "st" : n % 10 === 2 ? "nd" : n % 10 === 3 ? "rd" : "th";
  return words(n) + suffix;
}
export const NumberToWordsTool: ComponentType = () => {
  const [n, setN] = useState(316);
  const safe = Math.floor(Math.abs(n));
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="Number (integer)" value={n} onChange={(v) => setN(Math.floor(v || 0))} />
        </OptionsBar>
        <OutputArea text={safe <= 999999999999 ? `${n < 0 ? "negative " : ""}${words(Math.abs(safe))}` : "(out of supported range: up to 999,999,999,999)"} label="Cardinal" rows={2} />
        <OutputArea text={safe <= 999 && safe >= 0 ? ordinal(safe) : "(ordinals shown for 0–999)"} label="Ordinal" rows={2} />
      </div>
    </ToolLayout>
  );
};

export const PercentageCalcTool: ComponentType = () => {
  const [x, setX] = useState(15);
  const [of, setOf] = useState(200);
  const [isWhatOf, setIsWhatOf] = useState({ a: 30, b: 150 });
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="Percent" value={x} onChange={setX} />
          <NumField label="of value" value={of} onChange={setOf} />
          <span className="self-end text-sm font-mono text-accent">= {fmt((x / 100) * of)}</span>
        </OptionsBar>
        <OptionsBar>
          <NumField label="Value a" value={isWhatOf.a} onChange={(v) => setIsWhatOf((s) => ({ ...s, a: v }))} />
          <NumField label="as % of b" value={isWhatOf.b} onChange={(v) => setIsWhatOf((s) => ({ ...s, b: v }))} />
          <span className="self-end text-sm font-mono text-accent">= {fmt((isWhatOf.a / isWhatOf.b) * 100)}%</span>
        </OptionsBar>
      </div>
    </ToolLayout>
  );
};

export const PercentageChangeTool: ComponentType = () => {
  const [from, setFrom] = useState(80);
  const [to, setTo] = useState(100);
  const [percent, setPercent] = useState(25);
  const [base, setBase] = useState(200);
  const change = ((to - from) / Math.abs(from)) * 100;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="From" value={from} onChange={setFrom} />
          <NumField label="To" value={to} onChange={setTo} />
          <span className={`self-end text-sm font-mono ${change >= 0 ? "text-success" : "text-danger"}`}>
            {change >= 0 ? "+" : ""}{fmt(change)}%
          </span>
        </OptionsBar>
        <OptionsBar>
          <NumField label="Percent" value={percent} onChange={setPercent} />
          <NumField label="of base" value={base} onChange={setBase} />
          <span className="self-end text-sm font-mono text-accent">= {fmt((percent / 100) * base)}</span>
        </OptionsBar>
      </div>
    </ToolLayout>
  );
};

export const ScientificCalcTool: ComponentType = () => {
  const [expr, setExpr] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const evaluate = () => {
    try {
      const safe = expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/π/g, "Math.PI").replace(/\be\b/g, "Math.E");
      if (!/^[-+*/().,\d\s%^]|Math\.(PI|E)/.test(safe)) throw new Error();
      // eslint-disable-next-line no-new-func
      const val = Function(`"use strict";const pow=Math.pow;const sqrt=Math.sqrt;const sin=Math.sin;const cos=Math.cos;const tan=Math.tan;const log=Math.log10;const ln=Math.log;const abs=Math.abs;const round=Math.round;const floor=Math.floor;const ceil=Math.ceil;return (${safe.replace(/\^/g, "**")})`)();
      if (typeof val !== "number" || !Number.isFinite(val)) throw new Error();
      setHistory((h) => [`${expr} = ${fmt(val)}`, ...h].slice(0, 10));
      setExpr(String(val));
    } catch {
      setHistory((h) => [`${expr} = error`, ...h].slice(0, 10));
    }
  };
  const keys = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", ".", "(", ")"];
  const fns = ["sin(", "cos(", "tan(", "log(", "ln(", "sqrt(", "abs(", "^", "π", "e"];
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4 max-w-md">
        <input
          className="input !text-2xl !font-mono text-right !py-3"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && evaluate()}
          placeholder="0"
          aria-label="Expression"
        />
        <div className="grid grid-cols-4 gap-2">
          {fns.map((f) => <button key={f} className="btn-ghost font-mono" onClick={() => setExpr((x) => x + f)}>{f.replace("(", "")}</button>)}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {keys.map((k) => (
            <button key={k} className="btn-ghost !text-base font-mono" onClick={() => setExpr((x) => x + (k === "−" ? "-" : k))}>{k}</button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button className="btn-danger" onClick={() => setExpr("")}>C</button>
          <button className="btn-ghost" onClick={() => setExpr((x) => x.slice(0, -1))}>⌫</button>
          <button className="btn-primary" onClick={evaluate}>=</button>
        </div>
        {history.length > 0 && (
          <div className="card p-3 text-[13px] font-mono space-y-1">
            {history.map((h, i) => <div key={i} className="text-ink-muted">{h}</div>)}
          </div>
        )}
        <Note>Supports + − × ÷, ^ powers, parentheses, and functions sin, cos, tan, log, ln, sqrt, abs. Evaluated locally with a restricted evaluator — no math library, no network.</Note>
      </div>
    </ToolLayout>
  );
};

export const NumberBaseTool: ComponentType = () => {
  const [value, setValue] = useState("316");
  const [base, setBase] = useState(10);
  const parsed = useMemo(() => {
    try { return parseInt(value.replace(/\s/g, ""), base); } catch { return NaN; }
  }, [value, base]);
  const valid = Number.isFinite(parsed);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block">
            <span className="label">Value</span>
            <input className="input !w-44 font-mono" value={value} onChange={(e) => setValue(e.target.value)} />
          </label>
          <SelField label="Input base" value={String(base)} onChange={(v) => setBase(Number(v))}
            options={[{ value: "2", label: "Binary (2)" }, { value: "8", label: "Octal (8)" }, { value: "10", label: "Decimal (10)" }, { value: "16", label: "Hex (16)" }]} />
        </OptionsBar>
        {valid ? (
          <StatGrid items={[
            { label: "Binary", value: parsed.toString(2), strong: true },
            { label: "Octal", value: parsed.toString(8), strong: true },
            { label: "Decimal", value: parsed.toString(10), strong: true },
            { label: "Hexadecimal", value: parsed.toString(16).toUpperCase(), strong: true },
            { label: "Base 36", value: parsed.toString(36) },
            { label: "Bit length", value: `${parsed.toString(2).length} bits` },
          ]} />
        ) : <Note kind="error">“{value}” is not a valid base-{base} number.</Note>}
      </div>
    </ToolLayout>
  );
};

export const PrimeCheckerTool: ComponentType = () => {
  const [n, setN] = useState(97);
  const res = useMemo(() => {
    const v = Math.floor(Math.abs(n));
    if (v < 2) return { prime: false, next: 2 };
    for (let i = 2; i * i <= v; i++) if (v % i === 0) return { prime: false, divisor: i, next: null };
    return { prime: true, next: null };
  }, [n]);
  const nextPrime = useMemo(() => {
    let v = Math.floor(Math.abs(n)) + 1;
    while (v < 1e12) {
      let p = v >= 2;
      for (let i = 2; i * i <= v; i++) if (v % i === 0) { p = false; break; }
      if (p) return v;
      v++;
    }
    return null;
  }, [n]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="Number" value={n} min={0} onChange={(v) => setN(Math.floor(v || 0))} />
        </OptionsBar>
        <div className={`card p-5 text-center text-lg font-semibold ${res.prime ? "text-success" : "text-danger"}`}>
          {res.prime ? `${Math.floor(Math.abs(n))} is prime ✓` : `${Math.floor(Math.abs(n))} is not prime${res.divisor ? ` (divisible by ${res.divisor})` : ""}`}
        </div>
        {nextPrime !== null && <StatGrid items={[{ label: "Next prime after it", value: String(nextPrime), strong: true }]} />}
      </div>
    </ToolLayout>
  );
};

export const PrimeFactorTool: ComponentType = () => {
  const [n, setN] = useState(360);
  const factors = useMemo(() => {
    let v = Math.floor(Math.abs(n));
    const out: number[] = [];
    for (let d = 2; d * d <= v && out.length < 10000; d++) {
      while (v % d === 0) { out.push(d); v /= d; }
    }
    if (v > 1) out.push(v);
    return out;
  }, [n]);
  const grouped = factors.reduce<Record<number, number>>((acc, f) => { acc[f] = (acc[f] ?? 0) + 1; return acc; }, {});
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="Number" value={n} min={2} onChange={(v) => setN(Math.floor(v || 2))} />
        </OptionsBar>
        <div className="grid grid-cols-2 gap-4">
          <OutputArea text={factors.join(" × ")} label="Prime factors" rows={3} />
          <OutputArea text={Object.entries(grouped).map(([p, e]) => (e === 1 ? p : `${p}^${e}`)).join(" × ")} label="Exponent form" rows={3} />
        </div>
      </div>
    </ToolLayout>
  );
};

export const GcdLcmTool: ComponentType = () => {
  const [a, setA] = useState(48);
  const [b, setB] = useState(36);
  const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y));
  const g = gcd(Math.abs(Math.floor(a)), Math.abs(Math.floor(b)));
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="First number" value={a} onChange={setA} />
          <NumField label="Second number" value={b} onChange={setB} />
        </OptionsBar>
        <StatGrid items={[
          { label: "GCD", value: String(g), strong: true },
          { label: "LCM", value: String(g ? Math.abs(Math.floor(a) * Math.floor(b)) / g : 0), strong: true },
        ]} />
      </div>
    </ToolLayout>
  );
};

export const FibonacciTool: ComponentType = () => {
  const [n, setN] = useState(20);
  const seq = useMemo(() => {
    const out: bigint[] = [];
    let a = 0n;
    let b = 1n;
    for (let i = 0; i < Math.min(n, 500); i++) {
      out.push(a);
      [a, b] = [b, a + b];
    }
    return out;
  }, [n]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="How many terms" value={n} min={1} max={500} onChange={(v) => setN(Math.min(500, Math.max(1, Math.floor(v || 1))))} />
        </OptionsBar>
        <OutputArea text={seq.join(", ")} filename="fibonacci.txt" label={`First ${seq.length} Fibonacci numbers`} rows={6} />
      </div>
    </ToolLayout>
  );
};

export const RandomNumberTool: ComponentType = () => {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(1);
  const [unique, setUnique] = useState(false);
  const [result, setResult] = useState<number[]>([]);
  const run = () => {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    const out: number[] = [];
    if (unique) {
      const pool = Array.from({ length: Math.max(0, hi - lo + 1) }, (_, i) => lo + i);
      for (let i = 0; i < Math.min(count, pool.length); i++) {
        const j = crypto.getRandomValues(new Uint32Array(1))[0] % pool.length;
        out.push(pool.splice(j, 1)[0]);
      }
    } else {
      for (let i = 0; i < Math.min(count, 10000); i++) {
        out.push(lo + (crypto.getRandomValues(new Uint32Array(1))[0] % (hi - lo + 1)));
      }
    }
    setResult(out);
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="Min" value={min} onChange={setMin} />
          <NumField label="Max" value={max} onChange={setMax} />
          <NumField label="How many" value={count} min={1} max={10000} onChange={(v) => setCount(Math.max(1, v))} />
          <Toggle label="Unique values only" checked={unique} onChange={setUnique} />
          <RunButton label="Generate" onClick={run} />
        </OptionsBar>
        <OutputArea text={result.join(", ")} filename="random-numbers.txt" rows={4} label={`Result (${result.length})`} />
        {result.length === 1 && <div className="card p-6 text-center text-4xl font-mono text-accent">{result[0]}</div>}
      </div>
    </ToolLayout>
  );
};

export const StatisticsTool: ComponentType = () => {
  const [text, setText] = useState("12, 15, 11, 18, 16, 14, 13, 19, 12, 20");
  const stats = useMemo(() => {
    const nums = text.split(/[\s,;]+/).map(Number).filter((n) => Number.isFinite(n));
    if (nums.length === 0) return null;
    const sorted = [...nums].sort((a, b) => a - b);
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = sum / nums.length;
    const median = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    const freq: Record<number, number> = {};
    nums.forEach((n) => (freq[n] = (freq[n] ?? 0) + 1));
    const maxFreq = Math.max(...Object.values(freq));
    const variance = nums.reduce((a, n) => a + (n - mean) ** 2, 0) / nums.length;
    return {
      n: nums.length, sum, mean, median,
      mode: maxFreq > 1 ? Object.entries(freq).filter(([, f]) => f === maxFreq).map(([v]) => v).join(", ") : "none",
      min: sorted[0], max: sorted[sorted.length - 1],
      range: sorted[sorted.length - 1] - sorted[0],
      varPop: variance, sdPop: Math.sqrt(variance),
      sdSample: nums.length > 1 ? Math.sqrt(nums.reduce((a, n) => a + (n - mean) ** 2, 0) / (nums.length - 1)) : 0,
    };
  }, [text]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <label className="block">
          <span className="label">Numbers (separated by spaces, commas, or semicolons)</span>
          <textarea className="textarea" rows={4} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        {stats && (
          <StatGrid items={[
            { label: "Count", value: String(stats.n) },
            { label: "Sum", value: fmt(stats.sum), strong: true },
            { label: "Mean", value: fmt(stats.mean), strong: true },
            { label: "Median", value: fmt(stats.median), strong: true },
            { label: "Mode", value: stats.mode },
            { label: "Min", value: fmt(stats.min) },
            { label: "Max", value: fmt(stats.max) },
            { label: "Range", value: fmt(stats.range) },
            { label: "Std dev (sample)", value: fmt(stats.sdSample) },
            { label: "Std dev (population)", value: fmt(stats.sdPop) },
            { label: "Variance", value: fmt(stats.varPop) },
          ]} />
        )}
      </div>
    </ToolLayout>
  );
};

export const MatrixTool: ComponentType = () => {
  const [size, setSize] = useState(2);
  const [a, setA] = useState<number[][]>([[1, 2], [3, 4]]);
  const [b, setB] = useState<number[][]>([[5, 6], [7, 8]]);
  const setMatrix = (which: "a" | "b", r: number, c: number, v: number) => {
    const setter = which === "a" ? setA : setB;
    setter((old) => old.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? v : cell)) : row)));
  };
  const resize = (n: number) => {
    const blank = (m: number[][]) => Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => m?.[r]?.[c] ?? 0));
    setA(blank(a));
    setB(blank(b));
    setSize(n);
  };
  const mul = useMemo(() => {
    const out = Array.from({ length: size }, () => new Array(size).fill(0));
    for (let i = 0; i < size; i++)
      for (let j = 0; j < size; j++)
        for (let k = 0; k < size; k++) out[i][j] += a[i][k] * b[k][j];
    return out;
  }, [a, b, size]);
  const add = useMemo(() => a.map((row, i) => row.map((v, j) => v + b[i][j])), [a, b]);
  const det = (m: number[][]): number => {
    const n = m.length;
    if (n === 1) return m[0][0];
    if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
    let d = 0;
    for (let c = 0; c < n; c++) {
      const minor = m.slice(1).map((row) => row.filter((_, ci) => ci !== c));
      d += (c % 2 ? -1 : 1) * m[0][c] * det(minor);
    }
    return d;
  };
  const MatrixInput = ({ which, m }: { which: "a" | "b"; m: number[][] }) => (
    <div className="card p-3 inline-block">
      <div className="label">{which === "a" ? "Matrix A" : "Matrix B"}</div>
      <div className="flex flex-col gap-1">
        {m.map((row, r) => (
          <div key={r} className="flex gap-1">
            {row.map((cell, c) => (
              <input key={c} type="number" className="input !w-16 !px-1 text-center font-mono" value={cell}
                aria-label={`${which}[${r}][${c}]`} onChange={(e) => setMatrix(which, r, c, Number(e.target.value) || 0)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
  const ResultBox = ({ title, m }: { title: string; m: number[][] }) => (
    <div className="card p-3">
      <div className="label">{title}</div>
      <div className="font-mono text-sm space-y-0.5">
        {m.map((row, i) => <div key={i}>[ {row.map((v) => fmt(v, 3).padStart(8)).join(" ")} ]</div>)}
      </div>
      <CopyButton text={m.map((row) => row.join("\t")).join("\n")} />
    </div>
  );
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <SelField label="Matrix size" value={String(size)} onChange={(v) => resize(Number(v))}
            options={[{ value: "2", label: "2×2" }, { value: "3", label: "3×3" }, { value: "4", label: "4×4" }]} />
        </OptionsBar>
        <div className="flex flex-wrap gap-4">
          <MatrixInput which="a" m={a} />
          <MatrixInput which="b" m={b} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <ResultBox title="A × B" m={mul} />
          <ResultBox title="A + B" m={add} />
        </div>
        <StatGrid items={[
          { label: "det(A)", value: fmt(det(a), 4), strong: true },
          { label: "det(B)", value: fmt(det(b), 4), strong: true },
        ]} />
      </div>
    </ToolLayout>
  );
};

export const RatioTool: ComponentType = () => {
  const [a, setA] = useState(1920);
  const [b, setB] = useState(1080);
  const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y));
  const g = gcd(Math.round(a) || 1, Math.round(b) || 1);
  const [scaleA, setScaleA] = useState(2);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="Value a" value={a} onChange={setA} />
          <NumField label="value b" value={b} onChange={setB} />
          <NumField label="Scale a to" value={scaleA} onChange={setScaleA} />
        </OptionsBar>
        <StatGrid items={[
          { label: "Simplified ratio", value: `${Math.round(a) / g} : ${Math.round(b) / g}`, strong: true },
          { label: "Decimal", value: fmt(b ? a / b : 0, 4) },
          { label: `b when a = ${scaleA}`, value: fmt(a ? (scaleA * b) / a : 0), strong: true },
        ]} />
      </div>
    </ToolLayout>
  );
};

export const BitwiseTool: ComponentType = () => {
  const [a, setA] = useState(12);
  const [b, setB] = useState(10);
  const ops: [string, number][] = [
    ["a AND b", a & b], ["a OR b", a | b], ["a XOR b", a ^ b],
    ["NOT a", ~a], ["a << 1", a << 1], ["a >> 1", a >> 1], ["a >>> 1", a >>> 1],
  ];
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="a" value={a} onChange={(v) => setA(Math.floor(v || 0))} />
          <NumField label="b" value={b} onChange={(v) => setB(Math.floor(v || 0))} />
        </OptionsBar>
        <div className="card overflow-hidden">
          <table className="w-full text-[13px] font-mono">
            <thead><tr className="text-left text-[11px] uppercase text-ink-dim border-b border-border"><th className="px-3 py-2">Operation</th><th className="px-3 py-2">Decimal</th><th className="px-3 py-2">Binary</th><th className="px-3 py-2">Hex</th></tr></thead>
            <tbody className="divide-y divide-border-subtle">
              {ops.map(([name, v]) => (
                <tr key={name} className="hover:bg-surface-2">
                  <td className="px-3 py-1.5 text-accent">{name}</td>
                  <td className="px-3 py-1.5">{v}</td>
                  <td className="px-3 py-1.5">{(v >>> 0).toString(2)}</td>
                  <td className="px-3 py-1.5">0x{(v >>> 0).toString(16).toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ToolLayout>
  );
};

export const FractionTool: ComponentType = () => {
  const [n1, setN1] = useState(1);
  const [d1, setD1] = useState(2);
  const [n2, setN2] = useState(3);
  const [d2, setD2] = useState(4);
  const [op, setOp] = useState("+");
  const res = useMemo(() => {
    let n = 0;
    let d = 1;
    if (op === "+") { n = n1 * d2 + n2 * d1; d = d1 * d2; }
    else if (op === "−") { n = n1 * d2 - n2 * d1; d = d1 * d2; }
    else if (op === "×") { n = n1 * n2; d = d1 * d2; }
    else { if (n2 === 0) return { error: "Cannot divide by zero." }; n = n1 * d2; d = d1 * n2; }
    if (d === 0) return { error: "Denominator cannot be zero." };
    const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y));
    const g = gcd(Math.abs(n), Math.abs(d)) || 1;
    let sn = n / g;
    let sd = d / g;
    if (sd < 0) { sn = -sn; sd = -sd; }
    return { n: sn, d: sd, decimal: sn / sd };
  }, [n1, d1, n2, d2, op]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <div className="flex flex-col items-center gap-0.5">
            <input type="number" className="input !w-16 text-center" value={n1} aria-label="numerator 1" onChange={(e) => setN1(Number(e.target.value) || 0)} />
            <div className="w-16 h-px bg-border" />
            <input type="number" className="input !w-16 text-center" value={d1} aria-label="denominator 1" onChange={(e) => setD1(Number(e.target.value) || 1)} />
          </div>
          <select className="select !w-16 self-center" value={op} onChange={(e) => setOp(e.target.value)} aria-label="Operation">
            <option>+</option><option>−</option><option>×</option><option>÷</option>
          </select>
          <div className="flex flex-col items-center gap-0.5">
            <input type="number" className="input !w-16 text-center" value={n2} aria-label="numerator 2" onChange={(e) => setN2(Number(e.target.value) || 0)} />
            <div className="w-16 h-px bg-border" />
            <input type="number" className="input !w-16 text-center" value={d2} aria-label="denominator 2" onChange={(e) => setD2(Number(e.target.value) || 1)} />
          </div>
        </OptionsBar>
        {"error" in res ? <Note kind="error">{res.error as string}</Note> : (
          <StatGrid items={[
            { label: "Result", value: `${(res as { n: number }).n} / ${(res as { d: number }).d}`, strong: true },
            { label: "As decimal", value: fmt((res as { decimal: number }).decimal), strong: true },
            { label: "As %", value: `${fmt((res as { decimal: number }).decimal * 100)}%` },
          ]} />
        )}
      </div>
    </ToolLayout>
  );
};

export const QuadraticTool: ComponentType = () => {
  const [a, setA] = useState(1);
  const [b, setB] = useState(-3);
  const [c, setC] = useState(2);
  const res = useMemo(() => {
    if (a === 0) return { error: "a must be non-zero for a quadratic." };
    const disc = b * b - 4 * a * c;
    if (disc < 0) {
      const re = -b / (2 * a);
      const im = Math.sqrt(-disc) / (2 * a);
      return { complex: [`${fmt(re, 4)} + ${fmt(im, 4)}i`, `${fmt(re, 4)} − ${fmt(im, 4)}i`], disc };
    }
    const x1 = (-b + Math.sqrt(disc)) / (2 * a);
    const x2 = (-b - Math.sqrt(disc)) / (2 * a);
    return { x1, x2, disc };
  }, [a, b, c]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="a (x²)" value={a} onChange={setA} />
          <NumField label="b (x)" value={b} onChange={setB} />
          <NumField label="c" value={c} onChange={setC} />
        </OptionsBar>
        <div className="card p-4 font-mono text-sm">{a}x² {b >= 0 ? "+" : "−"} {Math.abs(b)}x {c >= 0 ? "+" : "−"} {Math.abs(c)} = 0</div>
        {"error" in res ? <Note kind="error">{res.error as string}</Note> : (
          <StatGrid items={"complex" in res
            ? [{ label: "Roots (complex)", value: (res as { complex: string[] }).complex.join("  ,  "), strong: true }]
            : [
                { label: "x₁", value: fmt((res as { x1: number }).x1), strong: true },
                { label: "x₂", value: fmt((res as { x2: number }).x2), strong: true },
                { label: "Discriminant", value: fmt((res as { disc: number }).disc) },
              ]} />
        )}
      </div>
    </ToolLayout>
  );
};

export const LogarithmTool: ComponentType = () => {
  const [x, setX] = useState(1000);
  const [base, setBase] = useState(10);
  const result = x > 0 && base > 0 && base !== 1 ? Math.log(x) / Math.log(base) : null;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="Number (x)" value={x} onChange={setX} />
          <NumField label="Base" value={base} onChange={setBase} />
        </OptionsBar>
        {result !== null ? (
          <StatGrid items={[
            { label: `log${base}(${x})`, value: fmt(result), strong: true },
            { label: "ln(x)", value: fmt(Math.log(x)) },
            { label: "log₁₀(x)", value: fmt(Math.log10(x)) },
            { label: "log₂(x)", value: fmt(Math.log2(x)) },
          ]} />
        ) : <Note kind="error">{"x must be > 0 and base must be > 0 and ≠ 1."}</Note>}
      </div>
    </ToolLayout>
  );
};

export const tools: Record<string, ComponentType> = {
  "factorial-calc": FactorialTool,
  "triangle-calc": TriangleTool,
  "circle-calc": CircleTool,
  "number-to-words": NumberToWordsTool,
  "percentage-calc": PercentageCalcTool,
  "percentage-change": PercentageChangeTool,
  "scientific-calc": ScientificCalcTool,
  "number-base": NumberBaseTool,
  "prime-checker": PrimeCheckerTool,
  "prime-factorization": PrimeFactorTool,
  "gcd-lcm": GcdLcmTool,
  "fibonacci": FibonacciTool,
  "random-number": RandomNumberTool,
  "statistics-calc": StatisticsTool,
  "matrix-calc": MatrixTool,
  "ratio-calc": RatioTool,
  "bitwise-calc": BitwiseTool,
  "fraction-calc": FractionTool,
  "quadratic": QuadraticTool,
  "logarithm": LogarithmTool,
};
