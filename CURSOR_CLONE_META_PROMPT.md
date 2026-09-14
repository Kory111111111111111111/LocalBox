# Cursor Meta-Prompt: Build LocalToolBox

> **Paste this entire document into Cursor Cloud Agent / Composer** to scaffold and implement an open-source, privacy-first browser tools suite from scratch.
>
> **Product name:** `LocalToolBox` (placeholder — rename later if desired).
> **Clean-room:** Do **not** copy Footrue branding, logos, favicons, CSS, JS bundles, unique marketing copy, OG images, or model CDN endpoints. This prompt encodes *category of product* + public feature inventory only.
> **Feature checklist source of truth:** treat the attached / accompanying `tools.json` (316 tools, 16 categories) as the authoritative feature list. Descriptions are *requirements*; rewrite all UI microcopy originally.

---

## 0. Mission (read first)

Build **LocalToolBox**: a static, open-source web app with **316 browser-native utilities** across **16 categories**. Processing is **client-side first**. No accounts. No file uploads to your servers. No watermarks. No ads by default. Optional one-time download of AI/WASM models (cached for offline reuse). Clearly label any tool that must touch the network.

You are implementing a **new product**, not a visual or source clone of any commercial site. Reference research below is for **parity goals and library choices only**.

### Success definition

- User can open the app, browse categories, search tools, and use tools without signing up.
- Airplane-mode works for all non-network tools after first load (and after models/WASM are cached).
- Every tool in the checklist below is implemented or stubbed with a working UI shell + TODO acceptance note — prefer real implementations in wave order.
- Privacy / Terms / About / Contact pages exist with accurate, original copy.
- `LICENSE`, `THIRD_PARTY_NOTICES.md`, `/llms.txt`, `/sitemap.xml`, `/robots.txt` ship with the app.

---

## 1. Non-negotiable product principles

1. **Client-side first** — all file/bytes processing happens in the browser (Canvas, Web Crypto, Web Workers, WASM, Transformers.js). No server-side file processing API.
2. **No signup / accounts / auth.**
3. **No watermarks** on any output.
4. **No file uploads to your backend** — files never leave the device (except explicit user-initiated download of the *result*).
5. **No ads by default.** Do not embed AdSense or ad networks. Analytics optional and **off by default** (document if added later behind consent).
6. **Optional local AI models** — download once with progress + size disclosure, then Cache Storage / OPFS / IndexedDB; subsequent runs work offline.
7. **Whisper (or equivalent) on-device transcription** for Transcribe / Subtitle tools.
8. **Background remover** runs a local segmentation model (permissively licensed; disclose size; do **not** hardcode Footrue or any proprietary CDN endpoints).
9. Prefer fully offline tools; **label network-dependent tools** with a visible banner (e.g. DNS, WHOIS, live FX, IP geolocation).
10. Ship `/llms.txt`, `/sitemap.xml`, `/robots.txt`.
11. **Lazy-load** heavy WASM/AI only on routes that need them.
12. Original branding, copy, icons set, and design tokens — never Footrue assets or trademarked names in the UI.

---

## 2. Design system — simple black / deep navy dark UI

Target a **minimal, calm, professional dark UI**. No flashy multi-stop marketing gradients that mimic any reference site. Subtle borders and soft elevation only.

### Design tokens (CSS variables)

```css
:root {
  /* Core backgrounds — deep navy / near-black */
  --bg: #0a0e17;           /* page background */
  --bg-elevated: #0f1524;  /* slightly lifted areas */
  --surface: #141b2d;      /* cards, panels */
  --surface-2: #1a2336;    /* hover / secondary panels */
  --surface-3: #222c42;    /* inputs / dropzones */

  /* Borders */
  --border: #2a3548;
  --border-subtle: #1e2738;
  --border-focus: #3b82f6;

  /* Text */
  --text: #e8edf7;         /* primary */
  --text-muted: #9aa8c0;   /* secondary */
  --text-dim: #6b7a94;     /* tertiary / hints */

  /* Accent — restrained blue (not neon) */
  --accent: #3b82f6;
  --accent-hover: #60a5fa;
  --accent-muted: rgba(59, 130, 246, 0.15);

  /* Semantic */
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
  --info: #38bdf8;

  /* Network banner */
  --banner-net-bg: rgba(245, 158, 11, 0.12);
  --banner-net-border: rgba(245, 158, 11, 0.35);
  --banner-net-text: #fbbf24;

  /* Radius / shadow */
  --radius: 10px;
  --radius-sm: 6px;
  --shadow: 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.35);

  /* Fonts — system stack first; optional Inter + JetBrains Mono self-hosted or privacy-friendly CDN */
  --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
```

### UI rules

- Dark-first (optional light theme later; not required for MVP).
- Left category nav on desktop; hamburger + drawer on mobile.
- Top search: “Search tools…” with keyboard shortcut hint (`/` or `⌘K`).
- Cards: `--surface` + `--border`, no loud gradients.
- Dropzones: dashed `--border`, `--surface-3` fill, clear “Drop files or click”.
- Primary buttons: `--accent` fill, white/near-white text.
- Secondary: ghost / outline on `--border`.
- Tool pages: breadcrumb → title → one-line purpose → workspace → How to use → FAQ → Related tools → privacy callout.
- Prefer Lucide icons; do not reuse proprietary icon packs or brand marks.

---

## 3. Recommended stack (grounded in public research signals)

| Layer | Choice | Notes |
|------|--------|-------|
| Framework | **React 18+** | createRoot SPA |
| Bundler | **Vite** | hashed ESM chunks, easy lazy routes |
| Routing | **wouter** (preferred) or react-router | lightweight |
| Styling | **Tailwind CSS** + CSS variables above | map tokens into `tailwind.config` |
| Icons | **lucide-react** | |
| State | Tool-local `useState` / small context for theme + search | avoid heavy global stores |
| PWA | **Optional** (`vite-plugin-pwa`) | after model/WASM cache story works |
| Hosting | Static (Cloudflare Pages / Netlify / GitHub Pages) | no app server required |
| Package manager | pnpm or npm | |

### Project layout (suggested)

```
localtoolbox/
  package.json
  vite.config.ts
  tailwind.config.js
  index.html
  public/
    robots.txt
    sitemap.xml
    llms.txt
    favicon.svg          # ORIGINAL mark — not copied
  src/
    main.tsx
    App.tsx
    styles/globals.css
    lib/
      registry.ts        # ToolDef[] plugin registry
      categories.ts
      search.ts
      download.ts        # blob download helpers
      zip.ts
      networkBanner.ts
    components/
      AppShell.tsx
      Sidebar.tsx
      SearchBox.tsx
      ToolCard.tsx
      ToolLayout.tsx     # shared dropzone OR editor + how-to + FAQ + related
      Dropzone.tsx
      EditorPane.tsx
      FaqAccordion.tsx
      NetworkBanner.tsx
      PrivacyCallout.tsx
      ThemeToggle.tsx
    pages/
      Home.tsx
      Category.tsx
      ToolPage.tsx
      About.tsx
      Privacy.tsx
      Terms.tsx
      Contact.tsx
    tools/
      pdf/
      image/
      video/
      text/
      developer/
      ...                # one folder or lazy module per category
    workers/             # optional
  THIRD_PARTY_NOTICES.md
  LICENSE                # MIT recommended
  README.md
```

---

## 4. Information architecture & routes

