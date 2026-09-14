// SEO & Web (8) + Social & Media (6) packs.
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import ToolLayout from "../../components/ToolLayout";
import EditorPane from "../../components/EditorPane";
import { CopyButton, Note, NumField, OptionsBar, OutputArea, RunButton, SelField, StatGrid, Toggle } from "../../components/ui";
import { drawToCanvas, canvasToBlob, loadImageFile, newCanvas } from "../image/imagelib";
import { downloadBlob } from "../../lib/download";
import { countWords, countSentences, readingTime, wordFrequency } from "../text/kit";

// ───────────── SEO pack ─────────────

export const MetaTagTool: ComponentType = () => {
  const [title, setTitle] = useState("My Page Title");
  const [description, setDescription] = useState("A concise summary shown in search results.");
  const [keywords, setKeywords] = useState("tools, browser, privacy");
  const [author, setAuthor] = useState("");
  const [canonical, setCanonical] = useState("https://example.com/page");
  const [robots, setRobots] = useState("index, follow");
  const html = `<!-- Primary meta tags -->
<title>${title}</title>
<meta name="title" content="${title}">
<meta name="description" content="${description}">
${keywords ? `<meta name="keywords" content="${keywords}">\n` : ""}${author ? `<meta name="author" content="${author}">\n` : ""}
<!-- Canonical & indexing -->
<link rel="canonical" href="${canonical}">
<meta name="robots" content="${robots}">

<!-- Open Graph (also see the OG Generator tool) -->
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${canonical}">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">`;
  const titleOk = title.length >= 15 && title.length <= 60;
  const descOk = description.length >= 70 && description.length <= 160;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block sm:col-span-2"><span className="label">Title ({title.length} chars — 50–60 is ideal)</span>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label className="block sm:col-span-2"><span className="label">Description ({description.length} chars — 70–160 is ideal)</span>
            <textarea className="textarea !font-sans" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
          <label className="block"><span className="label">Keywords (mostly ignored by engines, optional)</span>
            <input className="input" value={keywords} onChange={(e) => setKeywords(e.target.value)} /></label>
          <label className="block"><span className="label">Author</span>
            <input className="input" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="optional" /></label>
          <label className="block"><span className="label">Canonical URL</span>
            <input className="input" value={canonical} onChange={(e) => setCanonical(e.target.value)} /></label>
          <SelField label="Robots" value={robots} onChange={setRobots} options={["index, follow", "noindex, follow", "index, nofollow", "noindex, nofollow"].map((r) => ({ value: r, label: r }))} />
        </div>
        {(!titleOk || !descOk) && (
          <Note kind="warn">
            {!titleOk && "Title length is outside the sweet spot (15–60 chars); search results may truncate it. "}
            {!descOk && "Description length is outside 70–160 chars; aim for a full but tight summary."}
          </Note>
        )}
        <OutputArea text={html} filename="meta-tags.html" rows={12} label="Generated HTML" mime="text/html" />
      </div>
    </ToolLayout>
  );
};

export const OgTagTool: ComponentType = () => {
  const [title, setTitle] = useState("My Page");
  const [description, setDescription] = useState("What this page offers.");
  const [url, setUrl] = useState("https://example.com/page");
  const [image, setImage] = useState("https://example.com/og-image.png");
  const [siteName, setSiteName] = useState("Example Site");
  const [type, setType] = useState("website");
  const html = `<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="${siteName}">
<meta property="og:type" content="${type}">

<!-- Optional: article specifics
<meta property="article:published_time" content="2026-01-01T12:00:00Z">
<meta property="article:author" content="https://example.com/authors/me">
-->`;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block sm:col-span-2"><span className="label">Title</span><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label className="block sm:col-span-2"><span className="label">Description</span>
            <textarea className="textarea !font-sans" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
          <label className="block"><span className="label">Page URL</span><input className="input" value={url} onChange={(e) => setUrl(e.target.value)} /></label>
          <label className="block"><span className="label">Image URL (1200×630 recommended)</span><input className="input" value={image} onChange={(e) => setImage(e.target.value)} /></label>
          <label className="block"><span className="label">Site name</span><input className="input" value={siteName} onChange={(e) => setSiteName(e.target.value)} /></label>
          <SelField label="OG type" value={type} onChange={setType} options={["website", "article", "product", "video.other", "profile"].map((t) => ({ value: t, label: t }))} />
        </div>
        <OutputArea text={html} filename="og-tags.html" rows={10} label="Open Graph tags" mime="text/html" />
      </div>
    </ToolLayout>
  );
};

