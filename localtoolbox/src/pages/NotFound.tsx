import { Link } from "wouter";
import { CATEGORIES } from "../lib/registry";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto py-16 text-center">
      <div className="font-mono text-6xl text-accent mb-3">404</div>
      <h1 className="text-xl font-semibold mb-2">This page took a wrong turn</h1>
      <p className="text-sm text-ink-muted mb-6">
        The page you're looking for doesn't exist (or the URL has a typo). Everything LocalToolBox
        offers is one click away below.
      </p>
      <Link href="/" className="btn-primary">Go to the homepage</Link>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((c) => (
          <Link key={c.id} href={`/category/${c.id}`} className="chip hover:text-ink">{c.name}</Link>
        ))}
      </div>
    </div>
  );
}
