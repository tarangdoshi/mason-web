import type { KnowledgeDoc, KnowledgeSection } from "@/components/KnowledgePage";

/*
 * /bathroom-safety-assessment — Mason's service page for the free bathroom safety inspection in Goa.
 * Statements are Mason facts (site FAQ, process, packages, /why method, founder-verified doctor and
 * customer input), practical bathroom-safety reasoning, or cited figures from content/evidence.
 * CMS-owned values (prices, kit components, process steps, testimonials, doctor quotes) are passed in
 * from Sanity rather than written here, so the page cannot drift from the rest of the site.
 */
type Voice = { quote: string; name: string; meta?: string };

export type AssessmentFacts = {
  standardPrice: string;
  advancedPrice: string;
  componentCount: number;
  processSteps: { title: string; description: string }[];
  components?: { title: string; description?: string }[];
  doctors?: Voice[];
  testimonials?: Voice[];
};

export function assessmentDoc(facts: AssessmentFacts): KnowledgeDoc {
  const components = facts.components ?? [];
  const doctors = facts.doctors ?? [];
  const testimonials = facts.testimonials ?? [];

  const sections: (KnowledgeSection | null)[] = [
    {
      id: "who-it-is-for",
      heading: "Who a bathroom safety assessment is for",
      blocks: [
        { p: "Families with ageing parents, seniors living independently, people with balance concerns, and anyone who wants to make a bathroom safer before a fall rather than after one. Nothing needs to have gone wrong first. It is especially worth booking if:" },
        { list: [
          "your parent has had a fall or a near-miss, or has recently come home from hospital;",
          "they hold on to the basin, a towel rail or the door to steady themselves;",
          "getting up from the toilet or stepping out of the shower has become slower or harder;",
          "they bathe alone, or live on their own while family is in another city or abroad."
        ] }
      ]
    },
    {
      id: "observe-first",
      heading: "Observe first. Recommend second. Sell last.",
      blocks: [
        { p: "That is the order Mason works in. A bathroom is only unsafe in relation to the person using it: the same step, floor or toilet can be fine for one parent and a daily risk for another. So we start by watching how the room is used, explain what we see, and only then recommend what would help." }
      ]
    },
    {
      id: "what-we-observe",
      heading: "What we check in your parent's bathroom",
      blocks: [
        { p: "We walk through the same trip your parent makes several times a day, moment by moment ([why these five moments matter](/why)):" },
        { list: [
          "Stepping in - the threshold and the first metre of floor, where it is often wet and there is nothing to hold.",
          "Turning around - how much room there is, and whether there is support within reach mid-turn.",
          "Sitting and standing - the height of the toilet and what your parent holds on to while lowering and rising.",
          "Showering - whether bathing happens standing on wet tile, and whether a shower seat would make it steadier.",
          "The walk back - lighting on the way, especially at night, and whether the floor is still wet."
        ] },
        { p: "We also look at the room itself: how slippery the floor is when wet, where water collects, sharp edges and corners, the door lock, and whether the walls can take a properly fixed support." }
      ]
    },
    {
      id: "why-individual-assessment",
      heading: "Why an individual assessment matters",
      blocks: [
        { p: "Grab bars should not simply go at a standard height from a catalogue. Published heights come from accessibility rules for public buildings; in a home, the right position depends on the person. Mason plans support around your parent: their height and reach, how they stand, turn, sit and bathe, the layout of the bathroom, what the walls can hold, and what we observe during the assessment." },
        { p: "Placement is informed by doctor input and confirmed by a Mason technician on site before anything is fixed. The hardware is selected for safety-critical use - it is there to take your parent's weight, not to hang a towel." },
        { p: "That is also why a single grab bar bought online rarely solves the problem. It covers one spot, its height is guesswork, and no one checks the wall behind the tile - while the other four moments stay untouched. Mason is package-first for that reason: the whole visit to the bathroom is covered, installed and owned end to end by one accountable team." }
      ]
    },
    components.length
      ? {
          id: "what-we-install",
          heading: "Bathroom safety modifications Mason installs",
          blocks: [
            { p: `Every Mason package installs the same complete ${facts.componentCount}-component kit, fitted by Mason-trained technicians with no renovation:` },
            { list: components.map((item) => (item.description ? `${item.title} - ${item.description}` : item.title)) },
            { p: "See exactly what each package includes: the [Standard bathroom safety package](/packages/standard) and the [Advanced package with a 2-Year Safety AMC](/packages/advanced)." }
          ]
        }
      : null,
    {
      id: "how-it-works",
      heading: "How the assessment works",
      blocks: [{ steps: facts.processSteps.map((step) => ({ title: step.title, text: step.description })) }]
    },
    {
      id: "after-the-assessment",
      heading: "What happens after the assessment",
      blocks: [
        { p: `We recommend one of two packages. Standard is ${facts.standardPrice}; Advanced is ${facts.advancedPrice} and adds a 2-Year Safety AMC - annual safety visits for two years after installation, where we inspect the setup and fix, change or replace items where required. [Compare the bathroom safety packages](/packages).` },
        { p: "Our team confirms the package and payment details with you after your visit request. If you change your mind, there is a full refund any time before installation." }
      ]
    },
    doctors.length
      ? {
          id: "doctor-input",
          heading: "Doctor input behind the approach",
          blocks: [{ p: "Mason's method is shaped with input from doctors. In their words:" }, { quotes: doctors }]
        }
      : null,
    testimonials.length
      ? {
          id: "families",
          heading: "What families say",
          blocks: [{ quotes: testimonials }]
        }
      : null,
    {
      id: "what-it-is-not",
      heading: "What the assessment is not",
      blocks: [
        { p: "It is a home safety assessment, not a medical one. Mason does not diagnose or treat, and no service can promise that a fall will never happen. If your parent has fallen, feels dizzy or has new trouble with balance, eyesight or medicines, speak to their doctor as well." }
      ]
    },
    {
      id: "why-it-matters",
      heading: "Why bathroom fall prevention matters",
      blocks: [
        { p: "In India, about 1 in 8 adults aged 60 and over reported a fall in the two years before the national LASI survey, and across Indian studies most older adults who fell were injured. In a study of 198 older adults' bathrooms in Ahmedabad, 97% had no grab bars. The good news: in randomised trials, home fall-hazard programmes reduced the rate of falls by about a quarter overall, and by more for people already at higher risk. [See the evidence and sources](/evidence), or start with our [bathroom safety checklist for elderly parents](/guides/bathroom-safety-for-elderly-parents)." }
      ]
    }
  ];

  return {
    breadcrumb: "Bathroom safety assessment",
    eyebrow: "Free inspection · Goa",
    title: "Bathroom safety assessment in Goa for ageing parents",
    intro:
      "Mason Company inspects the bathroom your parent actually uses, watches how they move in it, and recommends the changes that would make it safer - grab bars where they are needed, anti-slip floors, safer bathing and toilet support. The inspection is free, and you decide what happens next.",
    topCta: true,
    summary: [
      { term: "What it is", detail: "A free, in-home bathroom safety inspection for ageing parents by Mason Company, a bathroom safety company serving families in Goa, India." },
      { term: "What we look at", detail: "The five moments of every bathroom visit - stepping in, turning around, sitting and standing, showering, and the walk back - and the room itself: floor grip, water, walls, edges, lighting and the lock." },
      { term: "What you get", detail: `A clear explanation of the risks and a recommendation: the Standard package (${facts.standardPrice}) or Advanced (${facts.advancedPrice}, with a 2-Year Safety AMC). You decide, and there is a full refund any time before installation.` },
      { term: "Where", detail: "Homes across Goa. If you are outside Goa, we still keep your request as we expand to more locations." }
    ],
    sections: sections.filter((section): section is KnowledgeSection => section !== null),
    cta: {
      heading: "Book a free bathroom safety assessment",
      text: "Leave your details and a Mason advisor will call to arrange the visit. Mason currently provides installations in Goa.",
      label: "Book Free Inspection",
      secondary: { label: "See the packages", href: "/packages" }
    }
  };
}
