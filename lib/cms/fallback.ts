/* Safe fallback content for the public site.

   Used only when Sanity is unreachable, a document is missing, or a field is
   empty or invalid. A published Sanity value always wins over these. The text
   matches what the site rendered when Sanity became the source of truth, so a
   CMS outage degrades to the approved launch copy rather than to a blank page. */

import type {
  ContactPageContent,
  HomeContent,
  PackagesContent,
  PackagesPageContent,
  ResolvedComponent,
  ResolvedPlan,
  SiteSettingsContent
} from "./model";

const img = (src: string, alt: string, objectPosition?: string) => ({ src, alt, ...(objectPosition ? { objectPosition } : {}) });

export const fallbackSettings: SiteSettingsContent = {
  contact: {
    supportEmail: "support@masoncompany.in",
    supportHours: "Monday to Friday, 10 am to 7 pm",
    phoneDisplay: "+91 81494 33383",
    phoneHref: "tel:+918149433383",
    whatsappUrl: "https://wa.me/918149433383"
  },
  footer: {
    heading: { text: "A safer bathroom, without the compromise", highlights: ["compromise"] },
    ctaLabel: "Book Free Inspection",
    tagline: "Complete bathroom safety for ageing adults - planned with medical input, fitted by trained experts, and finished to feel like home."
  },
  doctorDisclaimer:
    "Doctor inputs are used for preventive safety planning and product approach. Mason Company does not provide medical treatment or guarantee fall-free outcomes."
};

