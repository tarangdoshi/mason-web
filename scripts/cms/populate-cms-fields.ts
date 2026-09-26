/* Populate the new Sanity fields with exactly what the website shows today.

   Run with the Sanity CLI (uses your logged-in Studio session, never a token
   on disk):

     dry run:  npx sanity exec scripts/cms/populate-cms-fields.ts --with-user-token -- --backup-dir <dir>
     apply:    npx sanity exec scripts/cms/populate-cms-fields.ts --with-user-token -- --backup-dir <dir> --apply

   Guarantees:
   - Backs up every document it might touch before anything else.
   - Additive: a field is only written when it is missing or empty. Existing
     content (including newer edits) is never overwritten.
   - Revision-guarded: each patch only applies to the exact revision it read,
     so a concurrent edit aborts the run instead of being clobbered.
   - Idempotent: running it again changes nothing.
   - Never deletes documents or fields. Does not touch drafts.

   Replaces nothing from scripts/migrate-prerna-content.ts (retired). */

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getCliClient } from "sanity/cli";
import { fallbackAbout, fallbackContactPage, fallbackHome, fallbackPackages, fallbackPackagesPage, fallbackSettings } from "../../lib/cms/fallback";
import type { CmsImage, Heading } from "../../lib/cms/model";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const backupDirIndex = args.indexOf("--backup-dir");
const BACKUP_DIR = backupDirIndex >= 0 ? args[backupDirIndex + 1] : undefined;

const client = getCliClient({ apiVersion: "2026-06-16" }).withConfig({ perspective: "published", useCdn: false });

type Doc = Record<string, unknown> & { _id: string; _type: string; _rev?: string };

const isEmpty = (value: unknown) =>
  value === undefined || value === null || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && value.length === 0);

const key = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "item";

/** An image value that points at a file the website already ships. */
const siteImage = (image: CmsImage, alt?: string) => ({
  _type: "imageWithAlt",
  fallbackSrc: image.src,
  alt: alt ?? (image.alt || "Mason bathroom safety photo"),
  ...(image.objectPosition ? { objectPosition: image.objectPosition } : {})
});

const headingValue = (heading: Heading) => ({ heading: heading.text, headingHighlights: heading.highlights });

const withPriceTokens = (text: string) =>
  text.replace(/₹29,999/g, "{standard_price}").replace(/₹36,999/g, "{advanced_price}");

type Plan = { id: string; rev?: string; create?: Doc; set: Record<string, unknown>; kept: string[] };
const plans: Plan[] = [];

function get(doc: Doc | undefined, dotted: string): unknown {
  return dotted.split(".").reduce<unknown>((value, part) => (value && typeof value === "object" ? (value as Record<string, unknown>)[part] : undefined), doc);
}

/** Queue `path = value` only if the document has nothing there yet. */
function fill(plan: Plan, doc: Doc | undefined, dotted: string, value: unknown) {
  if (isEmpty(get(doc, dotted))) plan.set[dotted] = value;
  else plan.kept.push(dotted);
}

function planFor(doc: Doc | undefined, id: string, type: string): Plan {
  const plan: Plan = { id, rev: doc?._rev, set: {}, kept: [] };
  if (!doc) plan.create = { _id: id, _type: type };
  plans.push(plan);
  return plan;
}

