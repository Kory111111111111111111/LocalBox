// GitHub Pages has no SPA rewrite. Serving a copy of index.html as 404.html
// keeps the URL (/tools/pdf-merge) so wouter can route after a refresh.
import { copyFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
copyFileSync(path.join(dist, "index.html"), path.join(dist, "404.html"));
writeFileSync(path.join(dist, ".nojekyll"), "");
console.log("spa-fallback: wrote dist/404.html and dist/.nojekyll");
