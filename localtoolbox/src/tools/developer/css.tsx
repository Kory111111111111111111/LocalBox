// CSS visual playground tools: shadows, radius, triangle, animation, flexbox,
// grid, gradients, clip-path, variables, specificity, units, cheatsheet.
import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import ToolLayout from "../../components/ToolLayout";
import { CopyButton, Field, NumField, OptionsBar, OutputArea, RunButton, SelField, Toggle } from "../../components/ui";

function Playground({ options, preview, css, filename = "styles.css" }: {
  options: ReactNode; preview: ReactNode; css: string; filename?: string;
}) {
  return (
    <>
      {options}
      <div className="flex flex-col gap-2">
        <span className="label">Live preview</span>
        <div className="card p-8 flex items-center justify-center min-h-56 overflow-auto checkerboard rounded-tool">
          {preview}
        </div>
      </div>
      <OutputArea text={css} filename={filename} rows={5} label="CSS" />
    </>
  );
}

// ── Box shadow ──
export const BoxShadowTool: ComponentType = () => {
  const [x, setX] = useState(0);
  const [y, setY] = useState(8);
  const [blur, setBlur] = useState(24);
  const [spread, setSpread] = useState(0);
  const [color, setColor] = useState("#000000");
  const [opacity, setOpacity] = useState(45);
  const [inset, setInset] = useState(false);
  const css = `${inset ? "inset " : ""}${x}px ${y}px ${blur}px${spread ? ` ${spread}px` : ""} ${hexA(color, opacity / 100)}`;
  return (
    <ToolLayout>
      <Playground
        options={
          <OptionsBar>
            <NumField label="X offset (px)" value={x} min={-100} max={100} onChange={setX} />
            <NumField label="Y offset (px)" value={y} min={-100} max={100} onChange={setY} />
            <NumField label="Blur (px)" value={blur} min={0} max={200} onChange={setBlur} />
            <NumField label="Spread (px)" value={spread} min={-50} max={100} onChange={setSpread} />
            <ColorField label="Color" value={color} onChange={setColor} />
            <NumField label="Opacity %" value={opacity} min={0} max={100} onChange={setOpacity} />
            <Toggle label="Inset" checked={inset} onChange={setInset} />
          </OptionsBar>
        }
        preview={<div className="w-36 h-24 rounded-tool bg-surface-2 border border-border" style={{ boxShadow: css }} />}
        css={`box-shadow: ${css};`}
      />
    </ToolLayout>
  );
};

// ── Text shadow ──
export const TextShadowTool: ComponentType = () => {
  const [x, setX] = useState(2);
  const [y, setY] = useState(2);
  const [blur, setBlur] = useState(4);
  const [color, setColor] = useState("#000000");
  const css = `${x}px ${y}px ${blur}px ${color}`;
  return (
    <ToolLayout>
      <Playground
        options={
          <OptionsBar>
            <NumField label="X offset" value={x} min={-50} max={50} onChange={setX} />
            <NumField label="Y offset" value={y} min={-50} max={50} onChange={setY} />
            <NumField label="Blur" value={blur} min={0} max={60} onChange={setBlur} />
            <ColorField label="Color" value={color} onChange={setColor} />
          </OptionsBar>
        }
        preview={<div className="text-4xl font-bold text-ink" style={{ textShadow: css }}>Shadow me</div>}
        css={`text-shadow: ${css};`}
      />
    </ToolLayout>
  );
};

// ── Border radius ──
export const BorderRadiusTool: ComponentType = () => {
  const [tl, setTl] = useState(16);
  const [tr, setTr] = useState(4);
  const [br, setBr] = useState(16);
  const [bl, setBl] = useState(4);
  const css = `${tl}px ${tr}px ${br}px ${bl}px`;
  return (
    <ToolLayout>
      <Playground
        options={
          <OptionsBar>
            <NumField label="Top left" value={tl} min={0} max={200} onChange={setTl} />
            <NumField label="Top right" value={tr} min={0} max={200} onChange={setTr} />
            <NumField label="Bottom right" value={br} min={0} max={200} onChange={setBr} />
            <NumField label="Bottom left" value={bl} min={0} max={200} onChange={setBl} />
          </OptionsBar>
        }
        preview={<div className="w-44 h-32 bg-surface-2 border-2 border-accent" style={{ borderRadius: css }} />}
        css={`border-radius: ${css};`}
      />
    </ToolLayout>
  );
};