export const TwitterCardTool: ComponentType = () => {
  const [card, setCard] = useState("summary_large_image");
  const [site, setSite] = useState("@example");
  const [creator, setCreator] = useState("@author");
  const [title, setTitle] = useState("My Page");
  const [description, setDescription] = useState("What this page offers.");
  const [image, setImage] = useState("https://example.com/card.png");
  const html = `<meta name="twitter:card" content="${card}">
<meta name="twitter:site" content="${site}">
<meta name="twitter:creator" content="${creator}">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">`;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <SelField label="Card type" value={card} onChange={setCard} options={[
            { value: "summary", label: "summary — small square" }, { value: "summary_large_image", label: "summary_large_image — big visual" },
            { value: "player", label: "player — video/audio" },
          ]} />
          <label className="block"><span className="label">Site @handle</span><input className="input !w-32" value={site} onChange={(e) => setSite(e.target.value)} /></label>
          <label className="block"><span className="label">Creator @handle</span><input className="input !w-32" value={creator} onChange={(e) => setCreator(e.target.value)} /></label>
        </OptionsBar>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block"><span className="label">Title</span><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label className="block"><span className="label">Image URL</span><input className="input" value={image} onChange={(e) => setImage(e.target.value)} /></label>
          <label className="block sm:col-span-2"><span className="label">Description</span>
            <textarea className="textarea !font-sans" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
        </div>
        <OutputArea text={html} filename="twitter-card.html" rows={7} label="Twitter Card tags" mime="text/html" />
      </div>
    </ToolLayout>
  );
};

export const SitemapGenTool: ComponentType = () => {
  const [base, setBase] = useState("https://example.com");
  const [paths, setPaths] = useState("/\n/about\n/blog/post-one\n/blog/post-two");
  const [changefreq, setChangefreq] = useState("weekly");
  const [addPriority, setAddPriority] = useState(false);
  const [lastmod, setLastmod] = useState(new Date().toISOString().slice(0, 10));
  const urls = paths.split("\n").map((p) => p.trim()).filter(Boolean);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((p) => {
  const loc = p === "/" ? base + "/" : `${base.replace(/\/$/, "")}${p.startsWith("/") ? "" : "/"}${p}`;
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>${addPriority ? `\n    <changefreq>${changefreq}</changefreq>\n    <priority>${p === "/" ? "1.0" : "0.8"}</priority>` : ""}
  </url>`;
}).join("\n")}
</urlset>`;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block"><span className="label">Site origin</span>
            <input className="input !w-56" value={base} onChange={(e) => setBase(e.target.value)} /></label>
          <SelField label="Change frequency" value={changefreq} onChange={setChangefreq} options={["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"].map((f) => ({ value: f, label: f }))} />
          <Toggle label="Add changefreq & priority" checked={addPriority} onChange={setAddPriority} hint="Search engines mostly ignore these — loc and lastmod matter" />
        </OptionsBar>
        <EditorPane value={paths} onChange={setPaths} inputLabel="Paths (one per line)" rows={7} />
        <OutputArea text={xml} filename="sitemap.xml" rows={10} label={`sitemap.xml (${urls.length} URLs)`} mime="application/xml" />
      </div>
    </ToolLayout>
  );
};

export const WordFrequencySeoTool: ComponentType = () => {
  const [text, setText] = useState("");
  const [minLen, setMinLen] = useState(4);
  const rows = useMemo(() => {
    const total = countWords(text);
    return [...wordFrequency(text).entries()]
      .filter(([w]) => w.length >= minLen)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([w, n]) => ({ w, n, pct: total ? (n / total) * 100 : 0 }));
  }, [text, minLen]);
  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} inputLabel="Content" outputLabel="Top words" rows={8}
        options={<OptionsBar><NumField label="Min word length" value={minLen} min={1} max={16} onChange={(v) => setMinLen(Math.max(1, v || 4))} /></OptionsBar>}
        outputNode={
          <div className="flex flex-col gap-2">
            {rows.map((r) => (
              <div key={r.w} className="flex items-center gap-3 text-[13px]">
                <span className="w-32 truncate font-mono">{r.w}</span>
                <span className="text-ink-muted tabular-nums w-10 text-right">{r.n}×</span>
                <div className="flex-1 h-1.5 rounded bg-surface-3 overflow-hidden"><div className="h-full bg-accent" style={{ width: `${Math.min(100, r.pct * 12)}%` }} /></div>
                <span className="text-ink-dim tabular-nums w-12 text-right">{r.pct.toFixed(1)}%</span>
              </div>
            ))}
            {rows.length === 0 && <span className="text-sm text-ink-dim">Paste page content to see which words dominate.</span>}
          </div>
        } />
    </ToolLayout>
  );
};