| Route | Purpose |
|-------|---------|
| `/` | Home: hero, search, popular/featured, category grid, full catalog filter |
| `/category/:id` | Category listing with count + tool cards |
| `/tools/:slug` | Tool workspace (lazy-loaded tool component) |
| `/about` | Mission, privacy stance, open-source note |
| `/privacy` | Accurate privacy policy (local processing, optional analytics, model caches, network tools) |
| `/terms` | Terms of use; calculators informational; no warranty; lawful use; **test data warnings** for generators |
| `/contact` | Contact / feedback (email or form — no backend required for mailto) |
| `/llms.txt` | Machine-readable tool catalog |
| `/sitemap.xml` | All tool + category + info URLs |
| `/robots.txt` | Allow indexing |

### Shared `ToolLayout` contract

Every tool page wraps content in `ToolLayout` with:

1. Breadcrumb: Home / Category / Tool
2. `h1` name + one-line description (**original copy**)
3. Optional **Network dependency banner** if `needsNetwork`
4. Optional **Model download panel** if `needsModel` (size, progress, “Download once”)
5. **Workspace**: either file `Dropzone` (+ options + Run/Download) **OR** text/code `EditorPane` (input/output, Copy/Clear/Sample)
6. **How to use** — 3–5 numbered steps, original wording
7. **FAQ** — 3–6 Q&As, original wording (cover offline, privacy, limits)
8. **Related tools** — same category + tag overlap
9. **Privacy callout** — “Files stay on your device…” (original)

Rewrite all microcopy. Do not paste marketing slogans from the reference site.

---

## 5. Tool plugin registry

```ts
import type { ComponentType } from "react";

export type ToolDef = {
  id: string;           // stable id, usually equals slug
  slug: string;         // URL segment under /tools/
  name: string;
  description: string;  // short; rewrite for UI
  category: string;     // one of the 16 ids
  tags: string[];
  icon?: string;        // lucide icon name
  featured?: boolean;
  needsNetwork?: boolean;
  needsWasm?: boolean;
  needsModel?: boolean;
  modelNote?: string;   // e.g. "~75MB Whisper tiny, cached after first download"
  component: () => Promise<{ default: ComponentType<any> }>;
};
```

Register all 316 tools in `src/lib/registry.ts` (can be generated from `tools.json`). Lazy `import()` per tool module so initial bundle stays small.

```ts
{
  id: "pdf-merge",
  slug: "pdf-merge",
  name: "Merge PDF",
  description: "Combine several PDFs into a single file on your device.",
  category: "pdf",
  tags: ["pdf", "merge"],
  featured: true,
  needsWasm: false,
  component: () => import("../tools/pdf/MergePdf"),
}
```

---

## 6. Categories (16) — implement all

| ID | Name | Count | Blurb (rewrite freely) |
|----|------|------:|------------------------|
| `pdf` | PDF Tools | 12 | Create, convert, and manipulate PDFs |
| `image` | Image Tools | 30 | Edit, convert, and optimize images |
| `video` | Video & Audio | 30 | Convert, trim, extract audio — in the browser |
| `text` | Text Tools | 42 | Analyze, transform, and format text |
| `developer` | Developer Tools | 59 | Formatters, encoders, and builder utilities |
| `math` | Math & Numbers | 20 | Calculations, conversions, number tools |
| `converters` | Converters | 17 | Units, formats, and type conversions |
| `color` | Color Tools | 14 | Pick, convert, and explore color |
| `crypto` | Crypto & Security | 12 | Hash, encrypt, and decode |
| `network` | Network Tools | 14 | IP, DNS, URL, and network helpers |
| `file` | File Tools | 9 | Archives, tables, file utilities |
| `generators` | Generators | 15 | UUIDs, passwords, QR, fake data |
| `seo` | SEO & Web | 8 | Meta tags, sitemaps, SEO helpers |
| `time` | Time & Date | 14 | Dates, timezones, durations |
| `finance` | Finance | 14 | Loans, interest, everyday money math |
| `social` | Social & Media | 6 | Social previews and helpers |

**Total: 316 tools.**

---

## 7. Complete tool checklist (EVERY tool — mark done as you ship)

Use this as the Cursor todo list. Format: `- [ ] slug — Name — purpose`.
Also keep `tools.json` attached/imported as the machine-readable checklist.

**Verification:** this section contains **exactly 316** tool checkboxes (one per tool), grouped by the 16 categories below. Wave acceptance checkboxes elsewhere in this doc are separate and do not count toward 316.

### PDF Tools (`pdf`) — 12 tools

_Create, convert, and manipulate PDF files_

- [ ] `pdf-merge` — **Merge PDF** — Combine multiple PDF files into one.
- [ ] `redact-pdf` — **Redact PDF** — Permanently black out sensitive text in a PDF — private, in your browser.
- [ ] `pdf-split` — **Split PDF** — Split a PDF into separate pages or ranges.
- [ ] `pdf-compress` — **Compress PDF** — Reduce PDF file size without losing quality.
- [ ] `pdf-to-text` — **PDF to Text** — Extract text content from PDF files.
- [ ] `pdf-rotate` — **Rotate PDF** — Rotate pages in a PDF file.
- [ ] `pdf-watermark` — **Add Watermark** — Add text or image watermark to PDF.
- [ ] `pdf-page-numbers` — **Add Page Numbers** — Add page numbers to PDF documents.
- [ ] `pdf-metadata` — **PDF Metadata** — View and edit PDF metadata properties.
- [ ] `pdf-unlock` — **Unlock PDF** — Remove password from PDF files.
- [ ] `pdf-grayscale` — **PDF to Grayscale** — Convert color PDF to grayscale.
- [ ] `pdf-crop` — **Crop PDF** — Crop and resize PDF pages.

### Image Tools (`image`) — 30 tools

_Edit, convert, and optimize images_

- [ ] `image-compress` — **Compress Image** — Reduce image file size while maintaining quality.
- [ ] `image-convert` — **Convert Image** — Convert between JPG, PNG, WebP, GIF, BMP formats.
- [ ] `background-remover` — **Background Remover** — Remove the background from any image automatically — free, private, in your browser.
- [ ] `heic-to-jpg` — **HEIC to JPG** — Convert HEIC (iPhone) photos to JPG — free, in your browser.
- [ ] `image-favicon` — **Favicon Generator** — Generate favicon from any image.
- [ ] `heic-to-png` — **HEIC to PNG** — Convert HEIC (iPhone) photos to PNG — free, in your browser.
- [ ] `webp-to-png` — **WebP to PNG** — Convert WebP images to PNG — free, private, in your browser.
- [ ] `png-to-webp` — **PNG to WebP** — Convert PNG images to smaller WebP files — free, in your browser.
- [ ] `webp-to-jpg` — **WebP to JPG** — Convert WebP images to JPG — free, private, in your browser.
- [ ] `jpg-to-webp` — **JPG to WebP** — Convert JPG photos to smaller WebP files — free, in your browser.
- [ ] `avif-to-jpg` — **AVIF to JPG** — Convert AVIF images to JPG — free, private, in your browser.
- [ ] `avif-to-png` — **AVIF to PNG** — Convert AVIF images to PNG — free, private, in your browser.
- [ ] `image-filters` — **CSS Image Filters** — Apply CSS filters to images — brightness, contrast, saturation, blur with presets.
- [ ] `image-resize` — **Resize Image** — Resize images to specific dimensions.
- [ ] `image-crop` — **Crop Image** — Crop images to specific dimensions or ratios.
- [ ] `image-rotate` — **Rotate & Flip** — Rotate an image by 90, 180 or 270 degrees, or mirror it, free and in your browser.
- [ ] `image-grayscale` — **Image to Grayscale** — Convert color images to black and white.
- [ ] `image-brightness` — **Adjust Brightness** — Adjust brightness, contrast, and saturation.
- [ ] `image-blur` — **Blur Image** — Apply blur effects to images.
- [ ] `image-watermark` — **Image Watermark** — Add text or logo watermark to images.
- [ ] `image-to-base64` — **Image to Base64** — Convert images to Base64 encoded string.
- [ ] `base64-to-image` — **Base64 to Image** — Convert Base64 string back to image.
- [ ] `image-metadata` — **Image Metadata** — View EXIF and metadata from images.
- [ ] `image-color-picker` — **Color Picker from Image** — Pick colors from any image.
- [ ] `image-collage` — **Image Collage** — Create a collage from multiple images.
- [ ] `svg-to-png` — **SVG to PNG** — Convert SVG files to PNG images.
- [ ] `png-to-svg` — **PNG to SVG** — Convert PNG to SVG (vectorize).
- [ ] `image-placeholder` — **Placeholder Image** — Generate placeholder images with custom sizes.
- [ ] `image-border` — **Add Border** — Add decorative borders to images.
- [ ] `image-ascii` — **Image to ASCII** — Convert images to ASCII art.