// ── Triangle ──
export const TriangleTool: ComponentType = () => {
  const [dir, setDir] = useState<"up" | "down" | "left" | "right">("up");
  const [size, setSize] = useState(60);
  const [color, setColor] = useState("#3b82f6");
  const [thickness, setThickness] = useState(30);
  const t = Math.min(thickness, size);
  const borders: Record<string, string> = {
    up: `border-bottom: ${t}px solid ${color}; border-left: ${size / 2}px solid transparent; border-right: ${size / 2}px solid transparent;`,
    down: `border-top: ${t}px solid ${color}; border-left: ${size / 2}px solid transparent; border-right: ${size / 2}px solid transparent;`,
    left: `border-right: ${t}px solid ${color}; border-top: ${size / 2}px solid transparent; border-bottom: ${size / 2}px solid transparent;`,
    right: `border-left: ${t}px solid ${color}; border-top: ${size / 2}px solid transparent; border-bottom: ${size / 2}px solid transparent;`,
  };
  return (
    <ToolLayout>
      <Playground
        options={
          <OptionsBar>
            <SelField label="Direction" value={dir} onChange={setDir} options={[{ value: "up", label: "Up" }, { value: "down", label: "Down" }, { value: "left", label: "Left" }, { value: "right", label: "Right" }]} />
            <NumField label="Width (px)" value={size} min={10} max={300} onChange={setSize} />
            <NumField label="Height (px)" value={thickness} min={5} max={300} onChange={setThickness} />
            <ColorField label="Color" value={color} onChange={setColor} />
          </OptionsBar>
        }
        preview={
          <div
            style={
              dir === "up"
                ? { width: 0, height: 0, borderBottom: `${t}px solid ${color}`, borderLeft: `${size / 2}px solid transparent`, borderRight: `${size / 2}px solid transparent` }
                : dir === "down"
                  ? { width: 0, height: 0, borderTop: `${t}px solid ${color}`, borderLeft: `${size / 2}px solid transparent`, borderRight: `${size / 2}px solid transparent` }
                  : dir === "left"
                    ? { width: 0, height: 0, borderRight: `${t}px solid ${color}`, borderTop: `${size / 2}px solid transparent`, borderBottom: `${size / 2}px solid transparent` }
                    : { width: 0, height: 0, borderLeft: `${t}px solid ${color}`, borderTop: `${size / 2}px solid transparent`, borderBottom: `${size / 2}px solid transparent` }
            }
          />
        }
        css={`.triangle {\n  width: 0;\n  height: 0;\n  ${borders[dir].replace(/; /g, ";\n  ").replace(/;$/, "")};\n}`}
      />
    </ToolLayout>
  );
};

// ── Animation generator ──
const ANIM_PRESETS: Record<string, { label: string; frames: (p: number) => string }> = {
  fade: { label: "Fade", frames: (o) => `opacity: ${o};` },
  pulse: { label: "Pulse", frames: (o) => `transform: scale(${1 + (1 - Math.abs(o * 2 - 1)) * 0.15});` },
  bounce: { label: "Bounce", frames: (o) => `transform: translateY(${-Math.sin(o * Math.PI) * 24}px);` },
  spin: { label: "Spin", frames: (o) => `transform: rotate(${o * 360}deg);` },
  shake: { label: "Shake", frames: (o) => `transform: translateX(${Math.sin(o * Math.PI * 8) * 6}px);` },
  slide: { label: "Slide in", frames: (o) => `transform: translateX(${(o - 0.5) * 100}px); opacity: ${o < 0.1 ? o * 10 : 1};` },
};
export const CssAnimationTool: ComponentType = () => {
  const [preset, setPreset] = useState("pulse");
  const [dur, setDur] = useState(1.2);
  const [timing, setTiming] = useState("ease-in-out");
  const [loop, setLoop] = useState(true);
  const [playing, setPlaying] = useState(true);
  const css =
`.animated {\n  animation: localtoolbox-${preset} ${dur}s ${timing}${loop ? " infinite" : ""};\n}\n\n@keyframes localtoolbox-${preset} {\n  0%   { ${ANIM_PRESETS[preset].frames(0)} }\n  50%  { ${ANIM_PRESETS[preset].frames(0.5)} }\n  100% { ${ANIM_PRESETS[preset].frames(1)} }\n}`;
  return (
    <ToolLayout>
      <Playground
        options={
          <OptionsBar>
            <SelField label="Preset" value={preset} onChange={setPreset} options={Object.entries(ANIM_PRESETS).map(([k, v]) => ({ value: k, label: v.label }))} />
            <NumField label="Duration (s)" value={dur} min={0.1} max={10} step={0.1} onChange={setDur} />
            <SelField label="Timing" value={timing} onChange={setTiming} options={["linear", "ease", "ease-in", "ease-out", "ease-in-out"].map((t) => ({ value: t, label: t }))} />
            <Toggle label="Infinite loop" checked={loop} onChange={setLoop} />
            <RunButton label={playing ? "Pause" : "Play"} onClick={() => setPlaying((p) => !p)} />
          </OptionsBar>
        }
        preview={
          <>
            <style>{`.ltb-anim { ${playing ? `animation: ltba ${dur}s ${timing} ${loop ? "infinite" : "1"}` : ""}; } @keyframes ltba { 0% { ${ANIM_PRESETS[preset].frames(0)} } 50% { ${ANIM_PRESETS[preset].frames(0.5)} } 100% { ${ANIM_PRESETS[preset].frames(1)} } }`}</style>
            <div className="ltb-anim w-20 h-20 rounded-tool bg-accent border border-accent-hover" />
          </>
        }
        css={css}
      />
    </ToolLayout>
  );
};