export const KeywordDensityTool: ComponentType = () => {
  const [text, setText] = useState("");
  const [keyword, setKeyword] = useState("");
  const stats = useMemo(() => {
    const total = countWords(text);
    const kw = keyword.trim().toLowerCase();
    if (!kw || !total) return null;
    const occurrences = (text.toLowerCase().match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length;
    const wordsInKw = kw.split(/\s+/).length;
    const density = (occurrences * wordsInKw * 100) / total;
    return { total, occurrences, density, verdict: density < 0.5 ? "Low — possibly under-optimized" : density <= 2.5 ? "Healthy range" : "High — risks looking stuffed" };
  }, [text, keyword]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block flex-1 min-w-48"><span className="label">Keyword or phrase</span>
            <input className="input" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="local tools" /></label>
        </OptionsBar>
        <EditorPane value={text} onChange={setText} rows={8} inputLabel="Page content" />
        {stats && (
          <StatGrid items={[
            { label: "Occurrences", value: String(stats.occurrences), strong: true },
            { label: "Density", value: `${stats.density.toFixed(2)}%`, strong: true },
            { label: "Total words", value: String(stats.total) },
            { label: "Verdict", value: stats.verdict },
          ]} />
        )}
      </div>
    </ToolLayout>
  );
};

export const ReadingTimeTool: ComponentType = () => {
  const [text, setText] = useState("");
  const [wpm, setWpm] = useState(225);
  const words = countWords(text);
  const minutes = words / Math.max(60, wpm);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <NumField label="Reading speed (words/min)" value={wpm} min={60} max={600} onChange={setWpm} />
        </OptionsBar>
        <EditorPane value={text} onChange={setText} rows={8} inputLabel="Article text" sample="Paste your article here…" />
        <StatGrid items={[
          { label: "Reading time", value: readingTime(words), strong: true },
          { label: "Words", value: words.toLocaleString() },
          { label: "Sentences", value: String(countSentences(text)) },
        ]} />
      </div>
    </ToolLayout>
  );
};

export const SchemaGenTool: ComponentType = () => {
  const [type, setType] = useState("Article");
  const [headline, setHeadline] = useState("My Article");
  const [author, setAuthor] = useState("Jane Doe");
  const [datePublished, setDatePublished] = useState(new Date().toISOString().slice(0, 10));
  const [image, setImage] = useState("https://example.com/cover.jpg");
  const [orgName, setOrgName] = useState("Example Org");
  const [logo, setLogo] = useState("https://example.com/logo.png");
  const schema = useMemo(() => {
    const base: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": type,
    };
    if (type === "Article") Object.assign(base, { headline, image, author: { "@type": "Person", name: author }, datePublished, publisher: { "@type": "Organization", name: orgName, logo: { "@type": "ImageObject", url: logo } } });
    else if (type === "Organization") Object.assign(base, { name: orgName, url: "https://example.com", logo });
    else if (type === "WebSite") Object.assign(base, { name: orgName, url: "https://example.com" });
    else if (type === "Product") Object.assign(base, { name: headline, image, offers: { "@type": "Offer", price: "19.99", priceCurrency: "USD", availability: "https://schema.org/InStock" } });
    return base;
  }, [type, headline, author, datePublished, image, orgName, logo]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <SelField label="Schema type" value={type} onChange={setType} options={["Article", "Organization", "WebSite", "Product"].map((t) => ({ value: t, label: t }))} />
          <label className="block"><span className="label">{type === "Product" ? "Product name" : "Headline / name"}</span>
            <input className="input !w-48" value={headline} onChange={(e) => setHeadline(e.target.value)} /></label>
          {type === "Article" && (
            <>
              <label className="block"><span className="label">Author</span><input className="input !w-36" value={author} onChange={(e) => setAuthor(e.target.value)} /></label>
              <label className="block"><span className="label">Published</span><input type="date" className="input !w-40" value={datePublished} onChange={(e) => setDatePublished(e.target.value)} /></label>
            </>
          )}
        </OptionsBar>
        <OutputArea text={`<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`} filename="schema.html" rows={12} label="JSON-LD (paste into <head>)" mime="text/html" />
        <Note>Validate the result with Google's Rich Results Test after publishing — schema only helps if it parses cleanly.</Note>
      </div>
    </ToolLayout>
  );
};