### Video & Audio (`video`) — 30 tools

_Convert, trim, and extract audio from video — right in your browser_

- [ ] `extract-audio` — **Extract Audio from Video** — Pull the audio track from any video and save it as MP3, WAV, or M4A — in your browser.
- [ ] `transcribe` — **Transcribe Audio & Video** — Turn speech in any audio or video into text with Whisper — in your browser.
- [ ] `compress-video` — **Compress Video** — Shrink video file size while keeping good quality, right in your browser.
- [ ] `trim-video` — **Trim Video** — Cut a clip from a video by start and end time — fast and lossless.
- [ ] `video-to-gif` — **Video to GIF** — Turn a video clip into a high-quality animated GIF.
- [ ] `mute-video` — **Mute Video** — Remove the audio track from a video, lossless and instant.
- [ ] `video-converter` — **Video Converter** — Convert between MP4, WebM, MOV, MKV and AVI — free, private, in your browser.
- [ ] `audio-converter` — **Audio Converter** — Convert between MP3, WAV, M4A, OGG and FLAC — free, private, in your browser.
- [ ] `screen-recorder` — **Screen Recorder** — Record your screen, a window or a tab with audio — nothing is uploaded.
- [ ] `subtitle-generator` — **Subtitle Generator** — Generate timed SRT or VTT subtitles from any video — in your browser.
- [ ] `resize-video` — **Resize Video** — Scale a video down to 1080p, 720p, 480p and more without stretching it.
- [ ] `crop-video` — **Crop Video** — Crop a video to square, 9:16 vertical or 16:9 for any platform.
- [ ] `merge-video` — **Merge Video** — Join several videos into one, any size or format, with no upload limit.
- [ ] `speed-video` — **Speed Up or Slow Down Video** — Change playback speed from 0.25x to 4x without the audio going squeaky.
- [ ] `reverse-video` — **Reverse Video** — Play a video backwards, sound included, right in your browser.
- [ ] `loop-video` — **Loop Video** — Repeat a video several times into one longer file, lossless and instant.
- [ ] `split-video` — **Split Video** — Cut a video into equal parts with accurate cuts, and get them as a zip.
- [ ] `add-music-to-video` — **Add Music to Video** — Put a soundtrack on a video, keeping or replacing the original sound.
- [ ] `cut-audio` — **Cut Audio** — Trim an MP3 or any audio file between two exact times.
- [ ] `merge-audio` — **Merge Audio** — Join several audio files into one, even with different formats.
- [ ] `adjust-video` — **Adjust Video** — Fix brightness, contrast and colour, or make a clip black and white.
- [ ] `slideshow-maker` — **Slideshow Maker** — Turn your photos into a video with music, any sizes or formats.
- [ ] `reframe-video` — **Video for Reels, TikTok and Shorts** — Reframe any video to vertical or square with a blurred background, nothing cropped.
- [ ] `volume-booster` — **Increase Audio Volume** — Make a quiet recording louder, or level it to podcast and streaming standards.
- [ ] `extract-frames` — **Extract Frames from Video** — Save stills from a video as JPG or PNG and download them as a zip.
- [ ] `add-watermark` — **Add Watermark to Video** — Put your own logo on a video in any corner, at the size and opacity you choose.
- [ ] `remove-silence` — **Remove Silence from Audio** — Cut the long pauses out of podcasts, lectures and voice notes automatically.
- [ ] `boomerang-video` — **Boomerang Video Maker** — Make a clip play forwards then backwards on a loop, like Instagram boomerangs.
- [ ] `green-screen` — **Green Screen Background Remover** — Replace a green or blue screen with a colour or your own picture.
- [ ] `text-to-speech` — **Text to Speech** — Read any text aloud with your device's own voices — free and private.

### Text Tools (`text`) — 42 tools

_Analyze, transform, and format text_

- [ ] `palindrome-checker` — **Palindrome Checker** — Check if text is a palindrome and find the longest palindromic substring.
- [ ] `rot13` — **ROT13 / ROT47** — Encode and decode text with ROT13 or ROT47 cipher.
- [ ] `text-padding` — **Text Padding** — Pad and align text lines to a fixed width with any character.
- [ ] `unicode-inspector` — **Unicode Inspector** — Inspect every character — code points, UTF-8 bytes, and Unicode categories.
- [ ] `text-stats` — **Text Statistics** — Word count, readability score, reading time, and detailed text analysis.
- [ ] `ascii-art-text` — **ASCII Art Text** — Convert text to ASCII art block letters or decorative text boxes.
- [ ] `emoji-picker` — **Emoji Picker** — Browse, search, and copy 1800+ Unicode emojis.
- [ ] `speed-typing` — **Typing Speed Test** — Test your typing speed in WPM with accuracy tracking.
- [ ] `text-replacer` — **Text Find & Replace** — Apply multiple find & replace rules with regex support.
- [ ] `slug-generator-2` — **Slug Generator** — Convert text to URL-friendly slugs with accent handling and bulk mode.
- [ ] `braille-translator` — **Braille Translator** — Convert text to Grade 1 Braille unicode characters and back.
- [ ] `text-cleaner` — **Text Cleaner** — Strip HTML, normalize spaces, remove control chars and junk from text.
- [ ] `duplicate-lines` — **Duplicate Line Remover** — Find, remove, or extract duplicate lines from text.
- [ ] `word-frequency-map` — **Word Frequency Map** — Analyze word frequency and find the most used words in text.
- [ ] `lorem-ipsum-advanced` — **Lorem Ipsum Generator (Pro)** — Generate placeholder text in multiple styles — classic, hipster, tech.
- [ ] `string-analyzer` — **String Analyzer** — Deep text analysis with 18+ stats, readability score, and speaking time.
- [ ] `html-to-text` — **HTML to Plain Text** — Strip HTML tags and extract clean plain text with entity decoding.
- [ ] `text-statistics` — **Text Statistics Dashboard** — Comprehensive text analytics — word frequency, reading level, character distribution.
- [ ] `word-wrapper` — **Word Wrap / Line Breaker** — Wrap long text at a fixed column width — hard wrap, soft wrap, or HTML.
- [ ] `text-sorter` — **Text Sorter** — Sort lines alphabetically, by length, numerically, or shuffle randomly.
- [ ] `word-count` — **Word Counter** — Count words, characters, sentences, and paragraphs.
- [ ] `text-case` — **Case Converter** — Convert text between upper, lower, title, camel case etc.
- [ ] `text-diff` — **Text Diff** — Compare two texts and see differences.
- [ ] `text-sort` — **Sort Lines** — Sort lines of text alphabetically or numerically.
- [ ] `text-remove-duplicates` — **Remove Duplicates** — Remove duplicate lines from text.
- [ ] `text-reverse` — **Reverse Text** — Reverse characters or lines in text.
- [ ] `text-lorem` — **Lorem Ipsum** — Generate Lorem Ipsum placeholder text.
- [ ] `text-slugify` — **Text to Slug** — Convert text to URL-friendly slug.
- [ ] `text-remove-spaces` — **Remove Extra Spaces** — Clean up extra whitespace from text.
- [ ] `text-to-html` — **Text to HTML** — Convert plain text to HTML entities.
- [ ] `markdown-preview` — **Markdown Preview** — Preview Markdown rendered as HTML.
- [ ] `text-truncate` — **Truncate Text** — Truncate text to a specified length.
- [ ] `text-repeat` — **Repeat Text** — Repeat text a specified number of times.
- [ ] `text-extract-emails` — **Extract Emails** — Extract all email addresses from text.
- [ ] `text-extract-urls` — **Extract URLs** — Extract all URLs from text.
- [ ] `text-extract-numbers` — **Extract Numbers** — Extract all numbers from text.
- [ ] `roman-numerals` — **Roman Numerals** — Convert between Roman numerals and Arabic numbers.
- [ ] `morse-code` — **Morse Code** — Encode and decode Morse code.
- [ ] `binary-text` — **Binary to Text** — Convert between binary and text.
- [ ] `text-wrap` — **Word Wrap** — Wrap text at specified line length.
- [ ] `text-number-lines` — **Add Line Numbers** — Add line numbers to any text or code, with your choice of separator.
- [ ] `text-to-speech-ssml` — **SSML Generator** — Generate Speech Synthesis Markup Language.

