import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { homepageContent } from "../content/homepage.content";

const homepageViewPath = fileURLToPath(new URL("../app/home-page-view.tsx", import.meta.url));
const homepageViewSource = readFileSync(homepageViewPath, "utf8");
const renderedIds = new Set(Array.from(homepageViewSource.matchAll(/\bid="([^"]+)"/g), (match) => match[1]));

for (const link of homepageContent.nav.links) {
  if (!link.href.startsWith("#")) {
    continue;
  }

  const target = link.href.slice(1);
  if (!renderedIds.has(target)) {
    throw new Error(`Homepage navigation link "${link.label}" points to missing anchor ${link.href}.`);
  }
}

const faqLink = homepageContent.nav.links.find((link) => link.label === "FAQ");
if (faqLink?.href !== "#faq" || !renderedIds.has("faq")) {
  throw new Error("FAQ navigation must point to the rendered #faq section.");
}

console.log(`PASS: ${homepageContent.nav.links.length} homepage navigation hashes resolve, including FAQ -> #faq.`);
