// Category implementation packs. Each category module exports
// `export const tools: Record<string, ComponentType>` keyed by tool id.
// Tools missing from a pack render a friendly StubTool instead.
import type { ComponentType } from "react";
import type { RawTool } from "./tools.generated";

type PackLoader = () => Promise<{ tools: Record<string, ComponentType<any>> }>;

// Filled in as waves land; keys are category ids.
export const PACKS: Record<string, PackLoader> = {
  text: () => import("../tools/text/pack"),
  developer: () => import("../tools/developer/pack"),
  converters: () => import("../tools/converters/pack"),
  pdf: () => import("../tools/pdf/pack"),
  image: () => import("../tools/image/pack"),
  math: () => import("../tools/math/pack"),
  color: () => import("../tools/color/pack"),
  crypto: () => import("../tools/crypto/pack"),
  time: () => import("../tools/time/pack"),
  finance: () => import("../tools/finance/pack"),
  generators: () => import("../tools/generators/pack"),
  seo: () => import("../tools/seo/pack"),
  social: () => import("../tools/social/pack"),
  file: () => import("../tools/file/pack"),
  video: () => import("../tools/video/pack"),
  network: () => import("../tools/network/pack"),
};

let stubCache: { default: ComponentType<any> } | null = null;
async function loadStub(): Promise<{ default: ComponentType<any> }> {
  stubCache ??= await import("../components/StubTool");
  return stubCache;
}

export async function packFor(tool: RawTool): Promise<{ default: ComponentType<any> }> {
  const loader = PACKS[tool.category];
  if (loader) {
    const { tools } = await loader();
    const C = tools[tool.id];
    if (C) return { default: C };
  }
  return loadStub();
}