// ── Flexbox generator ──
export const FlexboxTool: ComponentType = () => {
  const [dir, setDir] = useState("row");
  const [justify, setJustify] = useState("center");
  const [align, setAlign] = useState("center");
  const [gap, setGap] = useState(12);
  const [wrap, setWrap] = useState(false);
  const [items, setItems] = useState(3);
  const css = `display: flex;\nflex-direction: ${dir};\njustify-content: ${justify};\nalign-items: ${align};${gap ? `\ngap: ${gap}px;` : ""}${wrap ? "\nflex-wrap: wrap;" : ""}`;
  return (
    <ToolLayout>
      <Playground
        options={
          <OptionsBar>
            <SelField label="Direction" value={dir} onChange={setDir} options={["row", "row-reverse", "column", "column-reverse"].map((v) => ({ value: v, label: v }))} />
            <SelField label="Justify content" value={justify} onChange={setJustify} options={["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"].map((v) => ({ value: v, label: v }))} />
            <SelField label="Align items" value={align} onChange={setAlign} options={["stretch", "flex-start", "center", "flex-end", "baseline"].map((v) => ({ value: v, label: v }))} />
            <NumField label="Gap (px)" value={gap} min={0} max={80} onChange={setGap} />
            <Toggle label="Wrap" checked={wrap} onChange={setWrap} />
            <NumField label="Items" value={items} min={1} max={8} onChange={(v) => setItems(Math.min(8, Math.max(1, v || 3)))} />
          </OptionsBar>
        }
        preview={
          <div className="w-full max-w-md h-40 border border-dashed border-border rounded-tool p-2" style={{ display: "flex", flexDirection: dir as never, justifyContent: justify as never, alignItems: align as never, gap, flexWrap: wrap ? "wrap" : "nowrap" }}>
            {Array.from({ length: items }, (_, i) => (
              <div key={i} className="w-12 h-12 rounded-tool-sm bg-accent/80 flex items-center justify-center text-white text-sm font-semibold">{i + 1}</div>
            ))}
          </div>
        }
        css={css}
      />
    </ToolLayout>
  );
};

