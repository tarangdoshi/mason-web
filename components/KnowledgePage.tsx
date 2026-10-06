import type { ReactNode } from "react";
import Link from "next/link";
import Nav from "./Nav";
import Footer from "./Footer";
import Cta from "./Cta";

/* Long-form, server-rendered pages that explain one thing well (the assessment service, the guide).
   Same reading measure and typography as the legal pages, so every fact is plain HTML text with real
   headings: readable without scripts, images or animation, and quotable on its own. */

export type KnowledgeBlock =
  | { p: string } // paragraph; inline [label](/href) links
  | { list: string[] } // bullets
  | { steps: { title: string; text: string }[] } // an ordered process
  | { quotes: { quote: string; name: string; meta?: string }[] }; // first-party voices from Sanity (no review markup)

export type KnowledgeSection = { id: string; heading: string; blocks: KnowledgeBlock[] };

export type KnowledgeSource = { label: string; href: string; note?: string };

export type KnowledgeDoc = {
  breadcrumb: string;
  eyebrow: string;
  title: string;
  intro: string;
  updated?: string;
  /** Short factual answers placed before the detail. */
  summary: { term: string; detail: string }[];
  sections: KnowledgeSection[];
  sources?: KnowledgeSource[];
  cta: { heading: string; text: string; label: string; secondary?: { label: string; href: string } };
  /** Repeat the booking action under the intro, for pages whose job is the booking. */
  topCta?: boolean;
};

function withLinks(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const [, label, href] = m;
    const className = "font-medium text-accent underline underline-offset-2";
    out.push(href.startsWith("http")
      ? <a key={i++} href={href} className={className} target="_blank" rel="noreferrer">{label}</a>
      : <Link key={i++} href={href} className={className}>{label}</Link>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Block({ block }: { block: KnowledgeBlock }) {
  if ("p" in block) return <p className="text-base leading-relaxed text-cream-dim">{withLinks(block.p)}</p>;
  if ("list" in block) {
    return (
      <ul className="space-y-2.5">
        {block.list.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span className="text-base leading-relaxed text-cream-dim">{withLinks(item)}</span>
          </li>
        ))}
      </ul>
    );
  }
  if ("quotes" in block) {
    return (
      <div className="grid gap-4">
        {block.quotes.map((item) => (
          <figure key={item.name} className="rounded-2xl border border-line bg-surface px-6 py-5">
            <blockquote className="text-base leading-relaxed text-cream">&ldquo;{item.quote}&rdquo;</blockquote>
            <figcaption className="mt-3 text-sm text-cream-faint">
              <span className="font-semibold text-cream-dim">{item.name}</span>
              {item.meta ? <span>, {item.meta}</span> : null}
            </figcaption>
          </figure>
        ))}
      </div>
    );
  }
  return (
    <ol className="space-y-5">
      {block.steps.map((step, i) => (
        <li key={step.title} className="flex gap-4">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent font-display text-sm font-bold text-white">{i + 1}</span>
          <div>
            <h3 className="font-display text-lg font-semibold text-cream">{step.title}</h3>
            <p className="mt-1 text-base leading-relaxed text-cream-dim">{withLinks(step.text)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function KnowledgePage({ doc, jsonLd }: { doc: KnowledgeDoc; jsonLd: string }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Nav />
      <main>
        <article>
          <header className="mx-auto max-w-3xl px-6 pt-32 pb-10 lg:px-10 lg:pt-40 lg:pb-12">
            <nav aria-label="Breadcrumb" className="mb-6 text-sm text-cream-faint">
              <Link href="/" className="hover:text-accent">Home</Link>
              <span aria-hidden="true"> › </span>
              <span aria-current="page">{doc.breadcrumb}</span>
            </nav>
            <p className="eyebrow mb-5">{doc.eyebrow}</p>
            <h1 className="h-display text-4xl text-cream sm:text-5xl">{doc.title}</h1>
            {doc.updated ? <p className="mt-5 font-mono-label text-sm text-cream-faint">Last updated {doc.updated}</p> : null}
            <p className="mt-8 text-base leading-relaxed text-cream-dim sm:text-lg">{withLinks(doc.intro)}</p>
            {doc.topCta ? (
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                <Cta href="#book">{doc.cta.label}</Cta>
                <a href="#how-it-works" className="text-sm font-semibold text-accent underline underline-offset-4">See how it works</a>
              </div>
            ) : null}
          </header>

          <section aria-labelledby="in-short" className="mx-auto max-w-3xl px-6 pb-10 lg:px-10">
            <div className="rounded-2xl border border-line bg-surface px-6 py-6">
              <h2 id="in-short" className="eyebrow mb-4">In short</h2>
              <dl className="grid gap-4">
                {doc.summary.map((item) => (
                  <div key={item.term}>
                    <dt className="font-display text-base font-semibold text-cream">{item.term}</dt>
                    <dd className="mt-1 text-base leading-relaxed text-cream-dim">{withLinks(item.detail)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <div className="mx-auto max-w-3xl space-y-12 px-6 pb-16 lg:px-10">
            {doc.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-28">
                <h2 className="font-display text-xl font-extrabold tracking-tight text-cream sm:text-2xl">{section.heading}</h2>
                <div className="mt-5 space-y-4">
                  {section.blocks.map((block, i) => <Block key={i} block={block} />)}
                </div>
              </section>
            ))}

            {doc.sources?.length ? (
              <section id="sources" className="scroll-mt-28">
                <h2 className="font-display text-xl font-extrabold tracking-tight text-cream sm:text-2xl">Sources</h2>
                <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-cream-dim">
                  {doc.sources.map((source) => (
                    <li key={source.href}>
                      <a href={source.href} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2">{source.label}</a>
                      {source.note ? <span> - {source.note}</span> : null}
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </div>

          <section className="border-t border-line bg-surface">
            <div className="mx-auto max-w-3xl px-6 py-16 lg:px-10">
              <h2 className="h-display text-3xl text-cream sm:text-4xl">{doc.cta.heading}</h2>
              <p className="mt-4 text-base leading-relaxed text-cream-dim">{withLinks(doc.cta.text)}</p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                <Cta href="#book">{doc.cta.label}</Cta>
                {doc.cta.secondary ? (
                  <Link href={doc.cta.secondary.href} className="text-sm font-semibold text-accent underline underline-offset-4">
                    {doc.cta.secondary.label}
                  </Link>
                ) : null}
              </div>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
