import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!projectId) throw new Error("NEXT_PUBLIC_SANITY_PROJECT_ID is required");

const execute = process.argv.includes("--execute");
const client = createClient({ projectId, dataset, token, apiVersion: "2026-06-16", useCdn: false });

const faqItems = [
  {
    _key: "faq-1",
    question: "What does Mason Company do?",
    answer: "Mason Company upgrades existing bathrooms with grab support, anti-slip treatments and mats, shower seating, safer locks, edge and corner protection, drainage support, slippers, and reinforced fixture support."
  },
  {
    _key: "faq-2",
    question: "Who is Mason Company for?",
    answer: "Mason is designed for families with ageing parents, seniors living independently, people with balance concerns, and households that want to reduce bathroom risk before an incident happens."
  },
  {
    _key: "faq-3",
    question: "Do you renovate the entire bathroom?",
    answer: "No. Mason focuses on safety upgrades to the existing bathroom. Most installations do not require a major renovation."
  },
  {
    _key: "faq-4",
    question: "Will the bathroom look clinical?",
    answer: "No. Mason's solution is designed to feel premium and home-first. The goal is to improve safety while preserving the comfort and dignity of the space."
  },
  {
    _key: "faq-5",
    question: "What packages do you offer?",
    answer: "Mason currently offers two packages: Standard at ₹30,000 and Advanced at ₹37,000. Both install exactly the same complete kit. Advanced adds one technician safety check-up visit during the first year."
  },
  {
    _key: "faq-6",
    question: "What is included in Standard?",
    answer: "The complete 12-item kit includes three vertical grab bars, one L / angled bar, one folding support bar, one anti-slip treatment, one shower mat, one post-shower mat, one shower stool, one two-way lock, one edge and corner protection treatment, four drainage supports, one pair of bathroom slippers, and one reinforced fixture support. Toilet-seat support, sensor lighting, and SOS hardware are not included."
  },
  {
    _key: "faq-7",
    question: "What is included in Advanced?",
    answer: "Exactly the same 12-item installation kit as Standard. Advanced adds one technician follow-up visit within the first year: we inspect the completed work, check for flaws or additional support needs, and cover necessary corrective work or additional support identified during that included visit."
  },
  {
    _key: "faq-8",
    question: "Can I buy only one product, like a grab bar?",
    answer: "Mason is designed as a package-first service. We focus on complete bathroom safety coverage rather than isolated product installation."
  },
  {
    _key: "faq-9",
    question: "How does booking work?",
    answer: "You can choose a package online, proceed to payment, request a callback, or speak with our team for assisted booking."
  },
  {
    _key: "faq-10",
    question: "How can I pay?",
    answer: "You can pay through the website, or our team can share a secure payment link after your call."
  },
  {
    _key: "faq-11",
    question: "Can I cancel after booking?",
    answer: "Yes. If you cancel before the technician arrives or starts implementation, you are eligible for a full refund."
  },
  {
    _key: "faq-12",
    question: "Do you inspect the bathroom before installation?",
    answer: "Yes. Depending on location and logistics, Mason may complete a virtual or physical inspection before installation."
  },
  {
    _key: "faq-13",
    question: "Who installs the package?",
    answer: "Mason-trained technicians handle the installation, site verification, fitting, and final handover."
  }
];

