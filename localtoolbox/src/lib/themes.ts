export const THEME_IDS = [
  "default-dark",
  "default-light",
  "nord-dark",
  "nord-light",
  "gruvbox-dark",
  "gruvbox-light",
  "catppuccin-latte",
  "catppuccin-frappe",
  "catppuccin-macchiato",
  "catppuccin-mocha",
  "tokyo-night",
  "tokyo-night-day",
  "dracula",
  "dracula-light",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export type ThemeAppearance = "dark" | "light";

export type ThemeDef = {
  id: ThemeId;
  family: string;
  label: string;
  appearance: ThemeAppearance;
  /** bg, surface, accent, ink — picker chips only */
  swatches: [string, string, string, string];
};

export const DEFAULT_THEME: ThemeId = "default-dark";

export const THEMES: ThemeDef[] = [
  {
    id: "default-dark",
    family: "Default",
    label: "Dark",
    appearance: "dark",
    swatches: ["#0a0e17", "#222c42", "#3b82f6", "#e8edf7"],
  },
  {
    id: "default-light",
    family: "Default",
    label: "Light",
    appearance: "light",
    swatches: ["#f3f5fa", "#ffffff", "#2563eb", "#0c1222"],
  },
  {
    id: "nord-dark",
    family: "Nord",
    label: "Dark",
    appearance: "dark",
    swatches: ["#2e3440", "#3b4252", "#88c0d0", "#eceff4"],
  },
  {
    id: "nord-light",
    family: "Nord",
    label: "Light",
    appearance: "light",
    swatches: ["#eceff4", "#e5e9f0", "#5e81ac", "#2e3440"],
  },
  {
    id: "gruvbox-dark",
    family: "Gruvbox",
    label: "Dark",
    appearance: "dark",
    swatches: ["#282828", "#3c3836", "#83a598", "#ebdbb2"],
  },
  {
    id: "gruvbox-light",
    family: "Gruvbox",
    label: "Light",
    appearance: "light",
    swatches: ["#fbf1c7", "#ebdbb2", "#076678", "#3c3836"],
  },
  {
    id: "catppuccin-latte",
    family: "Catppuccin",
    label: "Latte",
    appearance: "light",
    swatches: ["#eff1f5", "#e6e9ef", "#1e66f5", "#4c4f69"],
  },
  {
    id: "catppuccin-frappe",
    family: "Catppuccin",
    label: "Frappé",
    appearance: "dark",
    swatches: ["#303446", "#414559", "#8caaee", "#c6d0f5"],
  },
  {
    id: "catppuccin-macchiato",
    family: "Catppuccin",
    label: "Macchiato",
    appearance: "dark",
    swatches: ["#24273a", "#363a4f", "#8aadf4", "#cad3f5"],
  },
  {
    id: "catppuccin-mocha",
    family: "Catppuccin",
    label: "Mocha",
    appearance: "dark",
    swatches: ["#1e1e2e", "#313244", "#89b4fa", "#cdd6f4"],
  },
  {
    id: "tokyo-night",
    family: "Tokyo Night",
    label: "Night",
    appearance: "dark",
    swatches: ["#1a1b26", "#292e42", "#7aa2f7", "#c0caf5"],
  },
  {
    id: "tokyo-night-day",
    family: "Tokyo Night",
    label: "Day",
    appearance: "light",
    swatches: ["#e1e2e7", "#d0d5e3", "#2e7de9", "#3760bf"],
  },
  {
    id: "dracula",
    family: "Dracula",
    label: "Dark",
    appearance: "dark",
    swatches: ["#282a36", "#44475a", "#bd93f9", "#f8f8f2"],
  },
  {
    id: "dracula-light",
    family: "Dracula",
    label: "Alucard",
    appearance: "light",
    swatches: ["#fff8e8", "#fff1d6", "#644ac9", "#1f1f29"],
  },
];

export const THEME_FAMILIES = [
  "Default",
  "Nord",
  "Gruvbox",
  "Catppuccin",
  "Tokyo Night",
  "Dracula",
] as const;

const THEME_ID_SET = new Set<string>(THEME_IDS);

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return !!value && THEME_ID_SET.has(value);
}

export function themesIn(family: string): ThemeDef[] {
  return THEMES.filter((t) => t.family === family);
}
