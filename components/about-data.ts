/* Every word on /about, kept out of the markup so the page file stays a
   layout and the team can edit copy without reading JSX.

   Copy is the team's, verbatim, apart from two things flagged in the About
   build notes: the mono chapter labels on the story beats, and the credential
   chips, which are lifted out of the "Why We Are Built For This" prose so the
   named companies can carry their weight visually instead of sitting mid
   sentence. */

export const STORY: { label: string; body: string }[] = [
  {
    label: "2013",
    body: "Tarang Doshi and Pranay Gupta have known each other since 2013. Over the years, they had both built, advised, and worked with businesses across consumer products, startups, operations, and early-stage company building. But Mason Company did not begin as a business idea. It began as a conversation between two people who had seen the same problem from very close quarters.",
  },
  {
    label: "A catch-up in Goa",
    body: "During a catch-up in Goa, Pranay spoke about elder care and how badly families can suffer after a fall at home. Tarang had experienced something similar when his father slipped, after which he had to find and put together safety solutions himself. Both had seen the emotional weight of the problem. Both had tried to solve it in their own way. And when they discussed it together, one thing became clear: this was not an isolated family concern. It was a much larger gap.",
  },
  {
    label: "After the fall",
    body: "Most families only begin looking for support after something has already gone wrong. A fall. A fracture. A hospital visit. A painful recovery. Until then, the bathroom often feels ordinary, even though it may be one of the most unsafe rooms for an ageing parent.",
  },
  {
    label: "The same gap, everywhere",
    body: "When Tarang and Pranay spoke to more friends and family, the same pattern kept coming up. Adult children were worried, but did not know what to install, whom to trust, how to plan it, or how to make the bathroom safer without making it look like a hospital. There was no clear preventive care solution. There were products. There were vendors. There was advice. But there was no complete, reliable, premium solution designed for Indian homes.",
  },
];

/* Three refusals then the promise — set as a list so the parallel structure the
   team wrote is visible instead of buried in a paragraph. */
export const STANDARD = {
  refusals: [
    "It should not feel like a compromise.",
    "It should not look temporary.",
    "It should not depend on guesswork or fragmented vendors.",
  ],
  promise:
    "It should be thoughtfully planned, medically informed, carefully installed, and finished in a way that still belongs in a beautiful home.",
};

export const FOUNDERS: {
  name: string;
  initials: string;
  role: string;
  bio: string;
  credentials: string[];
  photo?: string;
  photoLabel: string;
}[] = [
  {
    name: "Tarang Doshi",
    initials: "TD",
    role: "Co-founder, Mason Company",
    bio: "Tarang brings a product, brand, and customer-experience lens to Mason Company. Having built consumer brands and worked across product-led businesses, he focuses on making Mason feel trustworthy, premium, and deeply human for families making an important decision.",
    credentials: [
      "Built Pilcrow Spirits",
      "Built Terry Sent Me!",
      "Consumer and enterprise products",
      "Brand positioning",
      "Customer experience",
    ],
    photoLabel: "Portrait — Tarang Doshi",
  },
  {
    name: "Pranay Gupta",
    initials: "PG",
    role: "Co-founder, Mason Company",
    bio: "Pranay brings startup-building, investment, and operating experience to Mason Company. As a co-founder of 91springboard and a long-time supporter of early-stage companies, he focuses on building Mason as a scalable, reliable, and accountable service for Indian families.",
    credentials: [
      "Co-founder, 91springboard",
      "CIIE, IIM Ahmedabad",
      "Supporting and investing in early-stage companies in India",
    ],
    photoLabel: "Portrait — Pranay Gupta",
  },
];

/* "a service company built around trust: clear packages, trained experts, …" */
export const TRUST = [
  "Clear packages",
  "Trained experts",
  "Doctor-informed thinking",
  "Premium components",
  "Accountable installation",
  "A calmer journey for families",
];

/* "entering, turning, sitting, standing, showering, night-time use, wet zones,
   support points, drainage, and visibility" — broken out of the sentence so the
   scope of the work can be scanned rather than read. */
export const ROUTINE = [
  "Entering",
  "Turning",
  "Sitting",
  "Standing",
  "Showering",
  "Night-time use",
  "Wet zones",
  "Support points",
  "Drainage",
  "Visibility",
];

/* The three "to" clauses of the goal paragraph, verbatim, given a column each.
   Only the labels above them are ours. */
export const GOALS = [
  {
    label: "Adult children",
    body: "To give adult children a clear place to go.",
  },
  {
    label: "Parents",
    body: "To give parents safer daily movement.",
  },
  {
    label: "Families",
    body: "And to make sure families do not have to wait for a fall before they take action.",
  },
];