### Developer Tools (`developer`) — 59 tools

_Code formatters, encoders, and developer utilities_

- [ ] `json-to-code` — **JSON to Code** — Generate TypeScript, Go, Python, Java, C# or Rust types from JSON.
- [ ] `html-viewer` — **HTML Viewer** — Paste HTML and preview it rendered live in your browser.
- [ ] `xml-to-json` — **XML to JSON** — Convert XML documents to JSON format.
- [ ] `json-to-xml` — **JSON to XML** — Convert JSON data to well-formed XML.
- [ ] `json-diff` — **JSON Diff Viewer** — Compare two JSON objects and highlight added, removed, changed keys.
- [ ] `http-status-codes` — **HTTP Status Codes** — Complete reference of all HTTP status codes with descriptions.
- [ ] `base32` — **Base32 Encoder/Decoder** — Encode text to Base32 or decode Base32 strings (RFC 4648).
- [ ] `gitignore-generator` — **.gitignore Generator** — Generate .gitignore files for any language or framework.
- [ ] `css-box-shadow` — **CSS Box Shadow** — Visually design CSS box shadows with live preview.
- [ ] `css-text-shadow` — **CSS Text Shadow** — Create beautiful CSS text shadows with live preview.
- [ ] `css-border-radius` — **CSS Border Radius** — Visually design border-radius values with live preview.
- [ ] `css-triangle` — **CSS Triangle** — Generate pure CSS triangles using the border trick.
- [ ] `css-animation` — **CSS Animation Generator** — Pick preset animations, customize timing, copy CSS.
- [ ] `css-flexbox` — **CSS Flexbox Generator** — Visually configure flexbox properties with live preview.
- [ ] `css-grid` — **CSS Grid Generator** — Visually configure CSS Grid layouts with live preview.
- [ ] `markdown-table-gen` — **Markdown Table Generator** — Create formatted Markdown tables visually.
- [ ] `json-path-tester` — **JSONPath Tester** — Test JSONPath expressions against JSON data.
- [ ] `regex-library` — **Regex Library** — Curated library of 25+ useful regular expressions with live tester.
- [ ] `css-variables` — **CSS Variable Generator** — Build and manage CSS custom properties with live preview and preset themes.
- [ ] `html-entities` — **HTML Entities Reference** — Browse all HTML entities and encode/decode special characters.
- [ ] `css-specificity` — **CSS Specificity Calculator** — Calculate and compare CSS selector specificity.
- [ ] `flexbox-cheatsheet` — **Flexbox Cheatsheet** — Quick reference for all CSS Flexbox properties with copy-to-clipboard.
- [ ] `base64-advanced` — **Base64 Encoder/Decoder (Advanced)** — Encode/decode text or files to Base64 with URL-safe mode and line wrapping.
- [ ] `git-commit` — **Git Commit Generator** — Create conventional commit messages (feat/fix/docs) with emoji and scope.
- [ ] `json-beautifier` — **JSON Beautifier & Minifier** — Format, validate, minify, sort keys and analyze JSON with stats.
- [ ] `markdown-table-gen2` — **Markdown Table Builder** — Visually build Markdown tables with alignment, CSV import, and live preview.
- [ ] `json-schema-validator` — **JSON Schema Validator** — Validate JSON data against a JSON Schema — types, required, enums, patterns.
- [ ] `svg-optimizer` — **SVG Optimizer** — Optimize SVG files by removing comments, metadata, empty groups.
- [ ] `css-gradient-gen` — **CSS Gradient Generator** — Build linear, radial, and conic CSS gradients visually with multi-stop and presets.
- [ ] `css-clip-path` — **CSS clip-path Generator** — Generate CSS clip-path polygon, circle, and ellipse shapes with live preview.
- [ ] `cron-parser` — **Cron Expression Parser** — Parse cron expressions into plain English and see next scheduled run times.
- [ ] `json-formatter` — **JSON Formatter** — Format, validate, and minify JSON.
- [ ] `json-to-csv` — **JSON to CSV** — Convert JSON data to CSV format.
- [ ] `csv-to-json` — **CSV to JSON** — Convert CSV data to JSON format.
- [ ] `xml-formatter` — **XML Formatter** — Format and validate XML documents.
- [ ] `html-formatter` — **HTML Formatter** — Format and beautify HTML code.
- [ ] `css-formatter` — **CSS Formatter** — Format and minify CSS stylesheets.
- [ ] `js-formatter` — **JS Formatter** — Format and beautify JavaScript code.
- [ ] `sql-formatter` — **SQL Formatter** — Format and beautify SQL queries.
- [ ] `base64-encode` — **Base64 Encode** — Encode text or files to Base64.
- [ ] `base64-decode` — **Base64 Decode** — Decode Base64 encoded strings.
- [ ] `url-encode` — **URL Encode** — Encode special characters in URLs.
- [ ] `url-decode` — **URL Decode** — Decode percent-encoded URLs.
- [ ] `html-encode` — **HTML Encode** — Encode special characters to HTML entities.
- [ ] `html-decode` — **HTML Decode** — Decode HTML entities back to text.
- [ ] `regex-tester` — **Regex Tester** — Test and debug regular expressions.
- [ ] `jwt-decoder` — **JWT Decoder** — Decode and verify JWT tokens.
- [ ] `yaml-to-json` — **YAML to JSON** — Convert YAML to JSON format.
- [ ] `json-to-yaml` — **JSON to YAML** — Convert JSON to YAML format.
- [ ] `css-unit-converter` — **CSS Units** — Convert between CSS units (px, rem, em, vw).
- [ ] `minify-html` — **Minify HTML** — Minify HTML to reduce file size.
- [ ] `minify-css` — **Minify CSS** — Strip comments and whitespace from CSS to make stylesheets load faster.
- [ ] `minify-js` — **Minify JavaScript** — Shrink JavaScript by removing comments and whitespace, right in your browser.
- [ ] `diff-checker` — **Code Diff Checker** — Compare code files side by side.
- [ ] `markdown-to-html` — **Markdown to HTML** — Convert Markdown to HTML code.
- [ ] `html-to-markdown` — **HTML to Markdown** — Convert HTML to Markdown syntax.
- [ ] `json-minify` — **JSON Minify** — Minify JSON to reduce file size.
- [ ] `graphql-formatter` — **GraphQL Formatter** — Format and indent GraphQL queries and schemas so they are readable again.
- [ ] `toml-to-json` — **TOML to JSON** — Convert TOML to JSON format.