export const fallbackHome: HomeContent = {
  hero: {
    heading: { text: "Most falls happen in the bathroom. We make sure yours don't.", highlights: ["falls"] },
    subcopy: "You can't always be there - safety can be. Premium, doctor-informed, expertly-installed bathroom safety.",
    primaryCta: "Book Free Inspection",
    secondaryCta: "See Transformations"
  },
  stats: {
    eyebrow: "The risk is real",
    heading: { text: "The response should be thoughtful.", highlights: ["thoughtful"] },
    costLabel: "The cost of doing nothing",
    costPrefix: "Up to",
    costFigure: "₹10 lakh",
    cards: [
      { value: "25%", label: "Reported injury and/or fall", copy: "Among Indians aged 60+, 1 in 4 reported an injury and/or fall in the previous two years." },
      { value: "81%", label: "Bathroom injuries from falls", copy: "Falls are the dominant risk around wet zones, toilets, and transfers." },
      { value: "66%", label: "Falls that led to injury", copy: "A review of older adults in India put the pooled injury rate at 65.6% among those who fell." },
      { prefix: "Up to", value: "38%", label: "Fewer falls after home changes", copy: "Home hazard interventions cut fall rates by 26–38%, with the largest effect for higher-risk adults." }
    ],
    sourcesNote: "Sources: LASI India, CDC bathroom-injury report, India falls-injury systematic review, Cochrane home-hazard reduction review."
  },
  safer: {
    heading: { text: "Make your bathroom safer\nwhile it still feels like home", highlights: ["safer", "home"] },
    description: "Leave your details and a Mason advisor will call to arrange the visit. Full refund any time before installation.",
    image: img("/prerna/images/care-2.jpg", "An older person's hands resting in their lap", "50% 70%")
  },
  why: {
    eyebrow: "Why Mason Company",
    heading: { text: "A complete solution - not a pile of products.", highlights: ["solution"] },
    subtitle: "Six strengths that come together into one accountable outcome.",
    items: [
      { title: "Comprehensive by design", description: "We look at the full bathroom routine: entry, turning, sitting, standing, showering, and night-time use.", tag: "The whole routine" },
      { title: "Doctor-informed planning", description: "Our approach is shaped with doctor inputs, preventive mobility guidance, and senior-care context.", tag: "Medically shaped" },
      { title: "Trained Mason experts", description: "Every visit is handled by trained technicians who understand support placement and secure fitting.", tag: "Skilled hands" },
      { title: "One accountable team", description: "From selection to inspection, installation, and follow-up, Mason stays responsible for the outcome.", tag: "Owned end to end" },
      { title: "Premium, home-first finish", description: "Built to feel calm and considered - not hospital-like or temporary.", tag: "Still feels like home" },
      { title: "Evidence-led prevention", description: "We study fall-risk patterns and assisted-care environments to design practical home upgrades.", tag: "Grounded in evidence" }
    ]
  },
  transformations: {
    eyebrow: "Transformations",
    heading: { text: "A reassurance. Not a renovation.", highlights: [] },
    subtitle: "We make bathrooms safer through thoughtful additions - grip, balance, comfort, ease. Drag to see the difference.",
    sliderBefore: img("/prerna/images/bath-1.jpg", "Before the Mason safety upgrade"),
    sliderAfter: img("/prerna/images/bath-1.jpg", "After the Mason safety upgrade"),
    tiles: [
      { image: img("/prerna/images/bath-2.jpg", "Guest bathroom after safety upgrade"), label: "Guest bathroom after safety upgrade" },
      { image: img("/prerna/images/shower-2.jpg", "Walk-in shower · Goa"), label: "Walk-in shower · Goa" },
      { image: img("/prerna/images/bath-4.jpg", "Master bathroom after safety upgrade"), label: "Master bathroom after safety upgrade" },
      { image: img("/prerna/images/shower-3.jpg", "Ensuite shower · Goa"), label: "Ensuite shower · Goa" }
    ]
  },
  packages: {
    eyebrow: "Choose your safety package",
    heading: { text: "The same complete kit. You choose the cover.", highlights: ["cover"] },
    subtitle: "Both packages install everything, fitted by Mason-trained experts. Advanced includes annual safety visits for 2 years after installation.",
    footnote: "Both packages are planned for real bathroom movement and installed by trained Mason experts - so the result feels safe, thoughtful, and still beautifully at home."
  },
  process: {
    eyebrow: "Our process",
    heading: { text: "From booking to a safer bathroom.", highlights: ["safer"] },
    subtitle: "Three clear steps, handled by one accountable Mason team - from your first request all the way to a finished installation.",
    ctaLabel: "Book Free Inspection",
    steps: [
      { title: "Request your visit", description: "Leave your details and a Mason advisor will call to arrange the visit." },
      { title: "Inspection", description: "We schedule a virtual or physical bathroom inspection depending on location and logistics. Our trained technicians finalise support placement." },
      { title: "Installation", description: "The selected package is installed with careful fitting, clean execution, and minimal disruption on a date scheduled with you." }
    ]
  },
  doctors: {
    eyebrow: "Doctor-Reviewed",
    heading: { text: "Doctor-Reviewed safety thinking", highlights: ["safety thinking"] },
    subtitle: "Medical input helps us plan safer routines. Mason-trained experts make the solution feel premium at home.",
    items: [
      {
        name: "Dr. Ashok Gupta",
        credentials: "MBBS (UCMS), MRSH (London)",
        meta: "40+ years of experience",
        quote: "For ageing adults, bathroom safety should focus on predictable support: standing, turning, sitting, bathing, and moving across wet areas. A well-planned home upgrade can support safer daily routines without making the space feel institutional.",
        photo: img("/prerna/images/dr-ashok-gupta.jpg", "Dr. Ashok Gupta")
      },
      {
        name: "Dr. Rajiv Goyal",
        credentials: "MBBS, MD - Dermatology, Venereology & Leprosy",
        meta: "Dermatologist · 22 years overall experience",
        quote: "Good preventive design respects both safety and dignity. The right bathroom changes should reduce avoidable risk while still feeling comfortable, clean, and appropriate for the home.",
        photo: img("/prerna/images/dr-rajiv-goyal.jpg", "Dr. Rajiv Goyal")
      },
      {
        name: "Dr. Prerna Goyal",
        credentials: "MBBS, DMRD, DNB",
        meta: "Radiologist · MAMC, Delhi University",
        quote: "Fall prevention begins with understanding daily movement. Support placement, slip-risk reduction, visibility, and ease of use all matter when designing safer spaces for older adults.",
        photo: img("/prerna/images/dr-prerna-goyal.jpg", "Dr. Prerna Goyal", "50% 22%")
      }
    ]
  },
  testimonials: {
    eyebrow: "Testimonials",
    heading: { text: "What families say after installation", highlights: ["families"] },
    subtitle: "Families choose Mason Company because the upgrade feels thoughtful, premium, and reassuring - not like a temporary hospital setup.",
    items: [
      { name: "Maria Pereira", relation: "Daughter", city: "Goa", quote: "We wanted the bathroom to be safer for my father, but we were worried it would look too clinical. Mason made the space feel more secure without changing the warmth of the home." },
      { name: "Rohan Naik", relation: "Son", city: "Goa", quote: "The process was clear from the first call. The team explained the package, inspected the bathroom, and installed everything neatly. My mother now has support exactly where she needs it." },
      { name: "Neha Shah", relation: "Daughter-in-law", city: "Goa", quote: "The biggest relief was not having to coordinate multiple vendors. Mason handled the planning, products, installation, and walkthrough as one complete solution." },
      { name: "Karl Fernandes", relation: "Son", city: "Goa", quote: "The before-and-after difference was obvious. The bathroom feels safer, but it still looks like a well-designed home bathroom, not a medical facility." }
    ]
  },
  faq: {
    eyebrow: "FAQ",
    heading: { text: "Questions, answered", highlights: ["answered"] },
    subtitle: "Everything about packages, booking, and installation. Still unsure? Request a visit and we'll talk it through.",
    items: [
      { question: "What does Mason Company do?", answer: "Mason Company upgrades existing bathrooms with grab support, anti-slip treatments and mats, shower seating, a Raised Toilet Seat, safer locks, edge and corner protection, drainage support, slippers, and reinforced fixture support." },
      { question: "Who is Mason Company for?", answer: "Mason is designed for families with ageing parents, seniors living independently, people with balance concerns, and households that want to reduce bathroom risk before an incident happens." },
      { question: "Do you renovate the entire bathroom?", answer: "No. Mason focuses on safety upgrades to the existing bathroom. Our installations do not require any renovation." },
      { question: "Will the bathroom look clinical?", answer: "No. Mason's solution is designed to feel premium and home-first. The goal is to improve safety while preserving the comfort and dignity of the space." },
      { question: "What packages do you offer?", answer: "Mason currently offers two packages: Standard at {standard_price} and Advanced at {advanced_price}. Both install the same complete kit. Advanced also includes a 2-Year Safety AMC: annual safety visits for 2 years after installation." },
      { question: "What is included in Standard?", answer: "Standard includes the complete 13-component kit: three vertical grab bars, one L / angled grab bar, one folding support bar, one anti-slip treatment, one shower mat, one post-shower mat, one shower stool, one Raised Toilet Seat, one two-way lock, one edge and corner protection treatment, four drainage supports, one pair of bathroom slippers, and one reinforced fixture support. Sensor lighting and SOS hardware are not included." },
      { question: "What is included in Advanced?", answer: "Advanced includes the same complete 13-component installation kit as Standard, plus a 2-Year Safety AMC: annual safety visits for 2 years after installation. We inspect the installed safety setup and fix, change or replace items where required." },
      { question: "Can I buy only one product, like a grab bar?", answer: "Mason is designed as a package-first service. We focus on complete bathroom safety coverage rather than isolated product installation." },
      { question: "How does booking work?", answer: "Leave your details and a Mason advisor will call to arrange the visit." },
      { question: "How can I pay?", answer: "Our team will confirm the package and payment details with you after your visit request." },
      { question: "Can I cancel after booking?", answer: "Yes. Full refund any time before installation." },
      { question: "Do you inspect the bathroom before installation?", answer: "Yes. Depending on location and logistics, Mason may complete a virtual or physical inspection before installation." },
      { question: "Who installs the package?", answer: "Mason-trained technicians handle the installation, site verification, fitting, and final handover." }
    ]
  },
  finalCta: {
    eyebrow: "Book Free Inspection",
    heading: { text: "Book the visit. We’ll handle the rest.", highlights: ["rest"] },
    subtitle: "Act before a fall changes everything. Leave your number and one accountable Mason team handles the rest.",
    ctaLabel: "Book Free Inspection",
    badges: ["Full refund any time before installation.", "Doctor-informed planning", "Trained Mason experts"],
    image: img("/prerna/images/shower-1.jpg", "A safer, calmer bathroom")
  }
};

