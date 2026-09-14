// Minimal ambient types for culori v4 (the package ships no bundled .d.ts).
// Deliberately loose: the library accepts strings/colors interchangeably and
// returns undefined for unparseable input; call sites guard with parse().
declare module "culori" {
  export type Color = Record<string, any>;

  export function converter(mode: string): (color: any) => any;
  export function parse(color: string): any;
  export function formatHex(color: any): string;
  export function formatRgb(color: any): string;
  export function formatHsl(color: any): string;
  export function lighten(color: any, amount: number): any;
  export function darken(color: any, amount: number): any;
  export function mix(a: any, b: any, t?: number): any;
  export function clampChroma(color: any): any;
  export function wcagLuminance(color: any): number;
  export function wcagContrast(a: any, b: any): number;
}
