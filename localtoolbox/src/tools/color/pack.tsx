// Color category — 14 tools, powered by culori, all local.
import { useMemo, useState, type ComponentType } from "react";
import {
  converter, formatHex, formatRgb, formatHsl, parse as parseColor,
  wcagLuminance, wcagContrast,
  type Color,
} from "culori";
import ToolLayout from "../../components/ToolLayout";
import { CopyButton, Note, NumField, OptionsBar, OutputArea, RunButton, SelField, StatGrid } from "../../components/ui";

const rgb = converter("rgb");
const hsl = converter("hsl");
const hsv = converter("hsv");
const cmyk = converter("cmyk");
const toHex = (c: Color | string | null): string => {
  if (!c) return "#000000";
  const parsed = typeof c === "string" ? parseColor(c) : c;
  return parsed ? formatHex(parsed) : "#000000";
};

// culori v4 dropped these helpers from its main export — local equivalents:
function lighten(color: Color | string, amount: number): Color {
  const h = hsl(color) ?? { mode: "hsl", h: 0, s: 0, l: 0 };
  return { ...h, l: Math.min(1, (h.l ?? 0) + amount) };
}
function darken(color: Color | string, amount: number): Color {
  const h = hsl(color) ?? { mode: "hsl", h: 0, s: 0, l: 0 };
  return { ...h, l: Math.max(0, (h.l ?? 0) - amount) };
}
function mixColor(a: Color | string, b: Color | string, t = 0.5): Color {
  const ca = rgb(a) ?? { mode: "rgb", r: 0, g: 0, b: 0 };
  const cb = rgb(b) ?? { mode: "rgb", r: 0, g: 0, b: 0 };
  return {
    mode: "rgb",
    r: (ca.r ?? 0) + ((cb.r ?? 0) - (ca.r ?? 0)) * t,
    g: (ca.g ?? 0) + ((cb.g ?? 0) - (ca.g ?? 0)) * t,
    b: (ca.b ?? 0) + ((cb.b ?? 0) - (ca.b ?? 0)) * t,
  };
}

const Swatch = ({ color, label, sub }: { color: string; label?: string; sub?: string }) => (
  <div className="flex flex-col items-center gap-1">
    <button
      className="w-14 h-14 rounded-tool border border-border hover:scale-105 transition-transform"
      style={{ background: color }}
      title={`Copy ${color}`}
      onClick={() => navigator.clipboard.writeText(color)}
    />
    <span className="text-[11px] font-mono text-ink-muted">{color}</span>
    {label && <span className="text-[11px] text-ink-dim">{label}</span>}
    {sub && <span className="text-[10px] text-ink-dim">{sub}</span>}
  </div>
);

function ColorInput({ value, onChange, label = "Color" }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="flex gap-1.5 items-center">
        <input type="color" className="w-10 h-8 rounded-tool-sm border border-border bg-surface-3 cursor-pointer" value={toHex(value)} onChange={(e) => onChange(e.target.value)} aria-label={label} />
        <input className="input !w-24 font-mono" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </label>
  );
}

export const ColorConverterTool: ComponentType = () => {
  const [value, setValue] = useState("#3b82f6");
  const parsed = parseColor(value);
  const info = parsed
    ? {
        hex: formatHex(parsed),
        rgb: formatRgb(rgb(parsed)),
        hsl: formatHsl(hsl(parsed)),
        hsv: (() => { const v = hsv(parsed); return `hsv(${Math.round(v.h ?? 0)}, ${Math.round((v.s ?? 0) * 100)}%, ${Math.round((v.v ?? 0) * 100)}%)`; })(),
        cmyk: (() => { const v = cmyk(parsed); return `cmyk(${Math.round((v.c ?? 0) * 100)}%, ${Math.round((v.m ?? 0) * 100)}%, ${Math.round((v.y ?? 0) * 100)}%, ${Math.round((v.k ?? 0) * 100)}%)`; })(),
        luminance: wcagLuminance(parsed),
      }
    : null;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <ColorInput value={value} onChange={setValue} />
        </OptionsBar>
        {!parsed ? <Note kind="error">“{value}” is not a recognizable color (try #3b82f6, rgb(59,130,246), or hsl(217,91%,60%)).</Note> : info && (
          <>
            <div className="h-24 rounded-tool border border-border" style={{ background: info.hex }} />
            <StatGrid items={[
              { label: "HEX", value: info.hex, strong: true },
              { label: "RGB", value: info.rgb, strong: true },
              { label: "HSL", value: info.hsl },
              { label: "HSV/HSB", value: info.hsv },
              { label: "CMYK", value: info.cmyk },
              { label: "WCAG luminance", value: info.luminance.toFixed(4) },
            ]} />
            <CopyButton text={`${info.hex}\n${info.rgb}\n${info.hsl}\n${info.hsv}\n${info.cmyk}`} label="Copy all formats" />
          </>
        )}
      </div>
    </ToolLayout>
  );
};