### Math & Numbers (`math`) — 20 tools

_Calculations, conversions, and number tools_

- [ ] `factorial-calc` — **Factorial & Combinatorics** — Calculate factorials, combinations C(n,r), and permutations P(n,r).
- [ ] `triangle-calc` — **Triangle Calculator** — Solve any triangle with SSS or SAS methods.
- [ ] `circle-calc` — **Circle Calculator** — Calculate radius, diameter, circumference, and area of a circle.
- [ ] `number-to-words` — **Number to Words** — Convert any number to English words — cardinal and ordinal.
- [ ] `percentage-change` — **Percentage Change** — Calculate percentage increase/decrease and find what percent of a number.
- [ ] `percentage-calc` — **Percentage Calculator** — Calculate percentages, increases, decreases.
- [ ] `scientific-calc` — **Scientific Calculator** — Advanced scientific calculator.
- [ ] `number-base` — **Number Base Converter** — Convert between binary, octal, decimal, hex.
- [ ] `prime-checker` — **Prime Number Checker** — Check if a number is prime.
- [ ] `prime-factorization` — **Prime Factorization** — Find prime factors of any number.
- [ ] `gcd-lcm` — **GCD & LCM** — Find Greatest Common Divisor and Least Common Multiple.
- [ ] `fibonacci` — **Fibonacci Sequence** — Generate Fibonacci numbers.
- [ ] `random-number` — **Random Number Generator** — Generate random numbers in a range.
- [ ] `statistics-calc` — **Statistics Calculator** — Mean, median, mode, standard deviation.
- [ ] `matrix-calc` — **Matrix Calculator** — Perform matrix operations.
- [ ] `ratio-calc` — **Ratio Calculator** — Simplify and calculate ratios.
- [ ] `bitwise-calc` — **Bitwise Calculator** — Perform bitwise operations.
- [ ] `fraction-calc` — **Fraction Calculator** — Add, subtract, multiply fractions.
- [ ] `quadratic` — **Quadratic Solver** — Solve quadratic equations.
- [ ] `logarithm` — **Logarithm Calculator** — Calculate logarithms in any base.

### Converters (`converters`) — 17 tools

_Convert between units, formats, and types_

- [ ] `byte-converter` — **Byte / Bit Converter** — Convert between bits, bytes, KB, MB, GB, TB and more.
- [ ] `aspect-ratio-calc` — **Aspect Ratio Calculator** — Calculate aspect ratios and scale dimensions proportionally.
- [ ] `length-convert` — **Length Converter** — Convert between metric and imperial lengths.
- [ ] `weight-convert` — **Weight Converter** — Convert between kg, lbs, oz, and more.
- [ ] `temperature-convert` — **Temperature Converter** — Convert Celsius, Fahrenheit, Kelvin.
- [ ] `speed-convert` — **Speed Converter** — Convert between mph, km/h, m/s, knots.
- [ ] `area-convert` — **Area Converter** — Convert between square meters, acres, hectares.
- [ ] `volume-convert` — **Volume Converter** — Convert between liters, gallons, cups, etc.
- [ ] `data-storage-convert` — **Data Storage Converter** — Convert between bytes, KB, MB, GB, TB.
- [ ] `pressure-convert` — **Pressure Converter** — Convert between PSI, bar, pascal, atm.
- [ ] `energy-convert` — **Energy Converter** — Convert between joules, calories, BTU.
- [ ] `power-convert` — **Power Converter** — Convert between watts, horsepower, BTU/hr.
- [ ] `angle-convert` — **Angle Converter** — Convert degrees, radians, gradians.
- [ ] `fuel-convert` — **Fuel Efficiency** — Convert between mpg, L/100km, km/L.
- [ ] `currency-convert` — **Currency Converter** — Convert between world currencies (offline rates).
- [ ] `time-convert` — **Time Duration Converter** — Convert seconds, minutes, hours, days.
- [ ] `resolution-convert` — **Image Resolution Converter** — Convert DPI, PPI, and resolution.

### Color Tools (`color`) — 14 tools

_Pick, convert, and work with colors_

- [ ] `color-harmonies` — **Color Harmonies** — Generate complementary, analogous, triadic color harmonies.
- [ ] `hex-color-picker` — **Color Picker & History** — Pick colors visually, adjust RGB channels, copy in HEX/RGB/HSL with history.
- [ ] `color-converter` — **Color Converter** — Convert HEX, RGB, HSL, HSV, CMYK colors.
- [ ] `color-picker` — **Color Picker** — Interactive color picker and palette builder.
- [ ] `gradient-generator` — **Gradient Generator** — Create CSS gradients visually.
- [ ] `color-palette` — **Color Palette Generator** — Generate harmonious color palettes.
- [ ] `color-contrast` — **Contrast Checker** — Check color contrast ratio for accessibility.
- [ ] `color-shades` — **Color Shades** — Generate tints and shades of any color.
- [ ] `color-blindness` — **Color Blindness Simulator** — Simulate how colors look to color blind people.
- [ ] `hex-to-rgb` — **HEX to RGB** — Convert HEX color to RGB values.
- [ ] `rgb-to-hex` — **RGB to HEX** — Convert RGB values to HEX color.
- [ ] `color-mixer` — **Color Mixer** — Blend two colors and see every step between them, with hex and RGB values.
- [ ] `color-name` — **Color Name Finder** — Find the name of any color.
- [ ] `css-color-names` — **CSS Color Names** — Browse all CSS named colors.

### Crypto & Security (`crypto`) — 12 tools

_Hash, encrypt, and decode data_

- [ ] `otp-generator` — **OTP Generator** — Generate Time-based One-Time Passwords.
- [ ] `rsa-keygen` — **RSA Key Generator** — Generate RSA public/private key pairs.
- [ ] `hash-generator` — **Hash Generator** — Generate MD5, SHA-1, SHA-256, SHA-512 hashes.
- [ ] `bcrypt-generator` — **Bcrypt Generator** — Hash passwords with bcrypt.
- [ ] `password-generator` — **Password Generator** — Generate strong, secure passwords.
- [ ] `password-strength` — **Password Strength** — Check password strength and security.
- [ ] `hmac-generator` — **HMAC Generator** — Generate HMAC with various algorithms.
- [ ] `encryption-aes` — **AES Encrypt/Decrypt** — Encrypt and decrypt text with AES.
- [ ] `jwt-generator` — **JWT Generator** — Generate and sign JWT tokens.
- [ ] `checksum-calc` — **Checksum Calculator** — Calculate file and text checksums.
- [ ] `caesar-cipher` — **Caesar Cipher** — Encrypt/decrypt with Caesar cipher.
- [ ] `vigenere-cipher` — **Vigenere Cipher** — Encode/decode with Vigenere cipher.