export const fallbackComponents: ResolvedComponent[] = [
  { id: "vertical-grab-bars", title: "Vertical grab bars", category: "Grab support", quantity: 3, description: "Support placed at key standing and movement points.", image: img("/prerna/images/bath-3.jpg", "") },
  { id: "angled-grab-bar", title: "L / angled grab bar", category: "Grab support", quantity: 1, description: "Angled support for reaching and turning.", image: img("/prerna/images/bath-5.jpg", "") },
  { id: "folding-bar", title: "Flip-up / folding support bar", category: "Grab support", quantity: 1, description: "Foldable support where access and clearance matter.", image: img("/prerna/images/bath-1.jpg", "") },
  { id: "anti-slip-coating", title: "Anti-slip surface treatment", category: "Traction", quantity: 1, description: "Treatment for improved traction on existing surfaces.", image: img("/prerna/images/shower-3.jpg", "") },
  { id: "anti-slip-mat-shower", title: "Shower anti-slip mat", category: "Traction", quantity: 1, description: "Added grip in the shower zone.", image: img("/prerna/images/shower-4.jpg", "") },
  { id: "anti-slip-mat-post-shower", title: "Post-shower anti-slip mat", category: "Traction", quantity: 1, description: "Added grip where feet leave the shower.", image: img("/prerna/images/care-2.jpg", "") },
  { id: "shower-stool", title: "Shower seating stool", category: "Support", quantity: 1, description: "Seated support for showering.", image: img("/prerna/images/shower-2.jpg", "") },
  { id: "two-way-lock", title: "Two-way lock", category: "Safety", quantity: 1, description: "A lock designed for safer access and family response.", image: img("/prerna/images/detail-1.jpg", "") },
  { id: "corner-safety", title: "Edge & corner protection", category: "Protection", quantity: 1, description: "Protective cushioning for sharp edges and corners that could cause injury.", image: img("/prerna/images/bath-2.jpg", "") },
  { id: "drainage-solution", title: "Drainage support", category: "Hygiene", quantity: 4, description: "Drainage improvements without redesigning the bathroom.", image: img("/prerna/images/shower-1.jpg", "") },
  { id: "slippers-one", title: "Bathroom slippers", category: "Comfort", quantity: 1, description: "Bathroom-use slippers for steadier footing.", image: img("/prerna/images/care-1.jpg", "") },
  { id: "total-support-solution", title: "Reinforced fixture support", category: "Stability", quantity: 1, description: "Upgraded high-strength fixings for toilets and washbasins to improve stability and long-term support.", image: img("/prerna/images/bath-4.jpg", "") },
  { id: "raised-toilet-seat", title: "Raised Toilet Seat", category: "Support", quantity: 1, image: img("/images/stock-web/upgrades/upgrade-toilet-support.jpg", "") }
];

