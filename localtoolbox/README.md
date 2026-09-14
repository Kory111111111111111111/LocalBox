# LocalToolBox

**Local tools. Your device. No account.** An open-source, privacy-first collection of
316 browser-native utilities across 16 categories. Everything runs client-side — files
never leave the machine. No uploads, no watermarks, no ads, no tracking.

- **316 tools / 16 categories**: PDF, image, video & audio, text, developer, math,
  converters, color, crypto, network, file, generators, SEO, time, finance, social
- **Client-side first**: Canvas, Web Crypto, Web Workers, WebAssembly, on-device AI
- **Network tools are labeled**: the few that need the network (DNS, WHOIS, IP info…)
  show a visible banner; everything else works offline after first load
- **Optional local AI**: transcription (Whisper tiny) and background removal (MODNet)
  download open-weights models once, cache them, and run fully offline afterwards

## Develop

```bash
pnpm install     # also copies ffmpeg core into public/vendor/ (postinstall)
pnpm dev         # vite dev server
pnpm build       # regenerate registry + typecheck + production build
pnpm preview     # preview the production build
```

The tool catalog lives in `tools.json` (research pack, one folder up). Run `pnpm gen`
to regenerate `src/lib/tools.generated.ts`, `public/sitemap.xml`, `public/llms.txt`
and `public/robots.txt` from it. Set `LTB_SITE_URL` when generating for production:

```bash
LTB_SITE_URL=https://your-domain.example pnpm gen
```

## Architecture

- **Stack**: Vite + React + TypeScript, wouter (routing), Tailwind CSS v4 (design
  tokens as CSS variables), lucide-react icons.
- **Registry**: `src/lib/tools.generated.ts` holds tool metadata; each category has
  an implementation "pack" (`src/tools/<category>/pack.ts`) exporting
  `tools: Record<string, ComponentType>`. Tools without a pack entry render a
  friendly stub page — the catalog always stays complete.
- **Lazy loading**: tool implementations are code-split per category; heavy WASM/AI
  dependencies load only on the routes that need them.
- **Self-hosted assets**: the ffmpeg.wasm core is copied from npm into
  `public/vendor/ffmpeg/` at install time, so no third-party CDN is involved.

## Deploy

Any static host works (Cloudflare Pages, Netlify, GitHub Pages):

```bash
pnpm build   # outputs dist/
```

`public/_headers` ships baseline security headers. No server-side component is
required or expected.

### Threading tradeoff (ffmpeg)

The app bundles the **single-threaded** ffmpeg.wasm core, which needs no special
headers. If you swap in the multi-threaded core (`@ffmpeg/core-mt`) for extra speed,
your host must serve:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

on every document (add them to `public/_headers` for Cloudflare Pages).

## Legal

- Code: MIT (see `LICENSE`)
- Third-party libraries and AI model licenses: `THIRD_PARTY_NOTICES.md`
- LocalToolBox is an independent project and is not affiliated with any other
  toolbox product or brand.