async function main() {
  const types = ["homepage", "siteSettings", "package", "packageFeature", "testimonial", "doctor", "faqs", "gallery", "packagesPage", "aboutPage", "seo"];
  const docs = await client.fetch<Doc[]>(`*[_type in $types && !(_id in path("drafts.**"))]`, { types });
  const byId = new Map(docs.map((doc) => [doc._id, doc]));

  // ---- backup (always, before planning writes)
  if (!BACKUP_DIR) throw new Error("--backup-dir <directory> is required (a backup is taken on every run).");
  mkdirSync(BACKUP_DIR, { recursive: true });
  const backupFile = path.join(BACKUP_DIR, `sanity-backup-cms-populate-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(backupFile, JSON.stringify({ projectId: client.config().projectId, dataset: client.config().dataset, takenAt: new Date().toISOString(), documents: docs }, null, 2));
  console.log(`backup: ${backupFile} (${docs.length} documents)`);

  const home = fallbackHome;

  // ---- homepage
  const homepage = byId.get("homepage");
  if (!homepage) throw new Error("homepage document is missing — refusing to continue.");
  const hp = planFor(homepage, "homepage", "homepage");
  fill(hp, homepage, "hero.headingHighlights", home.hero.heading.highlights);
  fill(hp, homepage, "hero.backgroundImage", siteImage(home.hero.background.desktop, "A Mason technician fitting a grab bar while the parents look on"));
  fill(hp, homepage, "hero.backgroundImageMobile", siteImage(home.hero.background.mobile!, "A Mason technician fitting a grab bar while the parents look on"));
  fill(hp, homepage, "evidenceSection.eyebrow", home.stats.eyebrow);
  fill(hp, homepage, "evidenceSection.heading", home.stats.heading.text);
  fill(hp, homepage, "evidenceSection.headingHighlights", home.stats.heading.highlights);
  fill(hp, homepage, "evidenceSection.costLabel", home.stats.costLabel);
  fill(hp, homepage, "evidenceSection.costPrefix", home.stats.costPrefix);
  fill(hp, homepage, "evidenceSection.costFigure", home.stats.costFigure);
  fill(hp, homepage, "evidenceSection.sourcesNote", home.stats.sourcesNote);
  fill(hp, homepage, "whatWeDoSection.heading", home.safer.heading.text);
  fill(hp, homepage, "whatWeDoSection.headingHighlights", home.safer.heading.highlights);
  fill(hp, homepage, "whatWeDoSection.sideImage", siteImage(home.safer.image));
  fill(hp, homepage, "whySection.eyebrow", home.why.eyebrow);
  fill(hp, homepage, "whySection.heading", home.why.heading.text);
  fill(hp, homepage, "whySection.headingHighlights", home.why.heading.highlights);
  fill(hp, homepage, "whySection.intro", home.why.subtitle);
  const whyItems = (get(homepage, "whySection.items") as { _key?: string; title?: string; tag?: string }[] | undefined) ?? [];
  whyItems.forEach((item) => {
    const match = home.why.items.find((fallbackItem) => fallbackItem.title === item.title);
    if (item._key && match && isEmpty(item.tag)) hp.set[`whySection.items[_key=="${item._key}"].tag`] = match.tag;
  });
  fill(hp, homepage, "packagesSection.eyebrow", home.packages.eyebrow);
  fill(hp, homepage, "packagesSection.heading", home.packages.heading.text);
  fill(hp, homepage, "packagesSection.headingHighlights", home.packages.heading.highlights);
  fill(hp, homepage, "packagesSection.footnote", home.packages.footnote);
  fill(hp, homepage, "processSection.eyebrow", home.process.eyebrow);
  fill(hp, homepage, "processSection.heading", home.process.heading.text);
  fill(hp, homepage, "processSection.headingHighlights", home.process.heading.highlights);
  fill(hp, homepage, "processSection.intro", home.process.subtitle);
  fill(hp, homepage, "processSection.websiteSteps", home.process.steps.map((step) => ({ _key: key(step.title), _type: "object", ...step })));
  fill(hp, homepage, "doctorsSection.eyebrow", home.doctors.eyebrow);
  fill(hp, homepage, "doctorsSection.heading", home.doctors.heading.text);
  fill(hp, homepage, "doctorsSection.headingHighlights", home.doctors.heading.highlights);
  fill(hp, homepage, "doctorsSection.intro", home.doctors.subtitle);
  fill(hp, homepage, "testimonialsSection.eyebrow", home.testimonials.eyebrow);
  fill(hp, homepage, "testimonialsSection.heading", home.testimonials.heading.text);
  fill(hp, homepage, "testimonialsSection.headingHighlights", home.testimonials.heading.highlights);
  fill(hp, homepage, "testimonialsSection.intro", home.testimonials.subtitle);
  fill(hp, homepage, "finalCtaSection.eyebrow", home.finalCta.eyebrow);
  fill(hp, homepage, "finalCtaSection.heading", home.finalCta.heading.text);
  fill(hp, homepage, "finalCtaSection.headingHighlights", home.finalCta.heading.highlights);
  fill(hp, homepage, "finalCtaSection.badges", home.finalCta.badges);
  fill(hp, homepage, "finalCtaSection.backgroundImage", siteImage(home.finalCta.image));

  // ---- FAQs: today's questions in today's order, today's answers
  const faqsDoc = byId.get("faqs");
  const fq = planFor(faqsDoc, "faqs", "faqs");
  const cmsFaq = (get(homepage, "faqSection.items") as { question?: string; answer?: string }[] | undefined) ?? [];
  const faqItems = [
    ...home.faq.items.map((item) => ({ question: item.question, answer: cmsFaq.find((cms) => cms.question === item.question)?.answer || item.answer })),
    ...cmsFaq.filter((cms) => cms.question && cms.answer && !home.faq.items.some((item) => item.question === cms.question)).map((cms) => ({ question: cms.question!, answer: cms.answer! }))
  ].map((item, index) => ({ _key: `faq-${index + 1}-${key(item.question)}`, _type: "faqEntry", question: item.question, answer: withPriceTokens(item.answer), hidden: false }));
  fill(fq, faqsDoc, "eyebrow", home.faq.eyebrow);
  fill(fq, faqsDoc, "heading", home.faq.heading.text);
  fill(fq, faqsDoc, "headingHighlights", home.faq.heading.highlights);
  fill(fq, faqsDoc, "intro", (get(homepage, "faqSection.subtitle") as string | undefined) || home.faq.subtitle);
  fill(fq, faqsDoc, "items", faqItems);

  // ---- Gallery
  const galleryDoc = byId.get("gallery");
  const gl = planFor(galleryDoc, "gallery", "gallery");
  const t = home.transformations;
  fill(gl, galleryDoc, "eyebrow", t.eyebrow);
  fill(gl, galleryDoc, "heading", t.heading.text);
  fill(gl, galleryDoc, "subtitle", (get(homepage, "transformationGallerySection.subtitle") as string | undefined) || t.subtitle);
  fill(gl, galleryDoc, "sliderBefore", siteImage(t.sliderBefore));
  fill(gl, galleryDoc, "sliderAfter", siteImage(t.sliderAfter));
  fill(gl, galleryDoc, "tiles", t.tiles.map((tile, index) => ({ _key: `tile-${index + 1}`, _type: "galleryTile", label: tile.label, hidden: false, image: siteImage(tile.image) })));

  // ---- Packages page
  const pageDoc = byId.get("packagesPage");
  const pp = planFor(pageDoc, "packagesPage", "packagesPage");
  const page = fallbackPackagesPage;
  fill(pp, pageDoc, "eyebrow", page.eyebrow);
  for (const [field, value] of Object.entries(headingValue(page.heading))) fill(pp, pageDoc, field, value);
  fill(pp, pageDoc, "subcopy", page.subcopy);
  fill(pp, pageDoc, "scrollCue", page.scrollCue);
  fill(pp, pageDoc, "image", siteImage(page.image));
  fill(pp, pageDoc, "chooseLabel", page.chooseLabel);
  fill(pp, pageDoc, "chooseNote", page.chooseNote);
  fill(pp, pageDoc, "kitCue", page.kitCue);
  fill(pp, pageDoc, "kitHeading", page.kitHeading);
  fill(pp, pageDoc, "kitNote", page.kitNote);
  fill(pp, pageDoc, "kitFootnote", "All {count} are fitted, tested and handed over on the same visit - there is no shorter version of the kit.");
  fill(pp, pageDoc, "cardRows", fallbackPackages.rows.map((row, index) => ({ _key: `row-${index + 1}`, _type: "cardRow", ...row })));
  fill(pp, pageDoc, "popularLabel", fallbackPackages.popularLabel);
  fill(pp, pageDoc, "homeCardCta", fallbackPackages.homeCardCta);
  fill(pp, pageDoc, "pageCardCta", fallbackPackages.pageCardCta);

  // ---- About (text only; photos stay as placeholders until uploaded)
  const aboutDoc = byId.get("aboutPage");
  const ab = planFor(aboutDoc, "aboutPage", "aboutPage");
  const a = fallbackAbout;
  const list = (items: string[]) => items;
  const objects = <T extends object>(items: T[], type: string, keyOf: (item: T) => string) => items.map((item, index) => ({ _key: `${index + 1}-${key(keyOf(item))}`, _type: type, ...item }));
  fill(ab, aboutDoc, "hero", { eyebrow: a.hero.eyebrow, ...headingValue(a.hero.heading), paragraphs: list(a.hero.paragraphs), ctaLabel: a.hero.ctaLabel });
  fill(ab, aboutDoc, "story", { eyebrow: a.story.eyebrow, ...headingValue(a.story.heading), beats: objects(a.story.beats, "storyBeat", (beat) => beat.label) });
  fill(ab, aboutDoc, "statement", headingValue(a.statement));
  fill(ab, aboutDoc, "why", { eyebrow: a.why.eyebrow, ...headingValue(a.why.heading), refusals: a.why.refusals, promise: a.why.promise, hope: a.why.hope });
  fill(ab, aboutDoc, "team", { eyebrow: a.team.eyebrow, ...headingValue(a.team.heading), intro: a.team.intro, trust: a.team.trust, founders: objects(a.team.founders, "founder", (founder) => founder.name) });
  fill(ab, aboutDoc, "approach", { eyebrow: a.approach.eyebrow, ...headingValue(a.approach.heading), paragraphs: a.approach.paragraphs, routineLabel: a.approach.routineLabel, routine: a.approach.routine });
  fill(ab, aboutDoc, "goals", { eyebrow: a.goals.eyebrow, ...headingValue(a.goals.heading), intro: a.goals.intro, items: objects(a.goals.items, "goal", (goal) => goal.label) });
  fill(ab, aboutDoc, "closing", { ...headingValue(a.closing.heading), body: a.closing.body, ctaLabel: a.closing.ctaLabel });

  // ---- Contact & Support
  const settingsDoc = byId.get("siteSettings");
  if (!settingsDoc) throw new Error("siteSettings document is missing — refusing to continue.");
  const ss = planFor(settingsDoc, "siteSettings", "siteSettings");
  fill(ss, settingsDoc, "supportEmail", fallbackSettings.contact.supportEmail);
  fill(ss, settingsDoc, "supportHours", fallbackSettings.contact.supportHours);
  fill(ss, settingsDoc, "footerHeading", fallbackSettings.footer.heading.text);
  fill(ss, settingsDoc, "footerHeadingHighlights", fallbackSettings.footer.heading.highlights);
  fill(ss, settingsDoc, "footerCtaLabel", fallbackSettings.footer.ctaLabel);
  fill(ss, settingsDoc, "footerTagline", fallbackSettings.footer.tagline);
  const cp = fallbackContactPage;
  fill(ss, settingsDoc, "contactEyebrow", cp.eyebrow);
  fill(ss, settingsDoc, "contactHeading", cp.heading.text);
  fill(ss, settingsDoc, "contactHeadingHighlights", cp.heading.highlights);
  fill(ss, settingsDoc, "contactIntro", cp.intro);
  fill(ss, settingsDoc, "contactImage", siteImage(cp.image));
  fill(ss, settingsDoc, "contactCardTitle", cp.cardTitle);
  fill(ss, settingsDoc, "contactCardBody", cp.cardBody);
  fill(ss, settingsDoc, "contactCallLabel", cp.callLabel);
  fill(ss, settingsDoc, "contactHoursLabel", cp.hoursLabel);
  fill(ss, settingsDoc, "contactEmailLabel", cp.emailLabel);

  // ---- Packages: numeric prices
  for (const plan of fallbackPackages.plans) {
    const id = `package-${plan.code}`;
    const doc = byId.get(id);
    if (!doc) throw new Error(`${id} is missing — refusing to continue.`);
    const pk = planFor(doc, id, "package");
    fill(pk, doc, "priceInr", plan.priceInr);
    if (plan.referencePriceInr) fill(pk, doc, "referencePriceInr", plan.referencePriceInr);
  }

  // ---- Package components: category + thumbnail
  for (const component of fallbackPackages.components) {
    const id = `packageFeature-${component.id}`;
    const doc = byId.get(id);
    if (!doc) {
      console.log(`  note: ${id} not found; skipped (the website falls back to built-in values)`);
      continue;
    }
    const pf = planFor(doc, id, "packageFeature");
    fill(pf, doc, "category", component.category);
    fill(pf, doc, "image", siteImage(component.image, component.title));
  }

  // ---- Doctors: a doctor without a photo gets the photo the site shows today
  const doctorPhotos = new Map(home.doctors.items.map((item) => [item.name, item.photo]));
  for (const doc of docs.filter((item) => item._type === "doctor")) {
    const photo = doctorPhotos.get(doc.name as string);
    const current = doc.photo as { fallbackSrc?: string; asset?: unknown } | undefined;
    if (photo && !current?.fallbackSrc && !current?.asset) {
      const dp = planFor(doc, doc._id, "doctor");
      dp.set.photo = siteImage(photo, `Portrait of ${doc.name as string}`);
    }
  }

  // ---- report
  const active = plans.filter((plan) => plan.create || Object.keys(plan.set).length);
  for (const plan of plans) {
    const fields = Object.keys(plan.set);
    if (!plan.create && !fields.length) continue;
    console.log(`\n## ${plan.create ? "CREATE " : ""}${plan.id}${plan.rev ? ` @${plan.rev}` : ""}`);
    for (const field of fields) console.log(`  + ${field} = ${JSON.stringify(plan.set[field]).slice(0, 110)}`);
    if (plan.kept.length) console.log(`  (kept existing: ${plan.kept.join(", ")})`);
  }
  const fieldCount = active.reduce((count, plan) => count + Object.keys(plan.set).length, 0);
  console.log(`\nTOTAL: ${active.filter((plan) => plan.create).length} documents to create, ${active.filter((plan) => !plan.create).length} to patch, ${fieldCount} fields`);

  if (!APPLY) {
    console.log("DRY RUN — nothing written. Re-run with --apply to write.");
    return;
  }
  if (!active.length) {
    console.log("Nothing to do — already populated.");
    return;
  }
  const transaction = client.transaction();
  for (const plan of active) {
    if (plan.create) transaction.createIfNotExists({ ...plan.create, ...plan.set } as Doc);
    else transaction.patch(plan.id, (patch) => patch.ifRevisionId(plan.rev!).set(plan.set));
  }
  const result = await transaction.commit({ visibility: "sync" });
  console.log(`COMMITTED transaction ${result.transactionId} (${result.documentIds.length} documents)`);
}

main().catch((error) => {
  console.error("FAILED:", error instanceof Error ? error.message : error);
  process.exit(1);
});