// ───────────── Social pack ─────────────

export const TweetImageTool: ComponentType = () => {
  const [name, setName] = useState("Local User");
  const [handle, setHandle] = useState("localuser");
  const [text, setText] = useState("Working through the backlog this week.");
  const [time, setTime] = useState("2:14 PM · Sep 14, 2026");
  const [likes, setLikes] = useState(1240);
  const [retweets, setRetweets] = useState(356);
  const [dark, setDark] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = 1200;
    const H = 675;
    canvas.width = W;
    canvas.height = H;
    ctx.fillStyle = dark ? "#15202b" : "#ffffff";
    ctx.fillRect(0, 0, W, H);
    // avatar
    ctx.fillStyle = dark ? "#3b82f6" : "#1d9bf0";
    ctx.beginPath();
    ctx.arc(80, 90, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "600 30px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(name.slice(0, 1).toUpperCase() || "?", 80, 100);
    // name & handle
    ctx.textAlign = "left";
    ctx.fillStyle = dark ? "#e7e9ea" : "#0f1419";
    ctx.font = "700 26px sans-serif";
    ctx.fillText(name, 136, 82);
    ctx.fillStyle = dark ? "#71767b" : "#536471";
    ctx.font = "400 24px sans-serif";
    ctx.fillText("@" + handle.replace(/^@/, ""), 136, 116);
    // body text (simple wrap)
    ctx.fillStyle = dark ? "#e7e9ea" : "#0f1419";
    ctx.font = "400 34px sans-serif";
    const words = text.split(/\s+/);
    let line = "";
    let y = 200;
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > W - 160) {
        ctx.fillText(line, 80, y);
        y += 46;
        line = w;
      } else line = test;
    }
    ctx.fillText(line, 80, y);
    // time
    ctx.fillStyle = dark ? "#71767b" : "#536471";
    ctx.font = "400 22px sans-serif";
    ctx.fillText(time, 80, H - 130);
    // divider
    ctx.strokeStyle = dark ? "#38444d" : "#eff3f4";
    ctx.beginPath();
    ctx.moveTo(80, H - 105);
    ctx.lineTo(W - 80, H - 105);
    ctx.stroke();
    // stats
    ctx.fillStyle = dark ? "#71767b" : "#536471";
    ctx.font = "400 24px sans-serif";
    ctx.fillText(`${retweets.toLocaleString()}  Reposts        ${likes.toLocaleString()}  Likes`, 80, H - 60);
  }, [name, handle, text, time, likes, retweets, dark]);
  const download = () => {
    canvasRef.current?.toBlob((b) => b && downloadBlob("tweet.png", b), "image/png");
  };
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block"><span className="label">Display name</span><input className="input !w-36" value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="block"><span className="label">Handle</span><input className="input !w-28" value={handle} onChange={(e) => setHandle(e.target.value)} /></label>
          <label className="block"><span className="label">Timestamp</span><input className="input !w-44" value={time} onChange={(e) => setTime(e.target.value)} /></label>
          <NumField label="Likes" value={likes} onChange={(v) => setLikes(Math.max(0, v || 0))} />
          <NumField label="Reposts" value={retweets} onChange={(v) => setRetweets(Math.max(0, v || 0))} />
          <Toggle label="Dark theme" checked={dark} onChange={setDark} />
        </OptionsBar>
        <label className="block"><span className="label">Tweet text</span>
          <textarea className="textarea !font-sans" rows={3} value={text} onChange={(e) => setText(e.target.value)} /></label>
        <div className="card p-4 flex justify-center">
          <canvas ref={canvasRef} className="max-w-full rounded-tool border border-border" aria-label="Tweet image preview" />
        </div>
        <button className="btn-primary self-start" onClick={download}>Download PNG (1200×675)</button>
        <Note>This is a mock. Don't pass it off as a real post.</Note>
      </div>
    </ToolLayout>
  );
};

