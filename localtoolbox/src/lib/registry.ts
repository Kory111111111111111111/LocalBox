// Tool registry: merges generated data with lazy component resolution.
// Every tool gets a component loader; categories without an implementation
// pack (or slugs missing from a pack) fall back to a friendly StubTool.
import type { ComponentType } from "react";
import { RAW_TOOLS, RAW_CATEGORIES, type RawTool } from "./tools.generated";

export type ToolDef = RawTool & {
  component: () => Promise<{ default: ComponentType<any> }>;
};

export type CategoryDef = (typeof RAW_CATEGORIES)[number];

export const CATEGORIES: CategoryDef[] = RAW_CATEGORIES;
export const CATEGORY_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

import { packFor } from "./implementations";

export const TOOLS: ToolDef[] = RAW_TOOLS.map((t) => ({
  ...t,
  component: () => packFor(t),
}));

export const TOOL_BY_SLUG = new Map(TOOLS.map((t) => [t.slug, t]));
export const TOOLS_BY_CATEGORY = new Map<string, ToolDef[]>(
  CATEGORIES.map((c) => [c.id, TOOLS.filter((t) => t.category === c.id)]),
);

export function toolsIn(categoryId: string): ToolDef[] {
  return TOOLS_BY_CATEGORY.get(categoryId) ?? [];
}

/** Related = same category first, then tools sharing >=1 tag. */
export function relatedTools(def: ToolDef, limit = 6): ToolDef[] {
  const sameCat = toolsIn(def.category).filter((t) => t.slug !== def.slug);
  const scored: { t: ToolDef; score: number }[] = sameCat.map((t) => ({
    t,
    score: t.tags.filter((g) => def.tags.includes(g)).length + (t.featured ? 0.5 : 0),
  }));
  scored.sort((a, b) => b.score - a.score);
  const out = scored.slice(0, limit).map((s) => s.t);
  if (out.length < limit) {
    for (const t of TOOLS) {
      if (out.length >= limit) break;
      if (t.category === def.category || t.slug === def.slug) continue;
      if (t.tags.some((g) => def.tags.includes(g))) out.push(t);
    }
  }
  return out;
}