### Network Tools (`network`) — 14 tools

_IP, DNS, URL, and network utilities_

- [ ] `dns-lookup` — **DNS Lookup** — Look up DNS records for any domain. **[NETWORK]**
- [ ] `whois` — **WHOIS Lookup** — Get WHOIS information for domains.
- [ ] `ping-tool` — **Ping Test** — Test connectivity to websites. **[NETWORK]**
- [ ] `ssl-checker` — **SSL Checker** — Check SSL certificate details. **[NETWORK]**
- [ ] `ip-subnet-calc` — **IP Subnet Calculator** — Calculate network, broadcast, host range from IP and CIDR.
- [ ] `url-builder` — **URL Builder & Parser** — Construct URLs from components or parse existing URLs into parts.
- [ ] `network-speed-test` — **Network Speed Test** — Estimate your download speed and latency directly in the browser. **[NETWORK]**
- [ ] `url-parser` — **URL Parser** — Parse and analyze URL components.
- [ ] `ip-address` — **IP Address Info** — Get information about any IP address. **[NETWORK]**
- [ ] `user-agent` — **User Agent Parser** — Parse and decode browser User-Agent strings.
- [ ] `http-headers` — **HTTP Headers Info** — Understand and analyze HTTP headers.
- [ ] `port-checker` — **Port Scanner** — Check if ports are open on a server. **[NETWORK]**
- [ ] `htaccess-gen` — **Htaccess Generator** — Generate Apache .htaccess rules.
- [ ] `robots-txt` — **Robots.txt Generator** — Generate robots.txt files.

### File Tools (`file`) — 9 tools

_File utilities, generators, and converters_

- [ ] `file-size-calc` — **File Size Calculator** — Calculate file sizes in different units.
- [ ] `zip-creator` — **ZIP Creator** — Create ZIP archives from files.
- [ ] `csv-formatter` — **CSV Formatter** — Format and validate CSV data.
- [ ] `file-hash` — **File Hash** — Calculate hash of any file.
- [ ] `csv-to-table` — **CSV to Table** — Convert CSV to an HTML table.
- [ ] `json-to-table` — **JSON to Table** — Visualize JSON data as a table.
- [ ] `excel-to-json` — **Excel to JSON** — Convert Excel/CSV files to JSON.
- [ ] `sql-to-csv` — **SQL to CSV** — Convert SQL INSERT statements to CSV.
- [ ] `text-file-stats` — **File Statistics** — Analyze text file statistics.

### Generators (`generators`) — 15 tools

_Generate UUIDs, passwords, data, and more_

- [ ] `ulid-gen` — **ULID Generator** — Generate Universally Unique Lexicographically Sortable IDs.
- [ ] `fake-data-gen-2` — **Fake Data Generator** — Generate realistic fake names, emails, addresses, and more for testing.
- [ ] `mac-address-gen` — **MAC Address Generator** — Generate and validate random or vendor-specific MAC addresses.
- [ ] `number-sequence` — **Number Sequence Generator** — Generate custom number sequences with step, padding, prefix, suffix and separator.
- [ ] `uuid-generator` — **UUID Generator** — Generate UUIDs v1, v4, v5.
- [ ] `qr-generator` — **QR Code Generator** — Generate QR codes for URLs, text, contact info.
- [ ] `barcode-generator` — **Barcode Generator** — Generate barcodes in EAN, Code128, QR formats.
- [ ] `random-string` — **Random String** — Generate random strings and tokens.
- [ ] `random-email` — **Random Email** — Generate random email addresses for testing.
- [ ] `name-generator` — **Name Generator** — Generate random names from different cultures.
- [ ] `credit-card-gen` — **Test Credit Card** — Generate test credit card numbers (Luhn).
- [ ] `iban-gen` — **IBAN Generator** — Generate and validate IBAN numbers.
- [ ] `color-generator` — **Random Color** — Generate random colors and palettes.
- [ ] `number-gen` — **Random Number List** — Generate a list of random numbers.
- [ ] `nato-alphabet` — **NATO Alphabet** — Convert text to NATO phonetic alphabet.

### SEO & Web (`seo`) — 8 tools

_Meta tags, sitemaps, and SEO utilities_

- [ ] `meta-tag-gen` — **Meta Tag Generator** — Generate HTML meta tags for SEO.
- [ ] `og-tag-gen` — **Open Graph Generator** — Generate Open Graph meta tags.
- [ ] `sitemap-gen` — **Sitemap Generator** — Build an XML sitemap for your site so search engines can find every page.
- [ ] `word-frequency` — **Word Frequency** — Analyze word frequency in text.
- [ ] `keyword-density` — **Keyword Density** — Check keyword density in content.
- [ ] `reading-time` — **Reading Time** — Calculate estimated reading time.
- [ ] `schema-gen` — **Schema.org Generator** — Generate structured data markup.
- [ ] `twitter-card` — **Twitter Card Generator** — Generate Twitter Card meta tags.

### Time & Date (`time`) — 14 tools

_Date, time, timezone, and duration tools_

- [ ] `day-of-year` — **Day of Year** — Find what day number of the year any date falls on.
- [ ] `moon-phase` — **Moon Phase Calculator** — Find the moon phase for any date — full moon, new moon, crescent.
- [ ] `sunrise-sunset` — **Sunrise & Sunset** — Find sunrise, sunset, and day length for any location and date. **[NETWORK]**
- [ ] `timezone-converter-2` — **Multi-Timezone Converter** — Convert a time across multiple time zones simultaneously.
- [ ] `timestamp-converter` — **Timestamp Converter** — Convert Unix timestamps to dates and back.
- [ ] `date-diff` — **Date Difference** — Calculate the difference between two dates.
- [ ] `date-add` — **Date Add/Subtract** — Add or subtract days, months, years from a date.
- [ ] `timezone-converter` — **Timezone Converter** — Convert times between world timezones.
- [ ] `age-calculator` — **Age Calculator** — Calculate exact age from birthdate.
- [ ] `countdown-timer` — **Countdown Timer** — Create countdown timers to any date.
- [ ] `time-zones` — **World Clock** — View current time in multiple timezones.
- [ ] `working-days` — **Working Days Calculator** — Calculate working days between dates.
- [ ] `week-number` — **Week Number** — Get week number from any date.
- [ ] `time-to-decimal` — **Time to Decimal** — Convert time (HH:MM) to decimal hours.

### Finance (`finance`) — 14 tools

_Currency, loan, investment calculators_

- [ ] `mortgage-calc` — **Mortgage Calculator** — Calculate monthly payments, total interest, and amortization schedule.
- [ ] `savings-calc` — **Savings Calculator** — Project savings growth with compound interest and contributions.
- [ ] `profit-margin` — **Profit Margin Calculator** — Calculate gross profit, margin %, markup %, and pricing.
- [ ] `unit-price-calc` — **Unit Price Calculator** — Compare prices per unit to find the best value.
- [ ] `loan-calc` — **Loan Calculator** — Calculate monthly payments and interest.
- [ ] `compound-interest` — **Compound Interest** — Calculate compound interest growth.
- [ ] `tip-calc` — **Tip Calculator** — Calculate restaurant tip amounts.
- [ ] `tax-calc` — **Tax Calculator** — Calculate taxes on income or purchases.
- [ ] `discount-calc` — **Discount Calculator** — Calculate sale prices and savings.
- [ ] `roi-calc` — **ROI Calculator** — Calculate Return on Investment.
- [ ] `bmi-calc` — **BMI Calculator** — Calculate Body Mass Index.
- [ ] `calorie-calc` — **Calorie Calculator** — Calculate daily calorie needs (TDEE).
- [ ] `inflation-calc` — **Inflation Calculator** — Calculate inflation-adjusted values.
- [ ] `vat-calc` — **VAT Calculator** — Add or remove VAT from prices.

