# Footrue research → LocalToolBox deliverables

**Date:** 2026-09-14  
**Goal:** Clean-room research of a public privacy-first browser-tools product category, plus a Cursor-ready meta-prompt to build an open-source alternative named **LocalToolBox**.

## What was researched

Public site inventory (footrue.com) via sitemap, `/llms.txt`, homepage/category/sample tool pages, and keyword signals in public JS assets — **no** proprietary source reuse. Findings:

- **16 categories / 316 tools**
- Client-side positioning: no signup, files stay on device, optional local AI models
- Stack signals: Vite + React, wouter, Tailwind, lucide, ffmpeg.wasm 0.12.x, heic2any, pdf.js, Transformers.js (Whisper tiny ~75MB, RMBG-class bg remove ~44MB)
- Hosting/analytics: Cloudflare; GA present; AdSense verification id present (reference site claims no ad units)
- Network exceptions documented (DoH, ipapi, WHOIS/SSL, etc.)

## Primary deliverables

| File | Purpose |
|------|---------|
| [`CURSOR_CLONE_META_PROMPT.md`](./CURSOR_CLONE_META_PROMPT.md) | **Paste into Cursor Cloud Agent / Composer** — complete build prompt for LocalToolBox (design tokens, stack, architecture, 316-tool checklist, waves, legal) |
| [`CLONE_META_PROMPT.md`](./CLONE_META_PROMPT.md) | Earlier skeleton (superseded by CURSOR_*) |
| [`tools.json`](./tools.json) | Structured catalog — **feature checklist source of truth** (316 tools) |
| [`final-report.md`](./final-report.md) | Full research report (inventory, UX, tech fingerprints, privacy pages) |
| [`catalog.md`](./catalog.md) | Human-readable catalog + lib map |
| [`raw-notes.md`](./raw-notes.md) | Crawl method, endpoints, legal notes |

## How to use

1. Attach `tools.json` (and optionally this folder) in Cursor.
2. Paste the full contents of `CURSOR_CLONE_META_PROMPT.md` as the agent prompt.
3. Instruct the agent to execute **Wave 1** first, then proceed through waves 2–7.
4. Do **not** copy Footrue branding, CSS, JS, logos, or model CDN endpoints.

## Related source artifacts (research only)

- `llms.txt`, `sitemap.xml`, `registry-from-bundle.json`, `inventory.md`
- Sample HTML captures, `enrichment-fetch-log.json`
- `/workspace/footrue_tools.json` — alternate/earlier tools dump

## Clean-room reminder

Build **LocalToolBox** as a new open-source product: black/deep-navy minimal UI, no ads by default, analytics optional/off, original copy, OSS libraries, disclosed model licenses.
