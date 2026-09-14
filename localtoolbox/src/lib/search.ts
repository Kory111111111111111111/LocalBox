import type { ToolDef } from "./registry";

/** Lightweight fuzzy-ish scoring search across name, tags, description, category. */
export function searchTools(query: string, tools: ToolDef[], limit = 24): ToolDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  const results: { t: ToolDef; score: number }[] = [];
  for (const t of tools) {
    const name = t.name.toLowerCase();
    const desc = t.description.toLowerCase();
    const cat = t.category.replace(/-/g, " ");
    let score = 0;
    let matchedAll = true;

    for (const term of terms) {
      let s = 0;
      if (name === term) s = 120;
      else if (name.startsWith(term)) s = 100;
      else if (name.includes(term)) s = 70;
      else if (t.tags.some((g) => g.startsWith(term))) s = 60;
      else if (t.tags.some((g) => g.includes(term))) s = 40;
      else if (desc.includes(term)) s = 25;
      else if (cat.includes(term)) s = 20;
      if (s === 0) {
        matchedAll = false;
        break;
      }
      score += s;
    }
    if (matchedAll) {
      if (t.featured) score += 8;
      results.push({ t, score });
    }
  }
  results.sort((a, b) => b.score - a.score || a.t.name.localeCompare(b.t.name));
  return results.slice(0, limit).map((r) => r.t);
}
