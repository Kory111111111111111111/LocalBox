// Converters category — generic unit-converter factory + the 17 tools.
import { useState, type ComponentType } from "react";
import ToolLayout from "../../components/ToolLayout";
import { Note, NumField, OptionsBar, OutputArea, SelField, StatGrid } from "../../components/ui";

type Unit = { id: string; label: string; to: (v: number) => number; from: (v: number) => number };
const lin = (id: string, label: string, factor: number): Unit => ({
  id, label, to: (v) => v * factor, from: (v) => v / factor,
});

function UnitConverter({ units, defFrom, defTo, value: initValue = 1 }: {
  units: Unit[]; defFrom: string; defTo: string; value?: number;
}) {
  const [value, setValue] = useState(initValue);
  const [from, setFrom] = useState(defFrom);
  const [to, setTo] = useState(defTo);
  const fromUnit = units.find((u) => u.id === from)!;
  const toUnit = units.find((u) => u.id === to)!;
  const converted = toUnit.from(fromUnit.to(value));
  const fmt = (n: number) =>
    Number.isFinite(n) ? parseFloat(n.toPrecision(10)).toLocaleString(undefined, { maximumFractionDigits: 10 }) : "—";
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="Value" value={value} onChange={(v) => setValue(v || 0)} />
          <SelField label="From" value={from} onChange={setFrom} options={units.map((u) => ({ value: u.id, label: u.label }))} />
          <SelField label="To" value={to} onChange={setTo} options={units.map((u) => ({ value: u.id, label: u.label }))} />
          <button className="btn-ghost self-end" onClick={() => { setFrom(to); setTo(from); }}>⇄ Swap</button>
        </OptionsBar>
        <div className="card p-6 text-center">
          <div className="text-3xl font-mono text-accent break-all">{fmt(converted)}</div>
          <div className="text-sm text-ink-muted mt-1">{fmt(value)} {fromUnit.label} = {fmt(converted)} {toUnit.label}</div>
        </div>
        <div className="card overflow-hidden">
          <div className="px-3 py-2 border-b border-border text-xs text-ink-dim">All conversions from {fmt(value)} {fromUnit.label}</div>
          <table className="w-full text-[13px]">
            <tbody className="divide-y divide-border-subtle">
              {units.map((u) => (
                <tr key={u.id} className={`hover:bg-surface-2 ${u.id === to ? "text-accent" : ""}`}>
                  <td className="px-3 py-1.5">{u.label}</td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums">{fmt(u.from(fromUnit.to(value)))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ToolLayout>
  );
}

const conv = (units: Unit[], defFrom: string, defTo: string, init = 1): ComponentType =>
  () => <UnitConverter units={units} defFrom={defFrom} defTo={defTo} value={init} />;

// ── Byte / bit converter ──
const BYTE_UNITS: Unit[] = [
  lin("bit", "bit", 1 / 8), lin("byte", "byte (B)", 1),
  lin("kb", "kilobyte (kB, 1000)", 1e3), lin("mb", "megabyte (MB)", 1e6), lin("gb", "gigabyte (GB)", 1e9),
  lin("tb", "terabyte (TB)", 1e12), lin("pb", "petabyte (PB)", 1e15),
  lin("kib", "kibibyte (KiB, 1024)", 1024), lin("mib", "mebibyte (MiB)", 1024 ** 2),
  lin("gib", "gibibyte (GiB)", 1024 ** 3), lin("tib", "tebibyte (TiB)", 1024 ** 4),
];
export const ByteConverterTool = conv(BYTE_UNITS, "mb", "gb", 500);
export const DataStorageConverterTool = conv(BYTE_UNITS, "gb", "mib", 1);

// ── Length ──
const LENGTH_UNITS: Unit[] = [
  lin("mm", "millimeter", 0.001), lin("cm", "centimeter", 0.01), lin("m", "meter", 1),
  lin("km", "kilometer", 1000), lin("in", "inch", 0.0254), lin("ft", "foot", 0.3048),
  lin("yd", "yard", 0.9144), lin("mi", "mile", 1609.344), lin("nmi", "nautical mile", 1852),
];
export const LengthConverterTool = conv(LENGTH_UNITS, "m", "ft", 1);

// ── Weight ──
const WEIGHT_UNITS: Unit[] = [
  lin("mg", "milligram", 1e-6), lin("g", "gram", 0.001), lin("kg", "kilogram", 1),
  lin("t", "metric ton", 1000), lin("oz", "ounce", 0.028349523125), lin("lb", "pound", 0.45359237),
  lin("st", "stone", 6.35029318),
];
export const WeightConverterTool = conv(WEIGHT_UNITS, "kg", "lb", 1);

// ── Temperature ──
const TEMP_UNITS: Unit[] = [
  { id: "c", label: "Celsius (°C)", to: (v) => v, from: (v) => v },
  { id: "f", label: "Fahrenheit (°F)", to: (v) => ((v - 32) * 5) / 9, from: (v) => (v * 9) / 5 + 32 },
  { id: "k", label: "Kelvin (K)", to: (v) => v - 273.15, from: (v) => v + 273.15 },
  { id: "r", label: "Rankine (°R)", to: (v) => ((v - 491.67) * 5) / 9, from: (v) => ((v + 273.15) * 9) / 5 },
];
export const TemperatureConverterTool = conv(TEMP_UNITS, "c", "f", 21);

// ── Speed ──
const SPEED_UNITS: Unit[] = [
  lin("ms", "meter/second", 1), lin("kmh", "kilometer/hour", 1 / 3.6), lin("mph", "mile/hour", 0.44704),
  lin("kn", "knot", 0.514444), lin("fts", "foot/second", 0.3048),
];
export const SpeedConverterTool = conv(SPEED_UNITS, "kmh", "mph", 100);

// ── Area ──
const AREA_UNITS: Unit[] = [
  lin("cm2", "square centimeter", 1e-4), lin("m2", "square meter", 1), lin("ha", "hectare", 1e4),
  lin("km2", "square kilometer", 1e6), lin("in2", "square inch", 0.00064516),
  lin("ft2", "square foot", 0.09290304), lin("yd2", "square yard", 0.83612736),
  lin("acre", "acre", 4046.8564224), lin("mi2", "square mile", 2589988.110336),
];
export const AreaConverterTool = conv(AREA_UNITS, "m2", "ft2", 100);

// ── Volume ──
const VOL_UNITS: Unit[] = [
  lin("ml", "milliliter", 0.001), lin("l", "liter", 1), lin("m3", "cubic meter", 1000),
  lin("tsp", "teaspoon (US)", 0.00492892), lin("tbsp", "tablespoon (US)", 0.0147868),
  lin("floz", "fluid ounce (US)", 0.0295735), lin("cup", "cup (US)", 0.236588),
  lin("pt", "pint (US)", 0.473176), lin("qt", "quart (US)", 0.946353), lin("gal", "gallon (US)", 3.785412),
];
export const VolumeConverterTool = conv(VOL_UNITS, "l", "gal", 2);

// ── Pressure ──
const PRESSURE_UNITS: Unit[] = [
  lin("pa", "pascal", 1), lin("kpa", "kilopascal", 1000), lin("bar", "bar", 1e5),
  lin("atm", "atmosphere", 101325), lin("psi", "psi", 6894.757), lin("mmhg", "mmHg (torr)", 133.322),
];
export const PressureConverterTool = conv(PRESSURE_UNITS, "bar", "psi", 1);

// ── Energy ──
const ENERGY_UNITS: Unit[] = [
  lin("j", "joule", 1), lin("kj", "kilojoule", 1000), lin("cal", "calorie", 4.184),
  lin("kcal", "kilocalorie (food)", 4184), lin("wh", "watt-hour", 3600), lin("kwh", "kilowatt-hour", 3.6e6),
  lin("btu", "BTU", 1055.06),
];
export const EnergyConverterTool = conv(ENERGY_UNITS, "kcal", "kj", 500);

// ── Power ──
const POWER_UNITS: Unit[] = [
  lin("w", "watt", 1), lin("kw", "kilowatt", 1000), lin("mw", "megawatt", 1e6),
  lin("hp", "horsepower (mechanical)", 745.7), lin("btuh", "BTU/hour", 0.293071),
];
export const PowerConverterTool = conv(POWER_UNITS, "kw", "hp", 1);

// ── Angle ──
const ANGLE_UNITS: Unit[] = [
  lin("deg", "degree", 1), lin("rad", "radian", 57.29577951308232), lin("grad", "gradian", 0.9),
  lin("turn", "turn", 360), lin("arcmin", "arcminute", 1 / 60), lin("arcsec", "arcsecond", 1 / 3600),
];
export const AngleConverterTool = conv(ANGLE_UNITS, "deg", "rad", 180);

// ── Time ──
const TIME_UNITS: Unit[] = [
  lin("ms", "millisecond", 0.001), lin("s", "second", 1), lin("min", "minute", 60),
  lin("h", "hour", 3600), lin("d", "day", 86400), lin("wk", "week", 604800),
  lin("mo", "month (30.44 d)", 2629800), lin("yr", "year (365.25 d)", 31557600),
];
export const TimeConverterTool = conv(TIME_UNITS, "h", "min", 90);

// ── Fuel efficiency (reciprocal conversions via L/100km base) ──
const FUEL_UNITS: Unit[] = [
  { id: "l100", label: "liters / 100 km", to: (v) => v, from: (v) => v },
  { id: "kmpl", label: "km / liter", to: (v) => 100 / v, from: (v) => 100 / v },
  { id: "mpgus", label: "mpg (US)", to: (v) => 235.214583 / v, from: (v) => 235.214583 / v },
  { id: "mpguk", label: "mpg (UK)", to: (v) => 282.480936 / v, from: (v) => 282.480936 / v },
];
export const FuelConverterTool = conv(FUEL_UNITS, "mpgus", "l100", 30);

// ── Aspect ratio calculator ──
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
export const AspectRatioTool: ComponentType = () => {
  const [w, setW] = useState(1920);
  const [h, setH] = useState(1080);
  const [newW, setNewW] = useState(1280);
  const g = gcd(Math.round(w) || 1, Math.round(h) || 1);
  const ratio = `${Math.round(w) / g}:${Math.round(h) / g}`;
  const decimal = h ? (w / h).toFixed(4) : "—";
  const scaledH = w ? Math.round((newW * h) / w) : 0;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="Width (px)" value={w} min={1} onChange={setW} />
          <NumField label="Height (px)" value={h} min={1} onChange={setH} />
          <NumField label="Scale to width" value={newW} min={1} onChange={setNewW} />
        </OptionsBar>
        <StatGrid items={[
          { label: "Aspect ratio", value: ratio, strong: true },
          { label: "Decimal", value: decimal, strong: true },
          { label: `Height at ${newW}px wide`, value: `${scaledH}px` },
          { label: "Megapixels", value: `${((w * h) / 1e6).toFixed(2)} MP` },
        ]} />
        <div className="card p-6 flex justify-center">
          <div className="border-2 border-accent rounded-tool-sm bg-accent/10" style={{ width: Math.min(320, (newW / Math.max(scaledH, 1)) * 160), aspectRatio: `${w} / ${h}`, maxHeight: 200, minHeight: 20 }} />
        </div>
      </div>
    </ToolLayout>
  );
};

// ── Image resolution converter ──
export const ResolutionConverterTool: ComponentType = () => {
  const [px, setPx] = useState(1920);
  const [dpi, setDpi] = useState(300);
  const inches = dpi ? px / dpi : 0;
  const cm = inches * 2.54;
  const [printW, setPrintW] = useState(8.5);
  const neededDpi = printW ? px / printW : 0;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="Pixels" value={px} min={1} onChange={setPx} />
          <NumField label="DPI / PPI" value={dpi} min={1} onChange={setDpi} />
          <NumField label="Print width (inches)" value={printW} step={0.5} onChange={setPrintW} />
        </OptionsBar>
        <StatGrid items={[
          { label: "Print size", value: `${inches.toFixed(2)} in`, strong: true },
          { label: "Metric size", value: `${cm.toFixed(2)} cm`, strong: true },
          { label: "DPI at print width", value: `${neededDpi.toFixed(0)} DPI` },
          { label: "Total pixels", value: `${px.toLocaleString()} px` },
        ]} />
        <Note>DPI only matters when mapping pixels onto a physical size (printing). Screens render at their native pixel density.</Note>
      </div>
    </ToolLayout>
  );
};