const evidenceCards = [
  { _key: "ev-card-serious-injury", id: "ev-card-serious-injury", kicker: "Reported injury and/or fall", value: "25%", label: "Among Indians aged 60+, 1 in 4 reported an injury and/or fall in the previous two years.", context: "Fall risk is already present in many ageing households.", sourceLabel: "LASI India Executive Summary", sourceId: "lasi-exec-2019", ctaLabel: "View Evidence", ctaHref: "/evidence" },
  { _key: "ev-card-independence-loss", id: "ev-card-independence-loss", kicker: "Bathroom injuries from falls", value: "81%", label: "Falls are the dominant risk around wet zones, toilets, and transfers.", context: "The bathroom concentrates several high-risk movements in one room.", sourceLabel: "CDC Bathroom Injuries Report", sourceId: "cdc-bathroom-injuries", ctaLabel: "View Evidence", ctaHref: "/evidence" },
  { _key: "ev-card-falls-injury-rate", id: "ev-card-falls-injury-rate", kicker: "Falls that led to injury", value: "66%", label: "A review of older adults in India put the pooled injury rate at 65.6% among those who fell.", context: "A fall often carries an injury burden beyond the immediate incident.", sourceLabel: "India falls-injury systematic review", sourceId: "india-falls-injury-review", ctaLabel: "View Evidence", ctaHref: "/evidence" },
  { _key: "ev-card-prevention-effect", id: "ev-card-prevention-effect", kicker: "Fewer falls after home changes", prefix: "Up to", value: "38%", label: "Home hazard interventions cut fall rates by 26–38%, with the largest effect for higher-risk adults.", context: "Targeted changes at home can make a measurable difference.", sourceLabel: "Cochrane home-hazard reduction review", sourceId: "cochrane-home-hazards-2021", ctaLabel: "View Evidence", ctaHref: "/evidence" }
];

const processSteps = [
  { _key: "process-step-1", id: "process-step-1", title: "Book your package", description: "Choose Standard or Advanced online, request a callback, or call us for guidance." },
  { _key: "process-step-2", id: "process-step-2", title: "Confirm payment", description: "Pay securely on the website, or receive a payment link from our team after your call." },
  { _key: "process-step-3", id: "process-step-3", title: "Inspection", description: "We schedule a virtual or physical bathroom inspection depending on location and logistics." },
  { _key: "process-step-4", id: "process-step-4", title: "Technician visit", description: "Our trained technicians verify the site and finalise support placement." },
  { _key: "process-step-5", id: "process-step-5", title: "Installation", description: "The selected package is installed with careful fitting, clean execution, and minimal disruption." },
  { _key: "process-step-6", id: "process-step-6", title: "Success handover", description: "We complete a walkthrough and document the upgrade with before-and-after pictures." }
];

const homepagePatch = {
  hero: {
    eyebrow: "Bathroom Safety for Ageing Parents",
    heading: "Most falls happen here. We make sure yours don't.",
    subcopy: "You can't always be there - safety can be. Premium, doctor-informed, expertly-installed bathroom safety.",
    primaryCta: "Book a Safety Visit",
    secondaryCta: "See Transformations",
    supportPoints: ["Premium home-first finish", "Trained Mason experts", "Doctor-reviewed planning"]
  },
  transformationGallerySection: {
    title: "A reassurance. Not a renovation.",
    subtitle: "We make bathrooms safer through thoughtful additions - grip, balance, comfort, ease. Drag to see the difference."
  },
  whatWeDoSection: {
    description: "Leave your details and a Mason advisor will call to arrange the visit. Full refund any time before installation."
  },
  evidenceSection: {
    title: "The response should be thoughtful.",
    subtitle: "Numbers that make the decision visible.",
    cards: evidenceCards
  },
  packagesSection: {
    title: "The same complete kit. You choose the cover.",
    subtitle: "Both packages install everything, fitted by Mason-trained experts. Advanced includes one safety check-up visit during the first year."
  },
  whySection: {
    title: "Why Mason Company",
    subtitle: "A complete bathroom safety solution, shaped by medical expertise, expert installation, and the design standards families expect at home.",
    items: [
      { _key: "why-1", title: "Comprehensive by design", description: "We look at the full bathroom routine: entry, turning, sitting, standing, showering, and night-time use." },
      { _key: "why-2", title: "Doctor-informed planning", description: "Our approach is shaped with doctor inputs, preventive mobility guidance, and senior-care context." },
      { _key: "why-3", title: "Trained Mason experts", description: "Every visit is handled by trained technicians who understand support placement and secure fitting." },
      { _key: "why-4", title: "One accountable team", description: "From selection to inspection, installation, and follow-up, Mason stays responsible for the outcome." },
      { _key: "why-5", title: "Premium, home-first finish", description: "Built to feel calm and considered - not hospital-like or temporary." },
      { _key: "why-6", title: "Evidence-led prevention", description: "We study fall-risk patterns and assisted-care environments to design practical home upgrades." }
    ]
  },
  processSection: {
    title: "From booking to a safer bathroom.",
    subtitle: "Six clear steps, handled by one accountable Mason team - from package booking all the way to final handover.",
    addOnDisclosure: "Clear steps. Assisted support. One accountable Mason team from booking to handover.",
    primaryCta: "Book a Safety Visit",
    secondaryCta: "Talk to a Mason Company specialist",
    steps: processSteps
  },
  testimonialsSection: {
    title: "What Families Say After Installation",
    subtitle: "Families choose Mason Company because the upgrade feels thoughtful, premium, and reassuring, not like a temporary hospital setup."
  },
  faqSection: {
    title: "Questions, answered",
    subtitle: "Everything about packages, booking, and installation. Still unsure? Book a free visit and we'll talk it through.",
    items: faqItems
  },
  finalCtaSection: {
    title: "Book the visit. We'll handle the rest.",
    subtitle: "Act before a fall changes everything. Leave your number and one accountable Mason team handles the rest.",
    primaryCta: "Request a Callback"
  }
};