export const InstagramFiltersTool: ComponentType = () => {
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const { canvas } = useImg(files);
  const [preset, setPreset] = useState("Clarendon");
  const PRESETS: Record<string, string> = {
    Normal: "none", Clarendon: "contrast(1.2) saturate(1.35)", Gingham: "brightness(1.05) hue-rotate(-10deg)",
    Moon: "grayscale(1) contrast(1.1) brightness(1.1)", Lark: "contrast(.9) brightness(1.1) saturate(1.1)",
    Reyes: "sepia(.22) brightness(1.1) contrast(.85)", Juno: "saturate(1.4) contrast(1.05)",
    Slumber: "saturate(.66) brightness(1.05) sepia(.1)", Crema: "sepia(.5) contrast(1.25) brightness(1.15) saturate(.9)",
    Ludwig: "contrast(1.05) brightness(1.05) saturate(2)", Aden: "hue-rotate(-20deg) contrast(.9) saturate(.85) brightness(1.2)",
    Perpetua: "contrast(1.1) brightness(1.1) saturate(1.1)",
  };
  const filtered = useMemo(() => {
    if (!canvas) return null;
    const out = newCanvas(canvas.width, canvas.height);
    const ctx = out.getContext("2d")!;
    ctx.filter = PRESETS[preset];
    ctx.drawImage(canvas, 0, 0);
    return out;
  }, [canvas, preset]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <Dropzone files={files} onFiles={(f) => setFiles(toDroppedFiles(f))} accept="image/*" />
        {canvas && (
          <>
            <OptionsBar>
              <SelField label="Filter" value={preset} onChange={setPreset} options={Object.keys(PRESETS).map((p) => ({ value: p, label: p }))} />
              <RunButton label="Download filtered PNG" onClick={async () => { if (filtered) downloadBlob(`filtered-${preset.toLowerCase()}.png`, await canvasToBlob(filtered, "image/png")); }} />
            </OptionsBar>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><span className="label">Original</span><img src={canvas.toDataURL()} className="card w-full max-h-96 object-contain" alt="Original" /></div>
              <div><span className="label">{preset}</span><img src={filtered?.toDataURL()} className="card w-full max-h-96 object-contain" alt={`${preset} preview`} /></div>
            </div>
          </>
        )}
      </div>
    </ToolLayout>
  );
};

// local helpers to avoid importing Dropzone twice in one file
import Dropzone, { toDropped as toDroppedFiles, type DroppedFile } from "../../components/Dropzone";
function useImg(files: DroppedFile[]) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const file = files[0]?.file;
    if (!file) { setCanvas(null); return; }
    (async () => {
      const { bitmap } = await loadImageFile(file);
      setCanvas(drawToCanvas(bitmap));
    })();
  }, [files]);
  return { canvas };
}