// ── Currency converter — offline snapshot ──
// Indicative mid-rates, snapshot dated 2026-09-12, base USD. Offline by design.
const RATES: Record<string, number> = {
  USD: 1, EUR: 0.86, GBP: 0.74, JPY: 149.3, CNY: 7.12, CHF: 0.87, CAD: 1.31,
  AUD: 1.53, NZD: 1.67, INR: 88.6, BRL: 5.62, MXN: 20.3, ZAR: 18.2,
  SEK: 10.7, NOK: 10.9, DKK: 6.42, PLN: 4.05, CZK: 23.1, HUF: 375,
  TRY: 41.5, KRW: 1390, SGD: 1.34, HKD: 7.79, THB: 36.1, IDR: 16250,
  PHP: 59.8, MYR: 4.52, VND: 26200, AED: 3.67, SAR: 3.75, ILS: 3.72,
};
export const CurrencyConverterTool: ComponentType = () => {
  const [amount, setAmount] = useState(100);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const rate = RATES[to] / RATES[from];
  const converted = amount * rate;
  const opts = Object.keys(RATES).map((c) => ({ value: c, label: c }));
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="Amount" value={amount} onChange={(v) => setAmount(v || 0)} />
          <SelField label="From" value={from} onChange={setFrom} options={opts} />
          <SelField label="To" value={to} onChange={setTo} options={opts} />
        </OptionsBar>
        <div className="card p-6 text-center">
          <div className="text-3xl font-mono text-accent">
            {to} {converted.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-ink-muted mt-1">1 {from} = {rate.toFixed(4)} {to}</div>
        </div>
        <Note kind="warn">
          <strong>Offline snapshot rates</strong> (dated 2026-09-12) — this tool never calls a live
          exchange-rate API, so it works in airplane mode. Rates are indicative and rounded; don't
          use them for accounting or trading. Live-rate conversion would require a network call, which
          this toolbox avoids by default.
        </Note>
        <OutputArea text={Object.entries(RATES).map(([c, r]) => `1 USD = ${r} ${c}`).join("\n")} filename="rates.txt" rows={4} label="Full snapshot table (from 1 USD)" />
      </div>
    </ToolLayout>
  );
};

// pack mapping
export const tools: Record<string, ComponentType> = {
  "byte-converter": ByteConverterTool,
  "data-storage-convert": DataStorageConverterTool,
  "length-convert": LengthConverterTool,
  "weight-convert": WeightConverterTool,
  "temperature-convert": TemperatureConverterTool,
  "speed-convert": SpeedConverterTool,
  "area-convert": AreaConverterTool,
  "volume-convert": VolumeConverterTool,
  "pressure-convert": PressureConverterTool,
  "energy-convert": EnergyConverterTool,
  "power-convert": PowerConverterTool,
  "angle-convert": AngleConverterTool,
  "time-convert": TimeConverterTool,
  "fuel-convert": FuelConverterTool,
  "aspect-ratio-calc": AspectRatioTool,
  "resolution-convert": ResolutionConverterTool,
  "currency-convert": CurrencyConverterTool,
};
