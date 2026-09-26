import type { ReactNode } from "react";
import Link from "next/link";
import Nav from "./Nav";
import Footer from "./Footer";

/* Shared layout for the legal pages (privacy, terms, refund). The content of
   each lives as structured data in legal-data.ts; this file is only how that
   content is rendered, so the three pages can never drift apart in look or
   spacing. Long-form, single measure, generous line-height — a legal document
   is read, not scanned, so it gets a comfortable column and nothing else
   competing for the eye. */

export type Block =
  | { p: string } // a paragraph — supports inline [label](/href) links
  | { list: string[] }; // a bulleted list

export type Section = {
  heading: string;
  blocks: Block[];
};

export type LegalDoc = {
  /** Page + h1 title, e.g. "Privacy Policy". */
  title: string;
  /** Effective / last-updated date, shown under the title. */
  updated: string;
  /** The lead paragraph under the title. */
  intro: string;
  sections: Section[];
};

/** Kebab-case a heading into a stable anchor id. */
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/* Turn a plain string into React nodes, promoting any [label](/href) spans into
   links. Everything else passes through as text — no HTML is interpreted, so
   the copy can't inject markup. */
function withLinks(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const [, label, href] = m;
    const external = href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");
    out.push(
      external ? (
        <a
          key={i++}
          href={href}
          className="font-medium text-accent underline-offset-2 hover:underline"
        >
          {label}
        </a>
      ) : (
        <Link
          key={i++}
          href={href}
          className="font-medium text-accent underline-offset-2 hover:underline"
        >
          {label}
        </Link>
      ),
    );
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <Nav />
      <main>
        {/* Header */}
        <section className="mx-auto max-w-3xl px-6 pt-32 pb-10 lg:px-10 lg:pt-40 lg:pb-12">
          <p className="eyebrow mb-5">Legal</p>
          <h1 className="h-display text-4xl text-cream sm:text-5xl">
            {doc.title}
          </h1>
          <p className="mt-5 font-mono-label text-sm text-cream-faint">
            Last updated {doc.updated}
          </p>
          <p className="mt-8 text-base leading-relaxed text-cream-dim sm:text-lg">
            {withLinks(doc.intro)}
          </p>
        </section>

        {/* Contents — quick jump for a long document */}
        <section className="mx-auto max-w-3xl px-6 pb-8 lg:px-10">
          <nav
            aria-label="On this page"
            className="rounded-2xl border border-line bg-surface px-6 py-5"
          >
            <p className="eyebrow mb-4">On this page</p>
            <ol className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {doc.sections.map((s, i) => (
                <li key={s.heading} className="flex gap-3 text-sm">
                  <span className="font-mono-label text-cream-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <a
                    href={`#${slug(s.heading)}`}
                    className="text-cream-dim transition-colors hover:text-accent"
                  >
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </section>

        {/* Body */}
        <section className="mx-auto max-w-3xl px-6 pb-24 lg:px-10 lg:pb-32">
          <div className="space-y-12">
            {doc.sections.map((s, i) => (
              <section
                key={s.heading}
                id={slug(s.heading)}
                className="scroll-mt-28"
              >
                <h2 className="font-display text-xl font-extrabold tracking-tight text-cream sm:text-2xl">
                  <span className="text-cream-faint">
                    {String(i + 1).padStart(2, "0")}.{" "}
                  </span>
                  {s.heading}
                </h2>
                <div className="mt-5 space-y-4">
                  {s.blocks.map((b, j) =>
                    "list" in b ? (
                      <ul key={j} className="space-y-2.5">
                        {b.list.map((item, k) => (
                          <li key={k} className="flex items-start gap-3">
                            <span
                              aria-hidden="true"
                              className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                            />
                            <span className="text-base leading-relaxed text-cream-dim">
                              {withLinks(item)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p
                        key={j}
                        className="text-base leading-relaxed text-cream-dim"
                      >
                        {withLinks(b.p)}
                      </p>
                    ),
                  )}
                </div>
              </section>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