export const BioGeneratorTool: ComponentType = () => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("developer");
  const [vibes, setVibes] = useState<string[]>(["local-first", "coffee", "open source"]);
  const [emojis, setEmojis] = useState(true);
  const bios = useMemo(() => {
    const v = vibes.filter(Boolean);
    const e = (s: string) => (emojis ? s : s.replace(/\S+\s/g, (m) => m));
    const lines = [
      `${name ? name + " · " : ""}${role[0].toUpperCase() + role.slice(1)}. ${v.length ? v.map((x) => (emojis ? emojiFor(x) + " " : "") + x).join(" · ") : ""}`,
      `${role} who ships. ${v.length ? "Into " + v.join(", ") + "." : ""} Building in public${name ? ` — ${name}` : ""}.`,
      `${emojis ? "🌱 " : ""}${role[0].toUpperCase() + role.slice(1)} by day${v.length ? `, ${v[0]} enthusiast by night` : ""}. ${name ? name + ". " : ""}Making the web faster, one tool at a time.`,
      `${role} · ${v.join(" · ")}${v.length ? " · " : ""}learning something new every week${emojis ? " 🚀" : ""}`,
    ];
    return lines.map(e);
  }, [name, role, vibes, emojis]);
  const emojiFor = (word: string): string => {
    const map: Record<string, string> = { coffee: "☕", "open source": "🔓", "local-first": "🔒", music: "🎧", travel: "✈️", books: "📚", climbing: "🧗", gaming: "🎮", cats: "🐱", dogs: "🐶", plants: "🌿", photography: "📷", cycling: "🚴", running: "🏃", tea: "🍵", design: "🎨" };
    return map[word.toLowerCase()] ?? "✨";
  };
  void emojiFor;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block"><span className="label">Name (optional)</span>
            <input className="input !w-36" value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="block"><span className="label">Role</span>
            <input className="input !w-36" value={role} onChange={(e) => setRole(e.target.value)} /></label>
          <label className="block flex-1 min-w-56"><span className="label">Interests (comma-separated)</span>
            <input className="input" value={vibes.join(", ")} onChange={(e) => setVibes(e.target.value.split(",").map((s) => s.trim()))} /></label>
          <Toggle label="Add emojis" checked={emojis} onChange={setEmojis} />
        </OptionsBar>
        <div className="card divide-y divide-border-subtle overflow-hidden">
          {bios.map((b, i) => (
            <div key={i} className="flex items-start gap-3 px-3 py-2.5">
              <span className="text-[13px] flex-1 leading-relaxed">{b}</span>
              <CopyButton text={b} />
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
};

export const HashtagTool: ComponentType = () => {
  const [topic, setTopic] = useState("local first web tools");
  const [platform, setPlatform] = useState("instagram");
  const [count, setCount] = useState(12);
  const tags = useMemo(() => {
    const words = topic.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 2 && !["and", "the", "for", "with"].includes(w));
    const base = words.map((w) => `#${w}`);
    const combos = words.length >= 2 ? [`#${words[0]}${words[1]}`, `#${words[0]}tools`, `#${words[0]}tips`] : [];
    const platformTags: Record<string, string[]> = {
      instagram: ["#instagood", "#photooftheday", "#picoftheday", "#reels", "#explore"],
      twitter: ["#buildinpublic", "#dev", "#tech", "#webdev"],
      linkedin: ["#career", "#learning", "#professionaldevelopment", "#tech"],
      tiktok: ["#fyp", "#foryou", "#techtok", "#learnontiktok"],
    };
    const generic: Record<string, string[]> = { instagram: ["#creative", "#community", "#daily"], twitter: [], linkedin: ["#growth"], tiktok: ["#viral"] };
    const all = [...new Set([...base, ...combos, ...(platformTags[platform] ?? []), ...(generic[platform] ?? [])])];
    return all.slice(0, Math.min(30, Math.max(3, count)));
  }, [topic, platform, count]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block flex-1 min-w-56"><span className="label">Topic or niche</span>
            <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} /></label>
          <SelField label="Platform" value={platform} onChange={setPlatform} options={["instagram", "twitter", "linkedin", "tiktok"].map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) }))} />
          <NumField label="Max tags" value={count} min={3} max={30} onChange={(v) => setCount(Math.max(3, v || 12))} />
        </OptionsBar>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => <span key={t} className="chip !text-[13px] !py-1 text-accent !border-accent/30">{t}</span>)}
        </div>
        <OutputArea text={tags.join(" ")} filename="hashtags.txt" rows={2} label="Copy-ready block" />
      </div>
    </ToolLayout>
  );
};

