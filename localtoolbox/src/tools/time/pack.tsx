// Time & Date category — 14 tools, all local (Intl API + pure math).
import { useEffect, useMemo, useState, type ComponentType } from "react";
import ToolLayout from "../../components/ToolLayout";
import { Note, NumField, OptionsBar, OutputArea, RunButton, SelField, StatGrid, Toggle } from "../../components/ui";

const DAY = 86400000;
const fmtDate = (d: Date, opts?: Intl.DateTimeFormatOptions) => d.toLocaleString(undefined, opts ?? { dateStyle: "full" });

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input type="date" className="input !w-44" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
const todayISO = () => new Date().toISOString().slice(0, 10);
const parseISO = (s: string) => new Date(s + "T00:00:00");

// ── Timestamp converter ──
export const TimestampTool: ComponentType = () => {
  const [ts, setTs] = useState(() => Math.floor(Date.now() / 1000));
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 16));
  const fromTs = new Date(ts * (ts > 1e12 ? 1 : 1000));
  const fromDate = new Date(dateStr);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="Unix timestamp (s)" value={ts} onChange={(v) => setTs(Math.floor(v || 0))} />
          <RunButton label="Now" onClick={() => setTs(Math.floor(Date.now() / 1000))} />
        </OptionsBar>
        <StatGrid items={[
          { label: "UTC", value: fromTs.toUTCString(), strong: true },
          { label: "Your timezone", value: fromTs.toLocaleString(), strong: true },
          { label: "ISO 8601", value: fromTs.toISOString() },
          { label: "Relative", value: (() => { const diff = (Date.now() - fromTs.getTime()) / 1000; const abs = Math.abs(diff); const unit = abs < 60 ? `${abs.toFixed(0)}s` : abs < 3600 ? `${(abs / 60).toFixed(0)}m` : abs < 86400 ? `${(abs / 3600).toFixed(1)}h` : `${(abs / 86400).toFixed(1)}d`; return diff >= 0 ? `${unit} ago` : `in ${unit}`; })() },
        ]} />
        <OptionsBar>
          <label className="block">
            <span className="label">Date/time → timestamp</span>
            <input type="datetime-local" className="input !w-56" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
          </label>
          <span className="self-end font-mono text-sm text-accent">{Number.isFinite(fromDate.getTime()) ? Math.floor(fromDate.getTime() / 1000) : "—"}</span>
        </OptionsBar>
      </div>
    </ToolLayout>
  );
};

