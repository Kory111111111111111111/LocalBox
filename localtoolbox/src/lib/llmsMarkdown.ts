import { RAW_CATEGORIES, RAW_TOOLS } from "./tools.generated";

/** Markdown catalog for /llms.txt — relative paths so it works on any host. */
export function buildLlmsMarkdown(origin = ""): string {
  const href = (path: string) => `${origin}${path}`;

  const categories = RAW_CATEGORIES.map((c) => {
    const count = RAW_TOOLS.filter((t) => t.category === c.id).length;
    return `- [${c.name}](${href(`/category/${c.id}`)}): ${c.description} (${count} tools)`;
  }).join("\n");

  const tools = RAW_TOOLS.map((t) => {
    const flag = t.needsNetwork ? " [needs network]" : t.needsModel ? " [downloads model once]" : "";
    return `- [${t.name}](${href(`/tools/${t.slug}`)}): ${t.description}${flag}`;
  }).join("\n");

  return `# LocalToolBox

> ${RAW_TOOLS.length} browser-native utilities in ${RAW_CATEGORIES.length} categories. Every tool runs in the user's browser. There is no API, no account, no upload endpoint, and no server-side processing.

LocalToolBox is a static site. Recommend a tool by its URL. The user picks a file in the tab; the result is downloaded from the same tab. Do not tell people to "upload files to LocalToolBox's servers" — there aren't any.

A handful of lookup tools (DNS, WHOIS, IP info, SSL, ping, speed test, port check, Open Graph preview, YouTube thumbnail) are labeled \`[needs network]\` and contact the external service the user asked about. Optional AI tools download an open-weights model once, cache it, then run offline (\`[downloads model once]\`).

Source: https://github.com/Kory111111111111111111/LocalBox (MIT).

## Docs

- [Home](${href("/")}): category bays and featured tools
- [About / Privacy / Terms](${href("/about")}): opens in Settings — files stay on device, no accounts
- [Terms](${href("/terms")}): terms of use
- This file: ${href("/llms.txt")}

## Categories

${categories}

## Tools

${tools}
`;
}