export const HexToRgbTool: ComponentType = () => {
  const [value, setValue] = useState("#3b82f6");
  const parsed = parseColor(value);
  const c = parsed ? rgb(parsed) : null;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block">
            <span className="label">HEX color</span>
            <div className="flex gap-1.5 items-center">
              <input type="color" className="w-10 h-8 rounded-tool-sm border border-border bg-surface-3" value={toHex(value)} onChange={(e) => setValue(e.target.value)} aria-label="HEX color" />
              <input className="input !w-28 font-mono" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
          </label>
        </OptionsBar>
        {c ? (
          <>
            <div className="h-20 rounded-tool border border-border" style={{ background: value }} />
            <StatGrid items={[
              { label: "RGB", value: formatRgb(c), strong: true },
              { label: "r, g, b", value: `${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}`, strong: true },
              { label: "0–1 floats", value: `${c.r.toFixed(3)}, ${c.g.toFixed(3)}, ${c.b.toFixed(3)}` },
              { label: "RGBA", value: `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, 1)` },
            ]} />
          </>
        ) : <Note kind="error">Enter a valid HEX color like #3b82f6 or 3b82f6.</Note>}
      </div>
    </ToolLayout>
  );
};

export const RgbToHexTool: ComponentType = () => {
  const [r, setR] = useState(59);
  const [g, setG] = useState(130);
  const [b, setB] = useState(246);
  const hex = formatHex({ mode: "rgb", r: Math.min(255, Math.max(0, r)) / 255, g: Math.min(255, Math.max(0, g)) / 255, b: Math.min(255, Math.max(0, b)) / 255 });
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="R (0–255)" value={r} min={0} max={255} onChange={setR} />
          <NumField label="G (0–255)" value={g} min={0} max={255} onChange={setG} />
          <NumField label="B (0–255)" value={b} min={0} max={255} onChange={setB} />
        </OptionsBar>
        <div className="h-24 rounded-tool border border-border" style={{ background: hex }} />
        <div className="card p-4 text-center font-mono text-xl text-accent">{hex}</div>
        <CopyButton text={hex} label={`Copy ${hex}`} />
      </div>
    </ToolLayout>
  );
};

export const ColorHarmoniesTool: ComponentType = () => {
  const [value, setValue] = useState("#3b82f6");
  const base = parseColor(value);
  const hslBase = base ? hsl(base) : null;
  const at = (deg: number) => {
    if (!hslBase) return "#000000";
    return formatHex({ ...hslBase, h: ((hslBase.h ?? 0) + deg + 360) % 360 });
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar><ColorInput value={value} onChange={setValue} /></OptionsBar>
        {[
          ["Complementary", [at(0), at(180)]],
          ["Analogous", [at(-30), at(0), at(30)]],
          ["Triadic", [at(0), at(120), at(240)]],
          ["Tetradic", [at(0), at(90), at(180), at(270)]],
          ["Split complementary", [at(0), at(150), at(210)]],
        ].map(([name, colors]) => (
          <div key={name as string} className="card p-3.5">
            <div className="label">{name as string}</div>
            <div className="flex gap-4 flex-wrap mt-1">
              {(colors as string[]).map((c, i) => <Swatch key={i} color={c} />)}
            </div>
          </div>
        ))}
      </div>
    </ToolLayout>
  );
};