### Social & Media (`social`) — 6 tools

_Social media tools and analytics helpers_

- [ ] `og-preview` — **OG Preview** — Preview how your page looks on social media. **[NETWORK]**
- [ ] `tweet-generator` — **Tweet Image Generator** — Create Twitter-style tweet images.
- [ ] `instagram-filters` — **Instagram Filters** — Apply Instagram-like filters to images.
- [ ] `youtube-thumbnail` — **YouTube Thumbnail** — Get YouTube video thumbnails. **[NETWORK]**
- [ ] `bio-generator` — **Bio Generator** — Generate social media bio text.
- [ ] `hashtag-gen` — **Hashtag Generator** — Generate relevant hashtags for posts.


**Checkbox count must remain 316.** Do not drop tools; stub with honest “coming in wave N” only if blocked, then implement.

---

## 8. Per-family implementation notes (OSS libraries)

### 8.1 PDF (`pdf-lib`, `pdfjs-dist`)

- **Manipulate / write:** `pdf-lib` — merge, split, rotate, watermark text/image, page numbers, metadata, crop boxes, grayscale draw, unlock when password known (user-supplied), redact via black rects + remove text where feasible.
- **Read / render / extract:** `pdfjs-dist` with worker from your own `public/` or pinned npm asset (not a random third-party path that you don’t control long-term). Use for text extraction, page preview, redact UI overlays.
- Accept multiple files where relevant; reorder list; download Blob PDF; multi-output → ZIP via `fflate`/`JSZip`.
- Document limits: memory, encrypted PDFs without password, scanned image-only PDFs for text extract.

### 8.2 Image (Canvas, `heic2any`, `exifr`, `browser-image-compression`)

- Core ops via **Canvas / OffscreenCanvas**: resize, crop, rotate/flip, grayscale, brightness/contrast/sat, blur, watermark, border, collage, favicon sizes, ASCII, filters, format convert (JPEG/PNG/WebP/GIF/BMP where browser supports), placeholder generator, SVG→PNG via Image draw.
- **Compress:** `browser-image-compression` (or Canvas quality knobs + workers).
- **HEIC:** `heic2any` (or `libheif-js`) — HEIC→JPG/PNG.
- **EXIF:** `exifr` for metadata viewer (strip option for privacy).
- **Background remove:** `@xenova/transformers` (Transformers.js) + a **permissively licensed** segmentation / matting model. Disclose download size in UI. Cache in Cache Storage. Prefer WebGPU with WASM fallback. **Do not** hardcode Footrue CDN URLs. Evaluate licenses before shipping (e.g. alternatives to restrictive commercial weights). Reference parity note only: some public sites use RMBG-class models ~40–50MB — pick a license you can redistribute and document in `THIRD_PARTY_NOTICES.md`.
- PNG↔SVG: rasterize SVG; “vectorize” can be naive posterize/trace stub or a small OSS tracer — label quality honestly.

### 8.3 Video / Audio (`@ffmpeg/ffmpeg` + `@ffmpeg/core`, MediaRecorder, Web Audio)

- Pin a known good **ffmpeg.wasm 0.12.x** line (`@ffmpeg/core` ~0.12.10 observed in wild). Prefer self-hosting core JS/WASM under `public/ffmpeg/` for reliability.
- Tools: convert, compress, trim, mute, resize, crop, merge, speed, reverse, loop, split, extract audio, extract frames, video↔GIF, add music, watermark, slideshow, reframe (blur fill), boomerang, green-screen key, remove silence, volume, cut/merge audio.
- **Screen recorder:** `getDisplayMedia` + `MediaRecorder` — never upload.
- **COOP/COEP:** multi-threaded ffmpeg needs `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` (or `credentialless`) on hosting. If you cannot set headers, ship **single-thread** ffmpeg core and document the tradeoff.
- Show progress; warn on large files / device memory; ZIP multi-outputs.

### 8.4 Transcribe / subtitles (Transformers.js + Whisper tiny or similar)

- `@xenova/transformers` + `Xenova/whisper-tiny` (or equivalent OSS weights) — ~**75MB** class download; cache after first run.
- Pipeline: optional ffmpeg extract audio from video → Whisper → editable transcript → `.txt` / `.srt` / `.vtt`.
- Subtitle generator reuses same model with timestamps.
- UI: progress, cancel, language hint, “Translate to English” if model supports.
- Never send audio to a cloud STT API in the default build.

### 8.5 TTS

- **Web Speech API** (`speechSynthesis`) — device voices, rate/pitch/volume. No server voices required.
- SSML generator can produce markup for export even if browser TTS ignores most SSML.

### 8.6 Dev / text (pure JS + known formatters)

- JSON/YAML/TOML/XML/CSV transforms: `js-yaml`, lightweight TOML/XML parsers, papaparse or hand-rolled CSV.
- Formatters: `prettier/standalone` + parsers where license OK, or focused libs (`sql-formatter`, etc.).
- Diff: `diff` / `diff2html` or Monaco diff (heavier — optional).
- Markdown: `marked` + `DOMPurify` for preview.
- Regex tester, JWT decode (display only unless verify with user key), Base64/URL/HTML entities, cron parser, JSON Schema validator (`ajv`), JSONPath, CSS playgrounds (live preview iframes sandboxed).
- Keep CPU work off the main thread for big inputs when easy (Worker).

### 8.7 Crypto (`Web Crypto`, `@noble/hashes`, `otpauth`, `bcryptjs`)

- Prefer **Web Crypto** for SHA-256/384/512, AES-GCM, RSA-OAEP / `crypto.subtle.generateKey`.
- MD5/SHA-1 via `@noble/hashes` (label as legacy).
- bcrypt via `bcryptjs` (note slowness intentionally).
- OTP: `otpauth` + QR display.
- Password generator: `crypto.getRandomValues`.
- **Test credit card generator:** Luhn-valid **test** numbers only; big warning: “For software testing only — not real cards; illegal to misuse.” Do not enable fraud UX.

### 8.8 File / generators / color / time / finance / SEO / social

- **Archives:** `fflate` or `JSZip`.
- **Excel→JSON:** `xlsx` (SheetJS community) — check license for your distribution model.
- **QR / Barcode:** `qrcode`, `jsbarcode`.
- **Color:** `culori` or `colorjs.io` — convert, contrast (WCAG), harmonies, blindness simulation.
- **Time:** `luxon` or `date-fns-tz` / Temporal polyfill.
- **Finance:** pure JS formulas; label “informational, not advice.”
- **Currency converter:** either **bundled static rates** (dated, offline) or live API with **NETWORK** banner + attribution.
- **SEO generators:** produce HTML/JSON-LD snippets client-side.
- **Social:** canvas tweet image mock; Instagram-like CSS/canvas filters; YouTube thumbnail via public img URLs (**network**); bio/hashtag are local text tools.
- **Fake data / IBAN / MAC / ULID / UUID:** local libs; fake data clearly labeled synthetic.

### 8.9 Network tools — document exceptions

These **cannot** be fully offline; show `NetworkBanner`:

