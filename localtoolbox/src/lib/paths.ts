/** Vite always emits BASE_URL with a trailing slash. Wouter's `base` must not have one. */
export const routerBase = import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;

/** Prefix a site-root path for static files (llms.txt, vendor, favicons). */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}