// ── Grid generator ──
export const GridTool: ComponentType = () => {
  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(2);
  const [gap, setGap] = useState(12);
  const [cell, setCell] = useState("1fr");
  const css = `display: grid;\ngrid-template-columns: repeat(${cols}, ${cell});\ngrid-template-rows: repeat(${rows}, ${cell});\ngap: ${gap}px;`;
  const total = cols * rows;
  return (
    <ToolLayout>
      <Playground
        options={
          <OptionsBar>
            <NumField label="Columns" value={cols} min={1} max={8} onChange={(v) => setCols(Math.min(8, Math.max(1, v || 3)))} />
            <NumField label="Rows" value={rows} min={1} max={8} onChange={(v) => setRows(Math.min(8, Math.max(1, v || 2)))} />
            <NumField label="Gap (px)" value={gap} min={0} max={60} onChange={setGap} />
            <SelField label="Track size" value={cell} onChange={setCell} options={[{ value: "1fr", label: "1fr (fluid)" }, { value: "120px", label: "120px fixed" }, { value: "minmax(100px, 1fr)", label: "minmax(100px, 1fr)" }]} />
          </OptionsBar>
        }
        preview={
          <div className="w-full max-w-md border border-dashed border-border rounded-tool p-2" style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${cell})`, gridTemplateRows: `repeat(${rows}, ${cell})`, gap }}>
            {Array.from({ length: total }, (_, i) => (
              <div key={i} className="min-h-12 rounded-tool-sm bg-accent/25 border border-accent/40 flex items-center justify-center text-[11px] text-ink-muted font-mono">{i + 1}</div>
            ))}
          </div>
        }
        css={css}
      />
    </ToolLayout>
  );
};

// ── Gradient generator ──
export const GradientTool: ComponentType = () => {
  const [type, setType] = useState<"linear" | "radial" | "conic">("linear");
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState([
    { color: "#3b82f6", pos: 0 },
    { color: "#8b5cf6", pos: 100 },
  ]);
  const sorted = [...stops].sort((a, b) => a.pos - b.pos);
  const stopsStr = sorted.map((s) => `${s.color} ${s.pos}%`).join(", ");
  const css = type === "linear" ? `linear-gradient(${angle}deg, ${stopsStr})` : type === "radial" ? `radial-gradient(circle, ${stopsStr})` : `conic-gradient(from ${angle}deg, ${stopsStr})`;
  return (
    <ToolLayout>
      <Playground
        options={
          <OptionsBar>
            <SelField label="Type" value={type} onChange={setType} options={[{ value: "linear", label: "Linear" }, { value: "radial", label: "Radial" }, { value: "conic", label: "Conic" }]} />
            {type !== "radial" && <NumField label="Angle (deg)" value={angle} min={0} max={360} onChange={setAngle} />}
            <button className="btn-ghost !py-1.5" onClick={() => setStops((s) => [...s, { color: "#22d3ee", pos: 50 }])}>+ Stop</button>
            {stops.length > 2 && <button className="btn-ghost !py-1.5" onClick={() => setStops((s) => s.slice(0, -1))}>− Stop</button>}
          </OptionsBar>
        }
        preview={
          <div className="flex flex-col gap-3 w-full max-w-md">
            <div className="h-40 rounded-tool border border-border" style={{ background: css }} />
            {stops.map((s, i) => (
              <div key={i} className="flex items-end gap-2">
                <ColorField label={`Stop ${i + 1}`} value={s.color} onChange={(v) => setStops((old) => old.map((x, j) => (j === i ? { ...x, color: v } : x)))} />
                <NumField label="Position %" value={s.pos} min={0} max={100} onChange={(v) => setStops((old) => old.map((x, j) => (j === i ? { ...x, pos: v } : x)))} />
              </div>
            ))}
          </div>
        }
        css={`background: ${css};`}
      />
    </ToolLayout>
  );
};

// ── clip-path generator ──
export const ClipPathTool: ComponentType = () => {
  const [shape, setShape] = useState<"polygon" | "circle" | "ellipse" | "inset">("polygon");
  const [sides, setSides] = useState(6);
  const [size, setSize] = useState(60);
  const [rounds, setRounds] = useState(0);
  const clip = useMemo(() => {
    if (shape === "circle") return `circle(${size}% at 50% 50%)`;
    if (shape === "ellipse") return `ellipse(${size}% at 50% 50%)`;
    if (shape === "inset") return `inset(${Math.max(0, 50 - size / 2)}% round ${rounds}px)`;
    const pts: string[] = [];
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
      pts.push(`${(50 + Math.cos(a) * size / 2).toFixed(1)}% ${(50 + Math.sin(a) * size / 2).toFixed(1)}%`);
    }
    return `polygon(${pts.join(", ")})`;
  }, [shape, sides, size, rounds]);
  return (
    <ToolLayout>
      <Playground
        options={
          <OptionsBar>
            <SelField label="Shape" value={shape} onChange={setShape} options={[{ value: "polygon", label: "Polygon" }, { value: "circle", label: "Circle" }, { value: "ellipse", label: "Ellipse" }, { value: "inset", label: "Inset" }]} />
            {shape === "polygon" && <NumField label="Sides" value={sides} min={3} max={12} onChange={setSides} />}
            <NumField label="Size %" value={size} min={5} max={100} onChange={setSize} />
            {shape === "inset" && <NumField label="Corner round (px)" value={rounds} min={0} max={80} onChange={setRounds} />}
          </OptionsBar>
        }
        preview={<div className="w-48 h-48 bg-accent" style={{ clipPath: clip }} />}
        css={`clip-path: ${clip};`}
      />
    </ToolLayout>
  );
};

// ── CSS variable generator ──
export const CssVariablesTool: ComponentType = () => {
  const [base, setBase] = useState("#3b82f6");
  const [name, setName] = useState("brand");
  const tints = useMemo(() => {
    const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
    return shades.map((s) => {
      const mixWhite = (s - 500) / 500;
      const hex = mix(base, mixWhite < 0 ? "#ffffff" : "#000000", Math.abs(mixWhite) * 0.85);
      return { shade: s, hex };
    });
  }, [base]);
  const css = `:root {\n${tints.map((t) => `  --${name}-${t.shade}: ${t.hex};`).join("\n")}\n}`;
  return (
    <ToolLayout>
      <Playground
        options={
          <OptionsBar>
            <ColorField label="Base color (500)" value={base} onChange={setBase} />
            <Field label="Variable prefix">
              <input className="input !w-32" value={name} onChange={(e) => setName(e.target.value.replace(/[^a-z-]/gi, "").toLowerCase())} />
            </Field>
          </OptionsBar>
        }
        preview={
          <div className="flex gap-1.5">
            {tints.map((t) => (
              <div key={t.shade} className="flex flex-col items-center gap-1">
                <div className="w-10 h-16 rounded-tool-sm border border-border" style={{ background: t.hex }} title={`--${name}-${t.shade}`} />
                <span className="text-[10px] text-ink-dim font-mono">{t.shade}</span>
              </div>
            ))}
          </div>
        }
        css={css}
      />
    </ToolLayout>
  );
};

// ── Specificity calculator ──
export const SpecificityTool: ComponentType = () => {
  const [sel, setSel] = useState("ul#nav li.active a:hover");
  const spec = useMemo(() => {
    const s = { ids: 0, classes: 0, elements: 0 };
    const clean = sel.replace(/\s+/g, " ").trim();
    if (!clean) return s;
    // strip strings, remove pseudo-elements for counting (they count as elements)
    const tokens = clean.match(/[^ >+~]+/g) ?? [];
    for (const t of tokens) {
      s.ids += (t.match(/#[\w-]+/g) ?? []).length;
      s.classes += (t.match(/\.[\w-]+/g) ?? []).length;
      s.classes += (t.match(/\[[^\]]+\]/g) ?? []).length;
      const pseudos = (t.match(/::?[\w-]+(\([^)]*\))?/g) ?? []).filter((p) => !p.startsWith("::"));
      s.classes += pseudos.length;
      const bare = t.replace(/#[\w-]+/g, "").replace(/\.[\w-]+/g, "").replace(/\[[^\]]+\]/g, "").replace(/::?[\w-]+(\([^)]*\))?/g, "").replace(/[^a-zA-Z]/g, "");
      if (bare) s.elements += 1;
      const pseudoEls = (t.match(/::[\w-]+/g) ?? []).length;
      s.elements += pseudoEls;
    }
    return s;
  }, [sel]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <Field label="CSS selector">
            <input className="input !w-96 font-mono" value={sel} onChange={(e) => setSel(e.target.value)} placeholder="e.g. #header .nav li > a:hover" />
          </Field>
        </OptionsBar>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="card p-4 text-center"><div className="text-3xl font-mono text-accent">{spec.ids}</div><div className="text-xs text-ink-dim mt-1">ID selectors</div></div>
          <div className="card p-4 text-center"><div className="text-3xl font-mono text-accent">{spec.classes}</div><div className="text-xs text-ink-dim mt-1">Classes, attributes, pseudo-classes</div></div>
          <div className="card p-4 text-center"><div className="text-3xl font-mono text-accent">{spec.elements}</div><div className="text-xs text-ink-dim mt-1">Elements & pseudo-elements</div></div>
        </div>
        <OutputArea text={`Specificity: (${spec.ids}, ${spec.classes}, ${spec.elements}) — often written as ${spec.ids},${spec.classes},${spec.elements}`} filename="specificity.txt" rows={2} />
      </div>
    </ToolLayout>
  );
};

// ── CSS unit converter ──
export const CssUnitTool: ComponentType = () => {
  const [px, setPx] = useState(16);
  const [baseFont, setBaseFont] = useState(16);
  const [vw, setVw] = useState(1440);
  const conversions = useMemo(() => ([
    ["px", px],
    ["rem", px / baseFont],
    ["em", px / baseFont],
    ["pt", px * 0.75],
    ["%", (px / baseFont) * 100],
    ["vw", (px / vw) * 100],
  ] as [string, number][]), [px, baseFont, vw]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="Value in px" value={px} step={0.5} onChange={setPx} />
          <NumField label="Root font size (px)" value={baseFont} min={8} max={32} onChange={setBaseFont} />
          <NumField label="Viewport width (px)" value={vw} min={200} max={7680} onChange={setVw} />
        </OptionsBar>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {conversions.map(([unit, val]) => (
            <div key={unit} className="card px-3 py-2.5 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wide text-ink-dim">{unit}</span>
              <span className="font-mono text-sm text-accent">{val.toFixed(3).replace(/\.?0+$/, "")}</span>
            </div>
          ))}
        </div>
        <OutputArea text={conversions.map(([u, v]) => `${px}px = ${v.toFixed(4).replace(/\.?0+$/, "")}${u}`).join("\n")} filename="css-units.txt" rows={3} />
      </div>
    </ToolLayout>
  );
};

// ── Flexbox cheatsheet ──
const CHEATS: [string, string, string][] = [
  ["display: flex", "Enables flex layout on the container.", "display: flex;"],
  ["flex-direction", "Main axis: row | row-reverse | column | column-reverse", "flex-direction: row;"],
  ["justify-content", "Distribution on the main axis", "justify-content: space-between;"],
  ["align-items", "Alignment on the cross axis", "align-items: center;"],
  ["flex-wrap", "Allow wrapping onto multiple lines", "flex-wrap: wrap;"],
  ["gap", "Spacing between items (row-gap + column-gap)", "gap: 12px;"],
  ["flex-grow", "How much an item grows relative to siblings", "flex-grow: 1;"],
  ["flex-shrink", "How much an item shrinks when space is tight", "flex-shrink: 0;"],
  ["flex-basis", "Initial main size before growing/shrinking", "flex-basis: 240px;"],
  ["flex (shorthand)", "grow shrink basis", "flex: 1 1 240px;"],
  ["align-self", "Per-item cross-axis override", "align-self: flex-end;"],
  ["order", "Visual order independent of DOM order", "order: -1;"],
  ["align-content", "Distribution of wrapped lines", "align-content: space-around;"],
  ["center anything", "Classic perfect-centering recipe", "display: flex;\njustify-content: center;\nalign-items: center;"],
];
export const FlexboxCheatsheetTool: ComponentType = () => {
  const [q, setQ] = useState("");
  const list = CHEATS.filter(([t, d]) => (t + d).toLowerCase().includes(q.toLowerCase()));
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <input className="input max-w-sm" placeholder="Filter properties…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter cheatsheet" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {list.map(([name, desc, code]) => (
            <div key={name} className="card p-3.5">
              <div className="flex items-center justify-between gap-2">
                <code className="font-mono text-sm text-accent">{name}</code>
                <CopyButton text={code} />
              </div>
              <p className="text-xs text-ink-muted mt-1.5 leading-relaxed">{desc}</p>
              <pre className="mt-2 bg-surface-3 rounded-tool-sm p-2 font-mono text-[12px] text-ink-muted overflow-x-auto whitespace-pre">{code}</pre>
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
};

// ── shared small color input ──
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex gap-1.5 items-center">
        <input type="color" className="w-9 h-8 rounded-tool-sm border border-border bg-surface-3 cursor-pointer" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} />
        <input className="input !w-20 font-mono" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </Field>
  );
}

function hexA(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

function mix(a: string, b: string, amount: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.replace("#", "").slice(i - 1, i + 1), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.replace("#", "").slice(i - 1, i + 1), 16));
  const out = pa.map((v, i) => Math.round(v + (pb[i] - v) * amount));
  return "#" + out.map((v) => v.toString(16).padStart(2, "0")).join("");
}