| Tool | Suggested approach |
|------|--------------------|
| IP Address Info | ipapi.co or similar — document; only queried IP |
| DNS Lookup | DNS-over-HTTPS (Cloudflare `cloudflare-dns.com/dns-query` or Google DoH) |
| WHOIS | Link-out or public WHOIS API — disclose |
| Port checker / Ping / SSL | Limited in-browser; often need external check endpoints or honest “open external tester” — do not fake results |
| Network speed test | Controlled download of your own static asset or documented method |
| URL parser / builder, UA parser, HTTP status reference, htaccess/robots generators, subnet calc | **Fully local** — no banner |

Never upload user files for network tools.

---

## 9. Observed reference tech (parity goals ONLY — do not copy)

Public research on a similar product category observed approximately:

| Signal | Observation | LocalToolBox stance |
|--------|-------------|---------------------|
| App | Vite + React SPA | ✅ Same stack OK |
| Router | wouter | ✅ OK |
| CSS | Tailwind | ✅ OK |
| Icons | lucide | ✅ OK |
| AV | ffmpeg.wasm `@ffmpeg/core` **0.12.x** | ✅ Pin & self-host |
| HEIC | heic2any | ✅ OK |
| PDF | pdf.js worker | ✅ OK |
| BG remove | Transformers.js + RMBG-1.4 ~**44MB** | ⚠️ Use permissively licensed model; disclose size; own hosting/HF |
| Transcribe | Whisper tiny ~**75MB** | ✅ Transformers.js / Xenova |
| Host | Cloudflare | ✅ Optional |
| Analytics | Google Analytics | ❌ Off by default |
| Ads | AdSense id present | ❌ **No ads** |

Do **not** scrape or reuse their model hosting endpoints, bundles, CSS, or copy.

---

## 10. Implementation waves (1–7) + acceptance criteria

### Wave 1 — Shell & registry
- [ ] Vite + React + TS + Tailwind + wouter scaffold
- [ ] Design tokens applied; AppShell, Sidebar, Search, Home, Category, ToolPage
- [ ] `ToolDef` registry wired; lazy route `/tools/:slug`
- [ ] About / Privacy / Terms / Contact with **original** copy
- [ ] `robots.txt`, `sitemap.xml`, `llms.txt` generated from registry
- [ ] Empty tool stub component for unregistered slugs → friendly 404
- **Accept:** navigate all routes; search filters tools; dark navy UI matches tokens; no Footrue branding.

### Wave 2 — Text + Developer + Converters (pure JS)
- [ ] All **42** text tools
- [ ] All **59** developer tools
- [ ] All **17** converters (currency: static rates or labeled network)
- **Accept:** sample inputs; copy/download; airplane-mode OK; no network except optional currency.

### Wave 3 — PDF + Image canvas tools
- [ ] All **12** PDF tools (bg-remover is Wave 5)
- [ ] Image tools except background-remover (29) — include HEIC, compress, convert, etc.
- **Accept:** merge PDF round-trip; compress/resize download; HEIC converts; airplane-mode after chunk load.

### Wave 4 — ffmpeg.wasm Video/Audio suite
- [ ] All video/audio tools that need ffmpeg (exclude transcribe/subtitles/TTS → Wave 5)
- [ ] Screen recorder (MediaRecorder)
- [ ] COOP/COEP **or** single-thread fallback documented in README
- **Accept:** convert one short clip MP4↔WebM; extract audio; trim; no upload in Network panel.

### Wave 5 — Local AI
- [ ] Background remover (model download UX + cache)
- [ ] Transcribe + Subtitle generator (Whisper tiny or similar)
- [ ] Text-to-speech (Web Speech API)
- **Accept:** first run shows size/progress; second run offline; no audio/image leaves machine.

### Wave 6 — Generators, SEO, Finance, Time, Social, Math, Color, Crypto, File
- [ ] Remaining categories: math (20), color (14), crypto (12), file (9), generators (15), seo (8), time (14), finance (14), social (6)
- **Accept:** checklist boxes cleared; test-card tool has misuse warning; calculators labeled informational.

### Wave 7 — Network tools + polish
- [ ] Network tools with banners + privacy disclosures
- [ ] PWA optional; performance pass; a11y basics (focus, labels, contrast)
- [ ] `THIRD_PARTY_NOTICES.md` complete; LICENSE; README install/deploy
- **Accept:** airplane-mode suite for non-network; network tools fail gracefully offline with clear message; Lighthouse reasonable on Home.

---

## 11. Security, legal, and compliance notes

1. **Clean-room:** no copying proprietary JS/CSS/assets/copy/branding.
2. **Third-party notices:** list ffmpeg.wasm, pdf.js, pdf-lib, Transformers.js, model weights, heic2any, etc. with licenses.
3. **Model licenses:** verify redistribution/use rights before shipping weights; link HF model cards.
4. **COOP/COEP** for threaded ffmpeg — document headers for Cloudflare Pages `_headers` / Netlify `_headers`.
5. **No fake credit-card misuse:** test Luhn numbers only + explicit warning.
6. **No port-scan abuse:** rate-limit / warn; prefer educational “check single host you own.”
7. **CSP:** sensible default; allow WASM (`'wasm-unsafe-eval'` where needed); lock down `frame-src` for previews.
8. **DOMPurify** any HTML preview.
9. **Do not** claim affiliation with Footrue or any other brand.
10. Calculators and health metrics (BMI/calorie) are **informational only**.

---

## 12. Data & attachments for Cursor

1. Import / attach **`tools.json`** from the research pack as the **feature checklist** (316 tools). Map each entry → `ToolDef` + checklist item.
2. Use category ids and slugs **exactly** as in `tools.json` for URL stability (`/tools/{id}`).
3. Rewrite `name` presentation lightly if needed; keep slugs stable.
4. `recommended_libs` hints in JSON are suggestions, not mandates — prefer the family map in §8.
5. Companion research (for humans, not to copy): `final-report.md`, `catalog.md`, `raw-notes.md`.

### Generate registry snippet (do this early)

```bash
# Example: generate src/lib/tools.generated.ts from tools.json
node scripts/gen-registry.mjs
```

Every tool module exports default React component; registry points at it.

---

## 13. UX copy guidelines (original)

- Hero example: “**Local tools. Your device. No account.** Three hundred-plus utilities that run in your browser.”
- Privacy chip: “Files stay on your device.”
- Network chip: “Needs network — only the lookup you request is sent.”
- Model chip: “Downloads ~NN MB once, then works offline.”
- Avoid cloning distinctive taglines from other products.

---

## 14. Definition of done (release checklist)

- [ ] 316/316 tools reachable (implemented or explicitly stubbed with issue link — prefer implemented)
- [ ] Design tokens / navy dark UI applied consistently
- [ ] No ads; analytics off or consented
- [ ] Privacy page matches actual behavior
- [ ] Airplane-mode verified for non-network tools
- [ ] Model tools disclose size + cache
- [ ] Network tools bannered
- [ ] LICENSE + THIRD_PARTY_NOTICES.md
- [ ] sitemap + llms.txt + robots.txt
- [ ] README: dev (`pnpm i && pnpm dev`), build, deploy, COOP/COEP note
- [ ] Zero Footrue trademarks/assets in repo

---

## 15. First commands for the agent

```bash
pnpm create vite localtoolbox --template react-ts
cd localtoolbox
pnpm add wouter lucide-react clsx
pnpm add -D tailwindcss @tailwindcss/vite   # or postcss setup
# then implement AppShell + registry from tools.json
```

Start Wave 1 immediately. After shell works, generate all tool stub pages from the checklist, then fill implementations by wave.

**Remember:** You are building **LocalToolBox** — open-source, privacy-first, clean-room.

---

_End of meta-prompt. Tool checklist count: **316**. Product: **LocalToolBox**. Clean-room. No ads by default._