export const OgPreviewTool: ComponentType = () => {
  const [url, setUrl] = useState("https://example.com");
  const [title, setTitle] = useState("Example Page");
  const [description, setDescription] = useState("This is how your link preview could look when shared.");
  const [domain, setDomain] = useState("example.com");
  const [imageUrl, setImageUrl] = useState("");
  const [fetched, setFetched] = useState<string | null>(null);
  // network: optionally fetch the real page's og:image through the browser (CORS permitting)
  const fetchPreview = async () => {
    setFetched(null);
    try {
      const res = await fetch(url, { mode: "cors" });
      const html = await res.text();
      const m = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/) ?? html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/);
      if (m) setFetched(m[1]);
    } catch {
      setFetched(null);
    }
  };
  const finalImage = fetched ?? imageUrl;
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block flex-1 min-w-64"><span className="label">Page URL</span>
            <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} /></label>
          <button className="btn-ghost self-end" onClick={fetchPreview}>Try fetching its og:image</button>
        </OptionsBar>
        {fetched === null && !imageUrl && <Note>Fetch only works for sites that allow cross-origin reads. Fill the fields manually otherwise.</Note>}
        {fetched && <Note kind="info">Found og:image on the page (this was the only network request).</Note>}
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block"><span className="label">Title</span><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label className="block"><span className="label">Domain shown</span><input className="input" value={domain} onChange={(e) => setDomain(e.target.value)} /></label>
          <label className="block sm:col-span-2"><span className="label">Description</span>
            <textarea className="textarea !font-sans" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
          <label className="block sm:col-span-2"><span className="label">Image URL (or use the fetch button)</span>
            <input className="input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…/og.png" /></label>
        </div>
        <div className="label">Preview — large card</div>
        <div className="card overflow-hidden max-w-xl">
          <div className="h-56 bg-surface-3 flex items-center justify-center text-ink-dim text-sm overflow-hidden">
            {finalImage ? <img src={finalImage} alt="OG preview" className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} /> : "no image"}
          </div>
          <div className="p-3">
            <div className="text-[11px] uppercase text-ink-dim">{domain}</div>
            <div className="font-semibold mt-0.5 line-clamp-1">{title}</div>
            <div className="text-[13px] text-ink-muted mt-0.5 line-clamp-2">{description}</div>
          </div>
        </div>
        <div className="label">Preview — compact card</div>
        <div className="card overflow-hidden max-w-xl flex">
          <div className="w-32 h-32 bg-surface-3 shrink-0 overflow-hidden">
            {finalImage && <img src={finalImage} alt="OG preview small" className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />}
          </div>
          <div className="p-3">
            <div className="text-[11px] uppercase text-ink-dim">{domain}</div>
            <div className="font-semibold text-sm mt-0.5 line-clamp-2">{title}</div>
            <div className="text-[12px] text-ink-muted mt-0.5 line-clamp-2">{description}</div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export const YoutubeThumbnailTool: ComponentType = () => {
  const [videoId, setVideoId] = useState("dQw4w9WgXcQ");
  const id = useMemo(() => {
    const m = videoId.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/) ?? videoId.trim().match(/^([\w-]{11})$/);
    return m ? m[1] : null;
  }, [videoId]);
  const qualities: [string, string][] = [
    ["Max resolution", "maxresdefault"], ["Standard", "sddefault"], ["High", "hqdefault"], ["Medium", "mqdefault"],
  ];
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <label className="block flex-1 min-w-64"><span className="label">YouTube URL or video ID</span>
            <input className="input font-mono" value={videoId} onChange={(e) => setVideoId(e.target.value)} placeholder="https://youtube.com/watch?v=…" /></label>
        </OptionsBar>
        {id ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {qualities.map(([label, file]) => (
              <div key={file}>
                <span className="label">{label} ({file})</span>
                <a href={`https://i.ytimg.com/vi/${id}/${file}.jpg`} download={`${id}-${file}.jpg`} target="_blank" rel="noreferrer" className="block card overflow-hidden hover:border-ink-dim transition-colors">
                  <img src={`https://i.ytimg.com/vi/${id}/${file}.jpg`} alt={`${label} thumbnail`} className="w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).parentElement?.classList.add("opacity-40"); }} />
                </a>
              </div>
            ))}
          </div>
        ) : <Note kind="error">Couldn't extract an 11-character video ID from that input.</Note>}
        <Note kind="warn">Thumbnails load directly from ytimg.com (that's the network part). Right-click or long-press to save, or open in a tab and save from there. Respect copyright — thumbnails belong to their creators.</Note>
      </div>
    </ToolLayout>
  );
};

export const seoTools: Record<string, ComponentType> = {
  "meta-tag-gen": MetaTagTool,
  "og-tag-gen": OgTagTool,
  "sitemap-gen": SitemapGenTool,
  "word-frequency": WordFrequencySeoTool,
  "keyword-density": KeywordDensityTool,
  "reading-time": ReadingTimeTool,
  "schema-gen": SchemaGenTool,
  "twitter-card": TwitterCardTool,
};

export const socialTools: Record<string, ComponentType> = {
  "tweet-generator": TweetImageTool,
  "instagram-filters": InstagramFiltersTool,
  "bio-generator": BioGeneratorTool,
  "hashtag-gen": HashtagTool,
  "og-preview": OgPreviewTool,
  "youtube-thumbnail": YoutubeThumbnailTool,
};