const allComponentIds = fallbackComponents.map((component) => component.id);

export const fallbackPlans: ResolvedPlan[] = [
  {
    code: "package-standard",
    slug: "standard",
    name: "Standard",
    badge: "The complete kit",
    titleDescriptor: "Everyday safety",
    bestFor: "The full safety upgrade, installed, inspected and handed over in one go.",
    outcome: "A complete everyday safety upgrade for steadier movement, better grip, and more confidence at home.",
    isPopular: true,
    priceInr: 29999,
    referencePriceInr: 35000,
    price: "₹29,999",
    referencePrice: "₹35,000",
    savings: "Core package",
    ctaLabel: "Book Standard",
    visualHighlights: ["Grab support", "Wet-zone grip", "Steadier movement"],
    componentIds: allComponentIds
  },
  {
    code: "package-advanced",
    slug: "advanced",
    name: "Advanced",
    badge: "2-Year Safety AMC Included",
    titleDescriptor: "Full Mason safety setup",
    bestFor: "Includes annual safety visits for 2 years after installation. We inspect the installed safety setup and fix, change or replace items where required.",
    outcome: "The same upgrade, looked after - so it stays as safe as the day it was fitted.",
    isPopular: false,
    priceInr: 36999,
    referencePriceInr: 44000,
    price: "₹36,999",
    referencePrice: "₹44,000",
    savings: "Premium package",
    ctaLabel: "Book Advanced",
    visualHighlights: ["Same complete kit", "Home-first finish", "2-Year Safety AMC"],
    componentIds: allComponentIds
  }
];

export const fallbackPackages: PackagesContent = {
  plans: fallbackPlans,
  components: fallbackComponents,
  rows: [
    { label: "{count} safety upgrades installed", standard: true, advanced: true },
    { label: "Installed by trained Mason experts", standard: true, advanced: true },
    { label: "Inspection and final walkthrough", standard: true, advanced: true },
    { label: "2-Year Safety AMC Included", standard: false, advanced: true }
  ],
  popularLabel: "Most popular",
  homeCardCta: "View Details",
  pageCardCta: "Book Free Inspection"
};

export const fallbackPackagesPage: PackagesPageContent = {
  eyebrow: "Free & no obligation",
  heading: { text: "Book a free bathroom inspection.", highlights: ["free"] },
  subcopy: "We walk the bathroom with you first, then recommend Standard or Advanced. Full refund any time before installation.",
  scrollCue: "Or choose a package now",
  image: img("/prerna/images/bath-2.jpg", "A bathroom after a Mason safety install"),
  chooseLabel: "Choose a package",
  chooseNote: "Same for both packages",
  kitCue: "See what gets installed",
  kitHeading: "What we install",
  kitNote: "Identical in both packages",
  kitFootnote: "All {count} are fitted, tested and handed over on the same visit - there is no shorter version of the kit."
};

export const fallbackContactPage: ContactPageContent = {
  eyebrow: "Contact",
  heading: { text: "Tell us about the bathroom.", highlights: ["bathroom"] },
  intro: "Send us the details and a Mason advisor calls you back within 24 hours - to answer questions, or to arrange a free inspection.",
  image: img("/prerna/images/care-3.jpg", "An older couple holding hands"),
  cardTitle: "The visit is free",
  cardBody: "A trained Mason expert walks the bathroom with you. No obligation, no charge.",
  callLabel: "Call & WhatsApp",
  hoursLabel: "When we answer",
  emailLabel: "Write to us"
};