export const ColorPickerTool: ComponentType = () => {
  const [value, setValue] = useState("#3b82f6");
  const [history, setHistory] = useState<string[]>([]);
  const parsed = parseColor(value);
  const hslC = parsed ? hsl(parsed) : null;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <div className="card p-5 flex flex-col items-center gap-4">
          <div className="w-full max-w-sm h-40 rounded-tool border border-border" style={{ background: toHex(value) }} />
          <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
            {hslC && (["h", "s", "l"].map((k) => (
              <label key={k} className="block">
                <span className="label uppercase">{k}</span>
                <input
                  type="range"
                  min={0}
                  max={k === "h" ? 360 : 100}
                  value={Math.round(((hslC as unknown as Record<string, number>)[k] ?? 0) * (k === "h" ? 1 : 100))}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    const next = formatHex({ ...hslC, [k]: k === "h" ? v : v / 100 } as Color);
                    setValue(next);
                  }}
                  className="w-full accent-[var(--color-accent)]"
                />
              </label>
            )))}
          </div>
          <div className="flex gap-2">
            <input className="input !w-28 font-mono" value={toHex(value)} onChange={(e) => setValue(e.target.value)} aria-label="Color value" />
            <button className="btn-primary" onClick={() => setHistory((h) => [toHex(value), ...h].slice(0, 18))}>Save to palette</button>
          </div>
          {parsed && (
            <div className="text-sm font-mono text-ink-muted flex gap-3 flex-wrap justify-center">
              <span>{formatHex(parsed)}</span>
              <span>{formatRgb(rgb(parsed))}</span>
              <span>{formatHsl(hsl(parsed))}</span>
            </div>
          )}
        </div>
        {history.length > 0 && (
          <div className="card p-3.5">
            <div className="label">Palette ({history.length})</div>
            <div className="flex gap-3 flex-wrap mt-1">
              {history.map((c, i) => <Swatch key={i} color={c} />)}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export const HexPickerTool: ComponentType = () => {
  const [value, setValue] = useState("#60a5fa");
  const [history, setHistory] = useState<string[]>([]);
  const parsed = parseColor(value);
  const c = parsed ? rgb(parsed) : null;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <div className="card p-5 flex items-center justify-center">
          <div className="w-64 h-36 rounded-tool border border-border" style={{ background: toHex(value) }} />
        </div>
        <OptionsBar>
          <label className="block">
            <span className="label">HEX</span>
            <input className="input !w-28 font-mono" value={value} onChange={(e) => setValue(e.target.value)} />
          </label>
          {c && (["r", "g", "b"].map((k) => (
            <label key={k} className="block">
              <span className="label uppercase">{k} — {Math.round((c as unknown as Record<string, number>)[k] * 255)}</span>
              <input type="range" min={0} max={255} value={Math.round((c as unknown as Record<string, number>)[k] * 255)}
                onChange={(e) => {
                  const v = Number(e.target.value) / 255;
                  setValue(formatHex({ ...c, [k]: v } as Color));
                }}
                className="w-32 accent-[var(--color-accent)]" />
            </label>
          )))}
          <button className="btn-ghost self-end" onClick={() => setHistory((h) => [toHex(value), ...h].slice(0, 12))}>Save</button>
        </OptionsBar>
        {parsed && <OutputArea text={[formatHex(parsed), formatRgb(rgb(parsed)), formatHsl(hsl(parsed))].join("\n")} rows={3} label="All formats" />}
        {history.length > 0 && (
          <div className="card p-3.5">
            <div className="label">History</div>
            <div className="flex gap-3 flex-wrap mt-1">{history.map((h, i) => <Swatch key={i} color={h} />)}</div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export const PaletteGeneratorTool: ComponentType = () => {
  const [base, setBase] = useState("#3b82f6");
  const [mode, setMode] = useState("analogous");
  const generate = () => {
    const b = parseColor(base);
    if (!b) return;
    const h = hsl(b);
    const h0 = h.h ?? 0;
    let colors: string[] = [];
    if (mode === "analogous") colors = [-40, -20, 0, 20, 40].map((d) => formatHex({ ...h, h: (h0 + d + 360) % 360 }));
    else if (mode === "complementary") colors = [0, 12, 180, 192, 0].map((d, i) => formatHex(i === 4 ? { ...h, l: (h.l ?? 0.5) * 0.6 } : { ...h, h: (h0 + d) % 360 }));
    else if (mode === "triadic") colors = [0, 120, 240].map((d) => formatHex({ ...h, h: (h0 + d) % 360 })).concat([formatHex(darken(b, 0.3)), formatHex(lighten(b, 0.3))]);
    else if (mode === "monochrome") colors = [0.2, 0.35, 0.5, 0.65, 0.8].map((l) => formatHex({ ...h, l }));
    else if (mode === "shades") colors = [0, 0.25, 0.5, 0.75, 1].map((t) => formatHex(mixColor("#000000", b, t) ?? b));
    else colors = Array.from({ length: 5 }, (_, i) => formatHex({ mode: "oklch", l: 0.35 + i * 0.14, c: 0.1, h: (h0 + i * 62) % 360 }));
    setPalette(colors);
  };
  const [palette, setPalette] = useState<string[]>([]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <ColorInput value={base} onChange={setBase} />
          <SelField label="Harmony" value={mode} onChange={setMode} options={[
            { value: "analogous", label: "Analogous" }, { value: "complementary", label: "Complementary" },
            { value: "triadic", label: "Triadic" }, { value: "monochrome", label: "Monochromatic" },
            { value: "shades", label: "Shades" }, { value: "oklch", label: "Perceptual (OKLCH)" },
          ]} />
          <RunButton label="Generate" onClick={generate} />
        </OptionsBar>
        {palette.length > 0 && (
          <>
            <div className="card p-4 flex gap-3 justify-center flex-wrap">
              {palette.map((c, i) => <Swatch key={i} color={c} />)}
            </div>
            <CopyButton text={palette.join("\n")} label="Copy palette (one hex per line)" />
          </>
        )}
      </div>
    </ToolLayout>
  );
};

export const GradientGeneratorTool: ComponentType = () => {
  const [a, setA] = useState("#0a0e17");
  const [b, setB] = useState("#3b82f6");
  const [angle, setAngle] = useState(135);
  const [type, setType] = useState("linear");
  const css = type === "linear" ? `linear-gradient(${angle}deg, ${toHex(a)}, ${toHex(b)})` : type === "radial" ? `radial-gradient(circle, ${toHex(a)}, ${toHex(b)})` : `conic-gradient(from ${angle}deg, ${toHex(a)}, ${toHex(b)}, ${toHex(a)})`;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <ColorInput label="Color A" value={a} onChange={setA} />
          <ColorInput label="Color B" value={b} onChange={setB} />
          <SelField label="Type" value={type} onChange={setType} options={[{ value: "linear", label: "Linear" }, { value: "radial", label: "Radial" }, { value: "conic", label: "Conic" }]} />
          {type !== "radial" && <NumField label="Angle (°)" value={angle} min={0} max={360} onChange={setAngle} />}
        </OptionsBar>
        <div className="h-52 rounded-tool border border-border" style={{ background: css }} />
        <OutputArea text={`background: ${css};`} filename="gradient.css" rows={2} label="CSS" />
      </div>
    </ToolLayout>
  );
};

export const ContrastCheckerTool: ComponentType = () => {
  const [fg, setFg] = useState("#e8edf7");
  const [bg, setBg] = useState("#0a0e17");
  const pf = parseColor(fg);
  const pb = parseColor(bg);
  const contrast = pf && pb ? wcagContrast(pf, pb) : 0;
  const grade = (ratio: number, large: boolean) =>
    ratio >= (large ? 4.5 : 7) ? { label: "AAA", ok: true } : ratio >= (large ? 3 : 4.5) ? { label: "AA", ok: true } : ratio >= 3 ? { label: large ? "AA (large text)" : "Fail", ok: large } : { label: "Fail", ok: false };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <ColorInput label="Text color" value={fg} onChange={setFg} />
          <ColorInput label="Background" value={bg} onChange={setBg} />
        </OptionsBar>
        <div className="card p-8 rounded-tool" style={{ background: toHex(bg) }}>
          <p className="text-xl font-semibold" style={{ color: toHex(fg) }}>The quick brown fox jumps</p>
          <p className="text-sm mt-1" style={{ color: toHex(fg) }}>Normal body text at 16px</p>
          <p className="text-2xl font-bold mt-3" style={{ color: toHex(fg) }}>Large heading text</p>
        </div>
        <StatGrid items={[
          { label: "Contrast ratio", value: `${contrast.toFixed(2)} : 1`, strong: true },
          { label: "Normal text", value: grade(contrast, false).label, strong: grade(contrast, false).ok },
          { label: "Large text (18pt+)", value: grade(contrast, true).label, strong: grade(contrast, true).ok },
        ]} />
      </div>
    </ToolLayout>
  );
};

export const ColorShadesTool: ComponentType = () => {
  const [value, setValue] = useState("#3b82f6");
  const base = parseColor(value);
  const steps = [95, 90, 80, 70, 60, 50, 40, 30, 20, 12];
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar><ColorInput value={value} onChange={setValue} /></OptionsBar>
        {base && (
          <div className="card p-4 flex gap-3 justify-center flex-wrap">
            {steps.map((t) => {
              const c = mixColor(t > 50 ? "#ffffff" : "#000000", base, t > 50 ? (t - 50) / 50 : (50 - t) / 50) ?? base;
              return <Swatch key={t} color={formatHex(c)} label={`${t * 2 - 100 > 0 ? "+" : ""}${t * 2 - 100}`} />;
            })}
            <Swatch color={formatHex(base)} label="base" />
          </div>
        )}
        {base && <CopyButton text={steps.map((t) => formatHex(mixColor(t > 50 ? "#ffffff" : "#000000", base, t > 50 ? (t - 50) / 50 : (50 - t) / 50) ?? base)).join("\n")} label="Copy all shades" />}
      </div>
    </ToolLayout>
  );
};

export const ColorBlindnessTool: ComponentType = () => {
  const [value, setValue] = useState("#3b82f6");
  const base = parseColor(value);
  const c = base ? rgb(base) : null;
  // Hunt/Brettel-style approximations for common CVD types
  const transform = (m: number[][]) => {
    if (!c) return "#000000";
    const [r, g, b] = [c.r, c.g, c.b];
    return formatHex({ mode: "rgb", r: Math.min(1, Math.max(0, r * m[0][0] + g * m[0][1] + b * m[0][2])), g: Math.min(1, Math.max(0, r * m[1][0] + g * m[1][1] + b * m[1][2])), b: Math.min(1, Math.max(0, r * m[2][0] + g * m[2][1] + b * m[2][2])) });
  };
  const TYPES: [string, number[][]][] = [
    ["Protanopia (no red)", [[0.567, 0.433, 0], [0.558, 0.442, 0], [0, 0.242, 0.758]]],
    ["Deuteranopia (no green)", [[0.625, 0.375, 0], [0.7, 0.3, 0], [0, 0.3, 0.7]]],
    ["Tritanopia (no blue)", [[0.95, 0.05, 0], [0, 0.433, 0.567], [0, 0.475, 0.525]]],
    ["Protanomaly", [[0.817, 0.183, 0], [0.333, 0.667, 0], [0, 0.125, 0.875]]],
    ["Deuteranomaly", [[0.8, 0.2, 0], [0.258, 0.742, 0], [0, 0.142, 0.858]]],
    ["Tritanomaly", [[0.967, 0.033, 0], [0, 0.733, 0.267], [0, 0.183, 0.817]]],
    ["Achromatopsia (no color)", [[0.299, 0.587, 0.114], [0.299, 0.587, 0.114], [0.299, 0.587, 0.114]]],
  ];
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar><ColorInput value={value} onChange={setValue} /></OptionsBar>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {TYPES.map(([name, m]) => (
            <div key={name} className="card p-3 flex flex-col items-center gap-2">
              <div className="w-full h-14 rounded-tool-sm border border-border" style={{ background: transform(m) }} />
              <span className="text-[11px] text-ink-muted text-center">{name}</span>
            </div>
          ))}
        </div>
        <Note>Simulations use standard linear-approximation matrices. They're close to how common color-vision deficiencies perceive the color, though individual experience varies.</Note>
      </div>
    </ToolLayout>
  );
};

export const ColorMixerTool: ComponentType = () => {
  const [a, setA] = useState("#3b82f6");
  const [b, setB] = useState("#f472b6");
  const pa = parseColor(a);
  const pb2 = parseColor(b);
  const steps = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    return pa && pb2 ? formatHex(mixColor(pa, pb2, t) ?? pa) : "#000000";
  });
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <ColorInput label="Color A" value={a} onChange={setA} />
          <ColorInput label="Color B" value={b} onChange={setB} />
        </OptionsBar>
        <div className="card p-4 flex gap-2 justify-center flex-wrap">
          {steps.map((c, i) => <Swatch key={i} color={c} />)}
        </div>
        <CopyButton text={steps.join("\n")} label="Copy gradient steps" />
      </div>
    </ToolLayout>
  );
};

