// Finance category — 14 calculators. Pure math, labeled informational.
import { useMemo, useState, type ComponentType } from "react";
import ToolLayout from "../../components/ToolLayout";
import { Note, NumField, OptionsBar, OutputArea, RunButton, SelField, StatGrid, Toggle } from "../../components/ui";

const money = (n: number, cur = "$") =>
  `${n < 0 ? "−" : ""}${cur}${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n: number) => `${n.toFixed(2)}%`;

function moneyField(label: string, value: number, onChange: (v: number) => void, step = 1000) {
  return <NumField label={label} value={value} step={step} onChange={onChange} />;
}

// ── Loan / Mortgage (shared amortization math) ──
function amortize(principal: number, annualRate: number, years: number) {
  const n = years * 12;
  const r = annualRate / 100 / 12;
  const monthly = r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));
  const total = monthly * n;
  const interest = total - principal;
  const schedule: { month: number; payment: number; principal: number; interest: number; balance: number }[] = [];
  let balance = principal;
  for (let i = 1; i <= n && schedule.length < 1200; i++) {
    const int = balance * r;
    const princ = monthly - int;
    balance = Math.max(0, balance - princ);
    schedule.push({ month: i, payment: monthly, principal: princ, interest: int, balance });
  }
  return { monthly, total, interest, schedule };
}

function LoanWorkbench({ title }: { title: string }) {
  const [principal, setPrincipal] = useState(300000);
  const [rate, setRate] = useState(5.5);
  const [years, setYears] = useState(30);
  const [extra, setExtra] = useState(0);
  const [showSchedule, setShowSchedule] = useState(false);
  const base = useMemo(() => amortize(principal, rate, years), [principal, rate, years]);
  const withExtra = useMemo(() => {
    if (!extra) return null;
    // simulate payoff with extra monthly payment
    const r = rate / 100 / 12;
    let balance = principal;
    let months = 0;
    let totalPaid = 0;
    const sched: { month: number; balance: number }[] = [];
    const monthly = base.monthly + extra;
    while (balance > 0 && months < 1200) {
      const int = balance * r;
      const princ = Math.min(balance, monthly - int);
      balance -= princ;
      totalPaid += monthly;
      months++;
      if (months % 12 === 0 || balance === 0) sched.push({ month: months, balance });
    }
    return { months, totalPaid, saved: base.total - totalPaid, sched };
  }, [extra, principal, rate, base]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          {moneyField("Loan amount", principal, setPrincipal)}
          <NumField label="Interest rate % / year" value={rate} step={0.1} onChange={setRate} />
          <NumField label="Term (years)" value={years} min={1} max={40} onChange={setYears} />
          {title === "mortgage" && <NumField label="Extra monthly payment" value={extra} step={50} onChange={setExtra} />}
        </OptionsBar>
        <StatGrid items={[
          { label: "Monthly payment", value: money(base.monthly), strong: true },
          { label: "Total paid", value: money(base.total), strong: true },
          { label: "Total interest", value: money(base.interest) },
          { label: "Interest share", value: pct((base.interest / base.total) * 100) },
          ...(withExtra ? [
            { label: "Payoff with extra", value: `${Math.floor(withExtra.months / 12)}y ${withExtra.months % 12}m`, strong: true },
            { label: "Interest saved", value: money(Math.max(0, withExtra.saved)) },
          ] : [])]}
        />
        <Toggle label="Show yearly amortization summary" checked={showSchedule} onChange={setShowSchedule} />
        {showSchedule && (
          <div className="card overflow-auto max-h-96">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-surface">
                <tr className="text-left text-[11px] uppercase tracking-wide text-ink-dim border-b border-border">
                  <th className="px-3 py-2">Year</th><th className="px-3 py-2 text-right">Principal paid</th><th className="px-3 py-2 text-right">Interest paid</th><th className="px-3 py-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-mono">
                {Array.from({ length: Math.ceil(base.schedule.length / 12) }, (_, y) => {
                  const rows = base.schedule.slice(y * 12, y * 12 + 12);
                  const p = rows.reduce((a, r) => a + r.principal, 0);
                  const i = rows.reduce((a, r) => a + r.interest, 0);
                  return (
                    <tr key={y} className="hover:bg-surface-2">
                      <td className="px-3 py-1.5">{y + 1}</td>
                      <td className="px-3 py-1.5 text-right">{money(p)}</td>
                      <td className="px-3 py-1.5 text-right">{money(i)}</td>
                      <td className="px-3 py-1.5 text-right">{money(rows[rows.length - 1].balance)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
export const MortgageTool: ComponentType = () => <LoanWorkbench title="mortgage" />;
export const LoanTool: ComponentType = () => <LoanWorkbench title="loan" />;

// ── Compound interest / savings ──
export const CompoundInterestTool: ComponentType = () => {
  const [principal, setPrincipal] = useState(10000);
  const [monthly, setMonthly] = useState(500);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(20);
  const [freq, setFreq] = useState("12");
  const series = useMemo(() => {
    const n = Number(freq);
    const rows: { year: number; balance: number; contributed: number }[] = [];
    let balance = principal;
    let contributed = principal;
    const ratePer = rate / 100 / n;
    const monthsPer = 12 / n;
    for (let y = 1; y <= Math.min(60, years); y++) {
      for (let p = 0; p < n; p++) {
        balance = balance * (1 + ratePer) + (monthly * monthsPer) / n;
      }
      contributed += monthly * 12;
      rows.push({ year: y, balance, contributed });
    }
    return rows;
  }, [principal, monthly, rate, years, freq]);
  const last = series[series.length - 1];
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          {moneyField("Starting amount", principal, setPrincipal)}
          {moneyField("Monthly contribution", monthly, setMonthly, 50)}
          <NumField label="Annual return %" value={rate} step={0.5} onChange={setRate} />
          <NumField label="Years" value={years} min={1} max={60} onChange={setYears} />
          <SelField label="Compounding" value={freq} onChange={setFreq} options={[
            { value: "1", label: "Yearly" }, { value: "4", label: "Quarterly" }, { value: "12", label: "Monthly" }, { value: "365", label: "Daily" },
          ]} />
        </OptionsBar>
        {last && (
          <StatGrid items={[
            { label: "Final balance", value: money(last.balance), strong: true },
            { label: "Total contributed", value: money(last.contributed), strong: true },
            { label: "Interest earned", value: money(last.balance - last.contributed) },
            { label: "Growth multiple", value: `${(last.balance / Math.max(1, last.contributed)).toFixed(2)}×` },
          ]} />
        )}
        {series.length > 1 && (
          <div className="card p-4">
            <div className="label">Balance over time</div>
            <div className="flex items-end gap-1 h-40">
              {series.map((r) => {
                const max = series[series.length - 1].balance;
                return (
                  <div key={r.year} className="flex-1 rounded-t-sm bg-accent/70 hover:bg-accent transition-colors" style={{ height: `${(r.balance / max) * 100}%` }} title={`Year ${r.year}: ${money(r.balance)}`} />
                );
              })}
            </div>
            <div className="flex justify-between text-[11px] text-ink-dim mt-1"><span>Year 1</span><span>Year {series.length}</span></div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export const SavingsTool: ComponentType = () => {
  const [initial, setInitial] = useState(5000);
  const [monthly, setMonthly] = useState(250);
  const [rate, setRate] = useState(4);
  const [years, setYears] = useState(10);
  const final = useMemo(() => {
    const r = rate / 100 / 12;
    let balance = initial;
    for (let m = 0; m < years * 12; m++) balance = balance * (1 + r) + monthly;
    return balance;
  }, [initial, monthly, rate, years]);
  const contributed = initial + monthly * years * 12;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          {moneyField("Starting balance", initial, setInitial)}
          {moneyField("Monthly deposit", monthly, setMonthly, 50)}
          <NumField label="APY %" value={rate} step={0.25} onChange={setRate} />
          <NumField label="Years" value={years} min={1} max={50} onChange={setYears} />
        </OptionsBar>
        <StatGrid items={[
          { label: "Final balance", value: money(final), strong: true },
          { label: "You put in", value: money(contributed), strong: true },
          { label: "Interest earned", value: money(final - contributed) },
        ]} />
      </div>
    </ToolLayout>
  );
};

// ── Profit margin ──
export const ProfitMarginTool: ComponentType = () => {
  const [cost, setCost] = useState(40);
  const [price, setPrice] = useState(100);
  const profit = price - cost;
  const margin = price ? (profit / price) * 100 : 0;
  const markup = cost ? (profit / cost) * 100 : 0;
  const [targetMargin, setTargetMargin] = useState(50);
  const suggestedPrice = margin !== 100 ? cost / (1 - targetMargin / 100) : cost;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          {moneyField("Cost", cost, setCost, 5)}
          {moneyField("Selling price", price, setPrice, 5)}
          <NumField label="Target margin %" value={targetMargin} onChange={setTargetMargin} />
        </OptionsBar>
        <StatGrid items={[
          { label: "Profit per unit", value: money(profit), strong: true },
          { label: "Gross margin", value: pct(margin), strong: true },
          { label: "Markup", value: pct(markup) },
          { label: `Price for ${targetMargin}% margin`, value: money(suggestedPrice) },
        ]} />
      </div>
    </ToolLayout>
  );
};

// ── Unit price ──
export const UnitPriceTool: ComponentType = () => {
  const [p1, setP1] = useState({ price: 4.99, qty: 500, unit: "g" });
  const [p2, setP2] = useState({ price: 8.49, qty: 1000, unit: "g" });
  const up1 = p1.qty ? p1.price / p1.qty : 0;
  const up2 = p2.qty ? p2.price / p2.qty : 0;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        {[["Option A", p1, setP1] as const, ["Option B", p2, setP2] as const].map(([name, p, set]) => (
          <div key={name} className="card p-3.5">
            <div className="label mb-2">{name}</div>
            <OptionsBar>
              <NumField label={`Price ($)`} value={p.price} step={0.5} onChange={(v) => set({ ...p, price: v })} />
              <NumField label="Quantity" value={p.qty} step={50} onChange={(v) => set({ ...p, qty: v || 1 })} />
              <label className="block"><span className="label">Unit</span>
                <input className="input !w-20" value={p.unit} onChange={(e) => set({ ...p, unit: e.target.value })} /></label>
            </OptionsBar>
          </div>
        ))}
        <StatGrid items={[
          { label: "Option A per unit", value: money(up1, ""), strong: true },
          { label: "Option B per unit", value: money(up2, ""), strong: true },
          { label: "Better value", value: up1 && up2 ? (up1 < up2 ? "Option A" : up2 < up1 ? "Option B" : "Equal") : "—", strong: true },
          { label: "Savings per B-size unit", value: up1 && up2 ? money(Math.abs((up1 - up2) * p2.qty)) : "—" },
        ]} />
        <Note>Both options should use the same unit for a fair comparison (e.g. both in grams, or both per liter).</Note>
      </div>
    </ToolLayout>
  );
};

// ── Tip ──
export const TipTool: ComponentType = () => {
  const [bill, setBill] = useState(64.5);
  const [tipPct, setTipPct] = useState(18);
  const [people, setPeople] = useState(2);
  const tip = bill * (tipPct / 100);
  const total = bill + tip;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          {moneyField("Bill amount", bill, setBill, 5)}
          <label className="block"><span className="label">Tip — {tipPct}%</span>
            <input type="range" min={0} max={40} value={tipPct} onChange={(e) => setTipPct(Number(e.target.value))} className="w-40 accent-[var(--color-accent)]" /></label>
          <NumField label="Split between" value={people} min={1} max={30} onChange={(v) => setPeople(Math.max(1, v || 1))} />
        </OptionsBar>
        <StatGrid items={[
          { label: "Tip", value: money(tip), strong: true },
          { label: "Total", value: money(total), strong: true },
          { label: "Per person", value: money(total / people), strong: true },
          { label: "Tip per person", value: money(tip / people) },
        ]} />
      </div>
    </ToolLayout>
  );
};

// ── Tax ──
export const TaxTool: ComponentType = () => {
  const [amount, setAmount] = useState(100);
  const [rate, setRate] = useState(8.875);
  const [mode, setMode] = useState<"add" | "remove">("add");
  const res = mode === "add" ? amount * (1 + rate / 100) : amount / (1 + rate / 100);
  const taxPart = mode === "add" ? res - amount : amount - res;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          {moneyField(mode === "add" ? "Pre-tax amount" : "Amount incl. tax", amount, setAmount, 10)}
          <NumField label="Tax rate %" value={rate} step={0.125} onChange={setRate} />
          <SelField label="Direction" value={mode} onChange={setMode} options={[{ value: "add", label: "Add tax" }, { value: "remove", label: "Remove tax" }]} />
        </OptionsBar>
        <StatGrid items={[
          { label: mode === "add" ? "Total with tax" : "Net before tax", value: money(res), strong: true },
          { label: "Tax portion", value: money(taxPart), strong: true },
        ]} />
      </div>
    </ToolLayout>
  );
};

// ── VAT ──
export const VatTool: ComponentType = () => {
  const [amount, setAmount] = useState(120);
  const [rate, setRate] = useState(20);
  const net = amount / (1 + rate / 100);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="Gross amount" value={amount} step={10} onChange={setAmount} />
          <NumField label="VAT rate %" value={rate} onChange={setRate} />
        </OptionsBar>
        <StatGrid items={[
          { label: "Net (excl. VAT)", value: money(net), strong: true },
          { label: "VAT", value: money(amount - net), strong: true },
          { label: "Gross (incl. VAT)", value: money(amount) },
        ]} />
        <Note>European-style reverse charge: enter the gross price to split out VAT, or set rate 0 for a net-only calculation.</Note>
      </div>
    </ToolLayout>
  );
};

// ── Discount ──
export const DiscountTool: ComponentType = () => {
  const [price, setPrice] = useState(79.99);
  const [discount, setDiscount] = useState(30);
  const saved = price * (discount / 100);
  const final = price - saved;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          {moneyField("Original price", price, setPrice, 10)}
          <label className="block"><span className="label">Discount — {discount}%</span>
            <input type="range" min={0} max={90} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-40 accent-[var(--color-accent)]" /></label>
        </OptionsBar>
        <StatGrid items={[
          { label: "You pay", value: money(final), strong: true },
          { label: "You save", value: money(saved), strong: true },
        ]} />
      </div>
    </ToolLayout>
  );
};

// ── ROI ──
export const RoiTool: ComponentType = () => {
  const [invested, setInvested] = useState(10000);
  const [returned, setReturned] = useState(14500);
  const [years, setYears] = useState(3);
  const profit = returned - invested;
  const roi = invested ? (profit / invested) * 100 : 0;
  const annualized = years > 0 && invested > 0 ? (Math.pow(returned / invested, 1 / years) - 1) * 100 : 0;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          {moneyField("Amount invested", invested, setInvested)}
          {moneyField("Final value", returned, setReturned)}
          <NumField label="Holding period (years)" value={years} min={0} step={0.5} onChange={setYears} />
        </OptionsBar>
        <StatGrid items={[
          { label: "Net profit", value: money(profit), strong: true },
          { label: "ROI", value: pct(roi), strong: true },
          { label: "Annualized return (CAGR)", value: pct(annualized) },
        ]} />
      </div>
    </ToolLayout>
  );
};

// ── Inflation ──
export const InflationTool: ComponentType = () => {
  const [amount, setAmount] = useState(1000);
  const [rate, setRate] = useState(3);
  const [years, setYears] = useState(10);
  const futureCost = amount * Math.pow(1 + rate / 100, years);
  const todayWorth = amount / Math.pow(1 + rate / 100, years);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          {moneyField("Amount today", amount, setAmount)}
          <NumField label="Inflation % / year" value={rate} step={0.25} onChange={setRate} />
          <NumField label="Years" value={years} min={1} max={60} onChange={setYears} />
        </OptionsBar>
        <StatGrid items={[
          { label: `Cost in ${years} years`, value: money(futureCost), strong: true },
          { label: `${money(amount)} then buys`, value: money(todayWorth) + " of today's goods", strong: true },
          { label: "Purchasing power lost", value: pct((1 - todayWorth / amount) * 100) },
        ]} />
        <Note>Uses a constant average rate. Real inflation varies year to year; treat this as a rough planning figure, not a forecast.</Note>
      </div>
    </ToolLayout>
  );
};

// ── BMI ──
export const BmiTool: ComponentType = () => {
  const [metric, setMetric] = useState(true);
  const [cm, setCm] = useState(175);
  const [kg, setKg] = useState(72);
  const [ft, setFt] = useState(5);
  const [inch, setInch] = useState(9);
  const [lb, setLb] = useState(160);
  const bmi = metric ? kg / Math.pow(cm / 100, 2) : (lb / (ft * 12 + inch) ** 2) * 703;
  const cat = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy weight" : bmi < 30 ? "Overweight" : "Obese";
  const healthyLo = metric ? 18.5 * (cm / 100) ** 2 : (18.5 * (ft * 12 + inch) ** 2) / 703;
  const healthyHi = metric ? 25 * (cm / 100) ** 2 : (25 * (ft * 12 + inch) ** 2) / 703;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <SelField label="Units" value={metric ? "m" : "i"} onChange={(v) => setMetric(v === "m")} options={[{ value: "m", label: "Metric" }, { value: "i", label: "Imperial" }]} />
          {metric ? (
            <>
              <NumField label="Height (cm)" value={cm} min={80} max={250} onChange={setCm} />
              <NumField label="Weight (kg)" value={kg} min={25} max={350} onChange={setKg} />
            </>
          ) : (
            <>
              <NumField label="Height (ft)" value={ft} min={3} max={8} onChange={setFt} />
              <NumField label="Height (in)" value={inch} min={0} max={11} onChange={setInch} />
              <NumField label="Weight (lb)" value={lb} min={50} max={800} onChange={setLb} />
            </>
          )}
        </OptionsBar>
        <StatGrid items={[
          { label: "BMI", value: bmi.toFixed(1), strong: true },
          { label: "Category", value: cat, strong: true },
          { label: "Healthy range", value: `${healthyLo.toFixed(0)}–${healthyHi.toFixed(0)} ${metric ? "kg" : "lb"}` },
        ]} />
        <Note kind="warn">BMI is a rough population screening tool. It ignores muscle mass, age, and body composition — athletes often score "overweight" while being perfectly healthy. Not medical advice.</Note>
      </div>
    </ToolLayout>
  );
};

// ── Calorie / TDEE ──
export const CalorieTool: ComponentType = () => {
  const [sex, setSex] = useState("m");
  const [age, setAge] = useState(30);
  const [cm, setCm] = useState(175);
  const [kg, setKg] = useState(72);
  const [activity, setActivity] = useState("1.375");
  const bmr = sex === "m"
    ? 10 * kg + 6.25 * cm - 5 * age + 5
    : 10 * kg + 6.25 * cm - 5 * age - 161;
  const tdee = bmr * Number(activity);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <SelField label="Sex (for formula)" value={sex} onChange={setSex} options={[{ value: "m", label: "Male" }, { value: "f", label: "Female" }]} />
          <NumField label="Age" value={age} min={10} max={100} onChange={setAge} />
          <NumField label="Height (cm)" value={cm} min={100} max={230} onChange={setCm} />
          <NumField label="Weight (kg)" value={kg} min={30} max={300} onChange={setKg} />
          <SelField label="Activity" value={activity} onChange={setActivity} options={[
            { value: "1.2", label: "Sedentary" }, { value: "1.375", label: "Light (1–3 days/wk)" },
            { value: "1.55", label: "Moderate (3–5 days/wk)" }, { value: "1.725", label: "Active (6–7 days/wk)" },
            { value: "1.9", label: "Very active (physical job)" },
          ]} />
        </OptionsBar>
        <StatGrid items={[
          { label: "BMR (Mifflin-St Jeor)", value: `${Math.round(bmr)} kcal/day`, strong: true },
          { label: "Maintenance (TDEE)", value: `${Math.round(tdee)} kcal/day`, strong: true },
          { label: "Mild loss (−250)", value: `${Math.round(tdee - 250)} kcal/day` },
          { label: "Loss (−500)", value: `${Math.round(tdee - 500)} kcal/day` },
          { label: "Gain (+500)", value: `${Math.round(tdee + 500)} kcal/day` },
        ]} />
        <Note kind="warn">Population-level estimates (Mifflin-St Jeor). Individual needs vary widely — use as a starting point, not a prescription. Not medical advice.</Note>
      </div>
    </ToolLayout>
  );
};

export const tools: Record<string, ComponentType> = {
  "mortgage-calc": MortgageTool,
  "savings-calc": SavingsTool,
  "profit-margin": ProfitMarginTool,
  "unit-price-calc": UnitPriceTool,
  "loan-calc": LoanTool,
  "compound-interest": CompoundInterestTool,
  "tip-calc": TipTool,
  "tax-calc": TaxTool,
  "discount-calc": DiscountTool,
  "roi-calc": RoiTool,
  "bmi-calc": BmiTool,
  "calorie-calc": CalorieTool,
  "inflation-calc": InflationTool,
  "vat-calc": VatTool,
};