// ── Date difference ──
export const DateDiffTool: ComponentType = () => {
  const [a, setA] = useState(todayISO());
  const [b, setB] = useState(() => new Date(Date.now() + 30 * DAY).toISOString().slice(0, 10));
  const diff = useMemo(() => {
    const d1 = parseISO(a);
    const d2 = parseISO(b);
    if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return null;
    const ms = d2.getTime() - d1.getTime();
    let years = d2.getFullYear() - d1.getFullYear();
    let months = d2.getMonth() - d1.getMonth();
    let days = d2.getDate() - d1.getDate();
    if (days < 0) { months--; days += new Date(d2.getFullYear(), d2.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    return { days: Math.round(ms / DAY), weeks: Math.round(ms / (7 * DAY)), ymd: `${years}y ${months}m ${days}d`, hours: Math.round(ms / 3600000) };
  }, [a, b]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <DateField label="From" value={a} onChange={setA} />
          <DateField label="To" value={b} onChange={setB} />
        </OptionsBar>
        {diff && (
          <StatGrid items={[
            { label: "Total days", value: diff.days.toLocaleString(), strong: true },
            { label: "Total weeks", value: diff.weeks.toLocaleString(), strong: true },
            { label: "Calendar split", value: diff.ymd },
            { label: "Total hours", value: diff.hours.toLocaleString() },
          ]} />
        )}
      </div>
    </ToolLayout>
  );
};

// ── Date add/subtract ──
export const DateAddTool: ComponentType = () => {
  const [base, setBase] = useState(todayISO());
  const [days, setDays] = useState(30);
  const [months, setMonths] = useState(0);
  const [years, setYears] = useState(0);
  const result = useMemo(() => {
    const d = parseISO(base);
    if (Number.isNaN(d.getTime())) return null;
    const out = new Date(d);
    out.setFullYear(out.getFullYear() + years);
    out.setMonth(out.getMonth() + months);
    out.setDate(out.getDate() + days);
    return out;
  }, [base, days, months, years]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <DateField label="Start date" value={base} onChange={setBase} />
          <NumField label="+ days" value={days} onChange={setDays} />
          <NumField label="+ months" value={months} onChange={setMonths} />
          <NumField label="+ years" value={years} onChange={setYears} />
        </OptionsBar>
        {result && (
          <StatGrid items={[
            { label: "Result", value: fmtDate(result), strong: true },
            { label: "ISO", value: result.toISOString().slice(0, 10) },
            { label: "Day of week", value: result.toLocaleDateString(undefined, { weekday: "long" }) },
          ]} />
        )}
        <Note>Negative numbers subtract. Month arithmetic clamps to the end of short months (Jan 31 + 1 month → Feb 28).</Note>
      </div>
    </ToolLayout>
  );
};

// ── Age calculator ──
export const AgeTool: ComponentType = () => {
  const [birth, setBirth] = useState("1990-06-15");
  const [asOf, setAsOf] = useState(todayISO());
  const age = useMemo(() => {
    const b = parseISO(birth);
    const n = parseISO(asOf);
    if (Number.isNaN(b.getTime()) || Number.isNaN(n.getTime()) || n < b) return null;
    let years = n.getFullYear() - b.getFullYear();
    let months = n.getMonth() - b.getMonth();
    let days = n.getDate() - b.getDate();
    if (days < 0) { months--; days += new Date(n.getFullYear(), n.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    const totalDays = Math.floor((n.getTime() - b.getTime()) / DAY);
    const nextBirthday = new Date(n.getFullYear(), b.getMonth(), b.getDate());
    if (nextBirthday < n) nextBirthday.setFullYear(n.getFullYear() + 1);
    return { years, months, days, totalDays, weeks: Math.floor(totalDays / 7), hours: totalDays * 24, nextIn: Math.ceil((nextBirthday.getTime() - n.getTime()) / DAY) };
  }, [birth, asOf]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <DateField label="Date of birth" value={birth} onChange={setBirth} />
          <DateField label="Age at date" value={asOf} onChange={setAsOf} />
        </OptionsBar>
        {age && (
          <StatGrid items={[
            { label: "Age", value: `${age.years} years, ${age.months} months, ${age.days} days`, strong: true },
            { label: "Total days lived", value: age.totalDays.toLocaleString(), strong: true },
            { label: "Total weeks", value: age.weeks.toLocaleString() },
            { label: "Total hours", value: age.hours.toLocaleString() },
            { label: "Next birthday in", value: `${age.nextIn} day${age.nextIn === 1 ? "" : "s"}` },
          ]} />
        )}
      </div>
    </ToolLayout>
  );
};

// ── Countdown timer ──
export const CountdownTool: ComponentType = () => {
  const [target, setTarget] = useState(() => new Date(Date.now() + 7 * DAY).toISOString().slice(0, 16));
  const [label, setLabel] = useState("Launch");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const t = new Date(target).getTime() - now;
  const parts = t > 0
    ? { d: Math.floor(t / DAY), h: Math.floor(t / 3600000) % 24, m: Math.floor(t / 60000) % 60, s: Math.floor(t / 1000) % 60 }
    : null;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block flex-1 min-w-40"><span className="label">Event name</span>
            <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} /></label>
          <label className="block">
            <span className="label">Target date & time</span>
            <input type="datetime-local" className="input !w-56" value={target} onChange={(e) => setTarget(e.target.value)} />
          </label>
        </OptionsBar>
        <div className="card p-8 text-center">
          {parts ? (
            <div className="flex justify-center gap-4 font-mono">
              {[["days", parts.d], ["hrs", parts.h], ["min", parts.m], ["sec", parts.s]].map(([u, v]) => (
                <div key={u as string}>
                  <div className="text-4xl text-accent tabular-nums">{String(v).padStart(2, "0")}</div>
                  <div className="text-xs text-ink-dim mt-1">{u as string}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xl font-semibold text-success">🎉 {label || "The event"} has arrived!</div>
          )}
          <div className="mt-3 text-sm text-ink-muted">{new Date(target).toLocaleString()}</div>
        </div>
      </div>
    </ToolLayout>
  );
};

// ── World clock ──
const ZONES = ["UTC", "America/Los_Angeles", "America/New_York", "America/Sao_Paulo", "Europe/London", "Europe/Berlin", "Europe/Moscow", "Africa/Cairo", "Asia/Dubai", "Asia/Kolkata", "Asia/Shanghai", "Asia/Tokyo", "Australia/Sydney", "Pacific/Auckland"];
export const WorldClockTool: ComponentType = () => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <ToolLayout>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {ZONES.map((z) => {
          const time = new Intl.DateTimeFormat(undefined, { timeZone: z, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now);
          const date = new Intl.DateTimeFormat(undefined, { timeZone: z, weekday: "short", month: "short", day: "numeric" }).format(now);
          return (
            <div key={z} className="card p-3.5">
              <div className="text-xs text-ink-dim">{z.split("/").pop()?.replace(/_/g, " ")}</div>
              <div className="text-2xl font-mono tabular-nums mt-0.5">{time}</div>
              <div className="text-[11px] text-ink-muted mt-0.5">{date} · {z}</div>
            </div>
          );
        })}
      </div>
    </ToolLayout>
  );
};

// ── Timezone converter ──
export const TimezoneConverterTool: ComponentType = () => {
  const [dt, setDt] = useState(() => new Date().toISOString().slice(0, 16));
  const [zones, setZones] = useState<string[]>(["UTC", "America/New_York", "Europe/London", "Asia/Tokyo"]);
  const [pick, setPick] = useState("Asia/Shanghai");
  const when = new Date(dt);
  const valid = Number.isFinite(when.getTime());
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block">
            <span className="label">Time (your local zone)</span>
            <input type="datetime-local" className="input !w-56" value={dt} onChange={(e) => setDt(e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Add a zone</span>
            <select className="select !w-48" value={pick} onChange={(e) => setZones((z) => (z.includes(e.target.value) ? z : [...z, e.target.value]))}>
              {(Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf
                ? (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf("timeZone").slice(0, 400).map((z) => <option key={z} value={z}>{z}</option>)
                : ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </label>
        </OptionsBar>
        {valid && (
          <div className="card divide-y divide-border-subtle overflow-hidden">
            {zones.map((z) => (
              <div key={z} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <span className="flex-1">{z}</span>
                <span className="font-mono text-accent">{new Intl.DateTimeFormat(undefined, { timeZone: z, weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(when)}</span>
                <button className="btn-ghost !px-2 !py-0.5 text-xs" onClick={() => setZones((old) => old.filter((x) => x !== z))} aria-label={`Remove ${z}`}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

// ── Multi-timezone converter (same instant, fixed grid) ──
export const MultiTimezoneTool: ComponentType = () => {
  const [dt, setDt] = useState(() => new Date().toISOString().slice(0, 16));
  const when = new Date(dt);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block">
            <span className="label">One moment in time</span>
            <input type="datetime-local" className="input !w-56" value={dt} onChange={(e) => setDt(e.target.value)} />
          </label>
        </OptionsBar>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {ZONES.map((z) => (
            <div key={z} className="card p-3">
              <div className="text-[11px] text-ink-dim truncate">{z}</div>
              <div className="font-mono text-sm mt-1 text-accent">
                {Number.isFinite(when.getTime())
                  ? new Intl.DateTimeFormat(undefined, { timeZone: z, hour: "2-digit", minute: "2-digit", day: "numeric", month: "short", hour12: false }).format(when)
                  : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
};

// ── Day of year ──
export const DayOfYearTool: ComponentType = () => {
  const [date, setDate] = useState(todayISO());
  const info = useMemo(() => {
    const d = parseISO(date);
    if (Number.isNaN(d.getTime())) return null;
    const start = new Date(d.getFullYear(), 0, 1);
    const doy = Math.floor((d.getTime() - start.getTime()) / DAY) + 1;
    const leap = (d.getFullYear() % 4 === 0 && d.getFullYear() % 100 !== 0) || d.getFullYear() % 400 === 0;
    const total = leap ? 366 : 365;
    return { doy, total, leap, pct: ((doy / total) * 100).toFixed(1), week: Math.ceil(doy / 7) };
  }, [date]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar><DateField label="Date" value={date} onChange={setDate} /></OptionsBar>
        {info && (
          <StatGrid items={[
            { label: "Day of year", value: String(info.doy), strong: true },
            { label: "Year length", value: `${info.total} days (${info.leap ? "leap" : "common"})` },
            { label: "Percent of year", value: `${info.pct}%` },
            { label: "Approx. week", value: String(info.week) },
          ]} />
        )}
      </div>
    </ToolLayout>
  );
};

// ── Week number ──
export const WeekNumberTool: ComponentType = () => {
  const [date, setDate] = useState(todayISO());
  const info = useMemo(() => {
    const d = parseISO(date);
    if (Number.isNaN(d.getTime())) return null;
    // ISO-8601 week number
    const target = new Date(d.getTime());
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = new Date(target.getFullYear(), 0, 4);
    const firstDayNr = (firstThursday.getDay() + 6) % 7;
    firstThursday.setDate(firstThursday.getDate() - firstDayNr + 3);
    const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * DAY));
    return { week, isoYear: target.getFullYear(), quarter: Math.floor(d.getMonth() / 3) + 1 };
  }, [date]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar><DateField label="Date" value={date} onChange={setDate} /></OptionsBar>
        {info && (
          <StatGrid items={[
            { label: "ISO week number", value: String(info.week), strong: true },
            { label: "ISO year", value: String(info.isoYear) },
            { label: "Quarter", value: `Q${info.quarter}` },
          ]} />
        )}
        <Note>ISO-8601 weeks start on Monday; week 1 contains the year's first Thursday.</Note>
      </div>
    </ToolLayout>
  );
};

// ── Working days ──
export const WorkingDaysTool: ComponentType = () => {
  const [a, setA] = useState(todayISO());
  const [b, setB] = useState(() => new Date(Date.now() + 30 * DAY).toISOString().slice(0, 10));
  const [skipWeekends, setSkipWeekends] = useState(true);
  const res = useMemo(() => {
    const d1 = parseISO(a);
    const d2 = parseISO(b);
    if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return null;
    const start = d1 < d2 ? d1 : d2;
    const end = d1 < d2 ? d2 : d1;
    let working = 0;
    let weekend = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay();
      if (dow === 0 || dow === 6) weekend++;
      else working++;
    }
    return { total: working + weekend - 1 < 0 ? 0 : Math.round((end.getTime() - start.getTime()) / DAY) + 1, working: skipWeekends ? working : working + weekend, weekend };
  }, [a, b, skipWeekends]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <DateField label="From" value={a} onChange={setA} />
          <DateField label="To" value={b} onChange={setB} />
          <div><span className="label">Count</span><Toggle label="Exclude weekends" checked={skipWeekends} onChange={setSkipWeekends} /></div>
        </OptionsBar>
        {res && (
          <StatGrid items={[
            { label: skipWeekends ? "Working days" : "All days", value: String(res.working), strong: true },
            { label: "Calendar days", value: String(res.total) },
            { label: "Weekend days", value: String(res.weekend) },
          ]} />
        )}
        <Note>Public holidays vary by country and aren't subtracted — adjust manually if needed.</Note>
      </div>
    </ToolLayout>
  );
};

// ── Time to decimal ──
export const TimeToDecimalTool: ComponentType = () => {
  const [hhmm, setHhmm] = useState("07:45");
  const decimal = useMemo(() => {
    const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    return parseInt(m[1], 10) + parseInt(m[2], 10) / 60;
  }, [hhmm]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block">
            <span className="label">Time (HH:MM)</span>
            <input className="input !w-28 font-mono" value={hhmm} onChange={(e) => setHhmm(e.target.value)} placeholder="07:45" />
          </label>
        </OptionsBar>
        {decimal !== null ? (
          <StatGrid items={[
            { label: "Decimal hours", value: decimal.toFixed(4).replace(/0+$/, "").replace(/\.$/, ""), strong: true },
            { label: "Total minutes", value: String(Math.round(decimal * 60)) },
            { label: "Total seconds", value: String(Math.round(decimal * 3600)) },
          ]} />
        ) : <Note kind="error">Use the HH:MM format, e.g. 07:45.</Note>}
      </div>
    </ToolLayout>
  );
};

// ── Moon phase ──
export const MoonPhaseTool: ComponentType = () => {
  const [date, setDate] = useState(todayISO());
  const phase = useMemo(() => {
    const d = parseISO(date);
    if (Number.isNaN(d.getTime())) return null;
    // Conrough/synodic approximation: known new moon 2000-01-06 18:14 UTC
    const synodic = 29.530588853;
    const known = Date.UTC(2000, 0, 6, 18, 14) / DAY;
    const days = d.getTime() / DAY - known;
    const age = ((days % synodic) + synodic) % synodic;
    const fraction = age / synodic;
    const names: [number, string][] = [
      [0.03, "New Moon"], [0.22, "Waxing Crescent"], [0.28, "First Quarter"], [0.47, "Waxing Gibbous"],
      [0.53, "Full Moon"], [0.72, "Waning Gibbous"], [0.78, "Last Quarter"], [0.97, "Waning Crescent"], [1.01, "New Moon"],
    ];
    const name = names.find(([limit]) => fraction < limit)?.[1] ?? "New Moon";
    const illum = Math.round((1 - Math.cos(2 * Math.PI * fraction)) / 2 * 100);
    return { age, name, illum, fraction };
  }, [date]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar><DateField label="Date" value={date} onChange={setDate} /></OptionsBar>
        {phase && (
          <>
            <div className="card p-8 text-center">
              <div className="text-5xl mb-2">{phase.name.includes("Full") ? "🌕" : phase.name.includes("New") ? "🌑" : phase.name.includes("First") ? "🌓" : phase.name.includes("Last") ? "🌗" : phase.name.includes("Waxing") ? "🌒" : "🌘"}</div>
              <div className="text-xl font-semibold">{phase.name}</div>
              <div className="text-sm text-ink-muted mt-1">{phase.illum}% illuminated · {phase.age.toFixed(1)} days into the cycle</div>
            </div>
            <StatGrid items={[
              { label: "Moon age", value: `${phase.age.toFixed(2)} days` },
              { label: "Cycle position", value: `${(phase.fraction * 100).toFixed(1)}%` },
              { label: "Illumination", value: `${phase.illum}%` },
            ]} />
          </>
        )}
        <Note>Phases are computed from a mean synodic month — accurate to within a day, which is plenty for planning but not for astronomy grade work.</Note>
      </div>
    </ToolLayout>
  );
};

// ── Sunrise & sunset (NOAA algorithm, fully offline) ──
export const SunriseSunsetTool: ComponentType = () => {
  const [lat, setLat] = useState(40.7128);
  const [lon, setLon] = useState(-74.006);
  const [date, setDate] = useState(todayISO());
  const res = useMemo(() => {
    const d = parseISO(date);
    if (Number.isNaN(d.getTime())) return null;
    const rad = Math.PI / 180;
    const day = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / DAY);
    // NOAA solar calculations
    const gamma = ((2 * Math.PI) / 365) * (day - 1);
    const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
    const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
    const latRad = lat * rad;
    const cosZenith = Math.cos(90.833 * rad);
    const cosHour = (cosZenith - Math.sin(latRad) * Math.sin(decl)) / (Math.cos(latRad) * Math.cos(decl));
    if (cosHour > 1) return { polar: "sun-below" as const };
    if (cosHour < -1) return { polar: "sun-above" as const };
    const hourAngle = Math.acos(cosHour) / rad;
    const solarNoonMin = 720 - 4 * lon - eqTime;
    const sunriseMin = solarNoonMin - 4 * hourAngle;
    const sunsetMin = solarNoonMin + 4 * hourAngle;
    const hm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(Math.floor(m % 60)).padStart(2, "0")}`;
    return {
      sunrise: hm(sunriseMin), sunset: hm(sunsetMin), noon: hm(solarNoonMin),
      daylight: hm(sunsetMin - sunriseMin),
    };
  }, [lat, lon, date]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="Latitude" value={lat} min={-90} max={90} step={0.0001} onChange={setLat} />
          <NumField label="Longitude" value={lon} min={-180} max={180} step={0.0001} onChange={setLon} />
          <DateField label="Date" value={date} onChange={setDate} />
        </OptionsBar>
        {res && ("polar" in res
          ? <Note kind="warn">{res.polar === "sun-below" ? "Polar night — the sun stays below the horizon at this location and date." : "Midnight sun — the sun never sets at this location and date."}</Note>
          : (
            <StatGrid items={[
              { label: "Sunrise (local solar time)", value: res.sunrise, strong: true },
              { label: "Solar noon", value: res.noon },
              { label: "Sunset (local solar time)", value: res.sunset, strong: true },
              { label: "Day length", value: res.daylight },
            ]} />
          ))}
        <Note>Computed with the NOAA solar algorithm. Times are <strong>local solar time</strong> (longitude), not your clock timezone.</Note>
      </div>
    </ToolLayout>
  );
};

export const tools: Record<string, ComponentType> = {
  "timestamp-converter": TimestampTool,
  "date-diff": DateDiffTool,
  "date-add": DateAddTool,
  "age-calculator": AgeTool,
  "countdown-timer": CountdownTool,
  "time-zones": WorldClockTool,
  "timezone-converter": TimezoneConverterTool,
  "timezone-converter-2": MultiTimezoneTool,
  "day-of-year": DayOfYearTool,
  "week-number": WeekNumberTool,
  "working-days": WorkingDaysTool,
  "time-to-decimal": TimeToDecimalTool,
  "moon-phase": MoonPhaseTool,
  "sunrise-sunset": SunriseSunsetTool,
};