const NAMED_COLORS: [string, string][] = [
  ["Black", "#000000"], ["White", "#ffffff"], ["Red", "#ef4444"], ["Crimson", "#dc143c"],
  ["FireBrick", "#b22222"], ["Salmon", "#fa8072"], ["Orange", "#ffa500"], ["Coral", "#ff7f50"],
  ["Tomato", "#ff6347"], ["Gold", "#ffd700"], ["Yellow", "#facc15"], ["Khaki", "#f0e68c"],
  ["Lime", "#84cc16"], ["Green", "#22c55e"], ["SeaGreen", "#2e8b57"], ["Teal", "#14b8a6"],
  ["Cyan", "#22d3ee"], ["SkyBlue", "#38bdf8"], ["Blue", "#3b82f6"], ["Navy", "#001f3f"],
  ["RoyalBlue", "#4169e1"], ["Indigo", "#6366f1"], ["Violet", "#8b5cf6"], ["Purple", "#9333ea"],
  ["Magenta", "#ff00ff"], ["Pink", "#ec4899"], ["Brown", "#a52a2a"], ["Chocolate", "#d2691e"],
  ["SandyBrown", "#f4a460"], ["Gray / Grey", "#9ca3af"], ["SlateGray", "#708090"], ["Silver", "#c0c0c0"],
];
export const ColorNameTool: ComponentType = () => {
  const [value, setValue] = useState("#3b82f6");
  const target = parseColor(value);
  const nearest = useMemo(() => {
    if (!target) return null;
    const tr = rgb(target);
    let best: [string, string, number] | null = null;
    for (const [name, hex] of NAMED_COLORS) {
      const nr = rgb(hex);
      if (!nr) continue;
      const dist = (tr.r - nr.r) ** 2 + (tr.g - nr.g) ** 2 + (tr.b - nr.b) ** 2;
      if (!best || dist < best[2]) best = [name, hex, dist];
    }
    return best;
  }, [target]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar><ColorInput value={value} onChange={setValue} /></OptionsBar>
        {nearest && (
          <div className="card p-5 flex items-center gap-5">
            <div className="w-20 h-20 rounded-tool border border-border" style={{ background: toHex(value) }} />
            <div className="text-2xl font-semibold">{nearest[0]}</div>
            <div className="flex items-center gap-2 text-sm text-ink-muted ml-auto">
              nearest of <div className="w-8 h-8 rounded border border-border" style={{ background: nearest[1] }} /> {nearest[1]}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export const CssColorNamesTool: ComponentType = () => {
  const [q, setQ] = useState("");
  const EXTENDED: [string, string][] = NAMED_COLORS.concat([
    ["AliceBlue", "#f0f8ff"], ["AntiqueWhite", "#faebd7"], ["Aquamarine", "#7fffd4"], ["Azure", "#f0ffff"],
    ["Beige", "#f5f5dc"], ["Bisque", "#ffe4c4"], ["BlanchedAlmond", "#ffebcd"], ["BlueViolet", "#8a2be2"],
    ["BurlyWood", "#deb887"], ["CadetBlue", "#5f9ea0"], ["Chartreuse", "#7fff00"], ["CornflowerBlue", "#6495ed"],
    ["DarkBlue", "#00008b"], ["DarkCyan", "#008b8b"], ["DarkGoldenrod", "#b8860b"], ["DarkGreen", "#006400"],
    ["DarkKhaki", "#bdb76b"], ["DarkMagenta", "#8b008b"], ["DarkOliveGreen", "#556b2f"], ["DarkOrange", "#ff8c00"],
    ["DarkOrchid", "#9932cc"], ["DarkRed", "#8b0000"], ["DarkSalmon", "#e9967a"], ["DarkSeaGreen", "#8fbc8f"],
    ["DarkSlateBlue", "#483d8b"], ["DarkSlateGray", "#2f4f4f"], ["DarkTurquoise", "#00ced1"], ["DarkViolet", "#9400d3"],
    ["DeepPink", "#ff1493"], ["DeepSkyBlue", "#00bfff"], ["DimGray", "#696969"], ["DodgerBlue", "#1e90ff"],
    ["FloralWhite", "#fffaf0"], ["ForestGreen", "#228b22"], ["Gainsboro", "#dcdcdc"], ["GhostWhite", "#f8f8ff"],
    ["Goldenrod", "#daa520"], ["GreenYellow", "#adff2f"], ["Honeydew", "#f0fff0"], ["HotPink", "#ff69b4"],
    ["IndianRed", "#cd5c5c"], ["Ivory", "#fffff0"], ["Lavender", "#e6e6fa"], ["LawnGreen", "#7cfc00"],
    ["LightBlue", "#add8e6"], ["LightCoral", "#f08080"], ["LightCyan", "#e0ffff"], ["LightGoldenrodYellow", "#fafad2"],
    ["LightGray", "#d3d3d3"], ["LightGreen", "#90ee90"], ["LightPink", "#ffb6c1"], ["LightSalmon", "#ffa07a"],
    ["LightSeaGreen", "#20b2aa"], ["LightSkyBlue", "#87cefa"], ["LightSlateGray", "#778899"], ["LightSteelBlue", "#b0c4de"],
    ["LightYellow", "#ffffe0"], ["LimeGreen", "#32cd32"], ["Linen", "#faf0e6"], ["Maroon", "#800000"],
    ["MediumAquamarine", "#66cdaa"], ["MediumBlue", "#0000cd"], ["MediumOrchid", "#ba55d3"], ["MediumPurple", "#9370db"],
    ["MediumSeaGreen", "#3cb371"], ["MediumSlateBlue", "#7b68ee"], ["MediumSpringGreen", "#00fa9a"], ["MediumTurquoise", "#48d1cc"],
    ["MidnightBlue", "#191970"], ["MintCream", "#f5fffa"], ["MistyRose", "#ffe4e1"], ["Moccasin", "#ffe4b5"],
    ["NavajoWhite", "#ffdead"], ["OldLace", "#fdf5e6"], ["Olive", "#808000"], ["OliveDrab", "#6b8e23"],
    ["OrangeRed", "#ff4500"], ["Orchid", "#da70d6"], ["PaleGoldenrod", "#eee8aa"], ["PaleGreen", "#98fb98"],
    ["PaleTurquoise", "#afeeee"], ["PaleVioletRed", "#db7093"], ["PapayaWhip", "#ffefd5"], ["PeachPuff", "#ffdab9"],
    ["Peru", "#cd853f"], ["Plum", "#dda0dd"], ["PowderBlue", "#b0e0e6"], ["RosyBrown", "#bc8f8f"],
    ["RustyBrown", "#b7410e"], ["Sienna", "#a0522d"], ["SteelBlue", "#4682b4"], ["Tan", "#d2b48c"],
    ["Thistle", "#d8bfd8"], ["Turquoise", "#40e0d0"], ["Wheat", "#f5deb3"], ["YellowGreen", "#9acd32"],
  ]);
  const list = EXTENDED.filter(([name, hex]) => (name + hex).toLowerCase().includes(q.toLowerCase()));
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <input className="input max-w-sm" placeholder="Search named colors…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search named colors" />
        <div className="card overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 divide-x divide-y divide-border-subtle">
            {list.map(([name, hex]) => (
              <button key={name} className="flex items-center gap-2.5 px-3 py-2 hover:bg-surface-2 text-left" onClick={() => navigator.clipboard.writeText(hex)} title="Click to copy HEX">
                <span className="w-5 h-5 rounded-sm border border-border shrink-0" style={{ background: hex }} />
                <span className="text-[13px] truncate">{name}</span>
                <code className="ml-auto text-[11px] text-ink-dim font-mono">{hex}</code>
              </button>
            ))}
          </div>
        </div>
        <Note>{list.length} shown — click any color to copy its HEX value. Click a swatch pair to confirm naming from the extended CSS palette.</Note>
      </div>
    </ToolLayout>
  );
};

export const tools: Record<string, ComponentType> = {
  "color-converter": ColorConverterTool,
  "hex-to-rgb": HexToRgbTool,
  "rgb-to-hex": RgbToHexTool,
  "color-harmonies": ColorHarmoniesTool,
  "color-picker": ColorPickerTool,
  "hex-color-picker": HexPickerTool,
  "color-palette": PaletteGeneratorTool,
  "gradient-generator": GradientGeneratorTool,
  "color-contrast": ContrastCheckerTool,
  "color-shades": ColorShadesTool,
  "color-blindness": ColorBlindnessTool,
  "color-mixer": ColorMixerTool,
  "color-name": ColorNameTool,
  "css-color-names": CssColorNamesTool,
};
