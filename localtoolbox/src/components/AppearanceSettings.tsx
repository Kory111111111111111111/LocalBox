import { THEME_FAMILIES, themesIn, type ThemeDef } from "../lib/themes";
import { useTheme } from "../lib/ThemeProvider";

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <h3 className="text-lg font-semibold tracking-tight mb-4">Appearance</h3>

      <div className="space-y-6">
        {THEME_FAMILIES.map((family) => (
          <section key={family}>
            <h4 className="section-title">{family}</h4>
            <div className="grid grid-cols-2 gap-2">
              {themesIn(family).map((def) => (
                <ThemeCard
                  key={def.id}
                  def={def}
                  selected={theme === def.id}
                  onSelect={() => setTheme(def.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function ThemeCard({
  def,
  selected,
  onSelect,
}: {
  def: ThemeDef;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${def.family} ${def.label}`}
      className={`card p-3 text-left transition-colors ${
        selected
          ? "border-accent ring-1 ring-accent"
          : "hover:border-ink-dim"
      }`}
    >
      <span className="flex gap-1 mb-2.5" aria-hidden="true">
        {def.swatches.map((color, i) => (
          <span
            key={`${def.id}-${i}`}
            className="size-3.5 rounded-full border border-border-subtle"
            style={{ backgroundColor: color }}
          />
        ))}
      </span>
      <span className="block text-sm font-medium text-ink">{def.label}</span>
    </button>
  );
}