const packagePatches = [
  { id: "package-package-standard", fields: { badge: "The complete kit", bestFor: "The full safety upgrade, installed, inspected and handed over in one go.", outcome: "A complete everyday safety upgrade for steadier movement, better grip, and more confidence at home.", referencePrice: "₹35,000", currentPrice: "₹30,000", ctaLabel: "Book Standard", isFeatured: true } },
  { id: "package-package-advanced", fields: { badge: "The complete kit + 1-Year Safety Check-Up Included", bestFor: "The same installation, with one included safety check-up during the first year.", outcome: "One technician visit within the first year to inspect the work, identify issues or additional support needs, and complete necessary corrective work covered by the package.", referencePrice: "₹44,000", currentPrice: "₹37,000", followUpLabel: "1-Year Safety Check-Up Included", ctaLabel: "Book Advanced", isFeatured: false } }
];

const testimonialPatches = [
  { id: "testimonial-ts-1", city: "Bengaluru" },
  { id: "testimonial-ts-2", city: "Goa" },
  { id: "testimonial-ts-3", city: "Bengaluru" }
];

const existing = await client.fetch<Array<{ _id: string; _type: string }>>(
  `*[_id in $ids]{_id, _type}`,
  { ids: ["homepage", ...packagePatches.map((item) => item.id), ...testimonialPatches.map((item) => item.id)] }
);
const existingIds = new Set(existing.map((item) => item._id));
for (const id of ["homepage", ...packagePatches.map((item) => item.id), ...testimonialPatches.map((item) => item.id)]) {
  if (!existingIds.has(id)) throw new Error(`Preflight failed: expected Sanity document ${id} was not found.`);
}

console.log(`Prerna content migration target: ${projectId}/${dataset}`);
console.log(`Preflight: homepage, ${packagePatches.length} package documents, and ${testimonialPatches.length} testimonial documents verified.`);
console.log(JSON.stringify({ homepage: homepagePatch, packages: packagePatches, testimonials: testimonialPatches }, null, 2));

if (!execute) {
  console.log("Dry run only. No writes made. Pass --execute only after exporting the target documents and receiving founder approval.");
  process.exit(0);
}

if (!token) throw new Error("SANITY_API_WRITE_TOKEN is required for --execute");
const tx = client.transaction();
tx.patch("homepage", (patch) => patch.set(homepagePatch));
for (const item of packagePatches) tx.patch(item.id, (patch) => patch.set(item.fields));
for (const item of testimonialPatches) tx.patch(item.id, (patch) => patch.set({ city: item.city }));
await tx.commit();
console.log(`Applied the Prerna content baseline to ${projectId}/${dataset}.`);
