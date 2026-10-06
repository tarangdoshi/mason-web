import type { KnowledgeDoc } from "@/components/KnowledgePage";

/*
 * /bathroom-safety-assessment — Mason's service page for the free bathroom safety inspection in Goa.
 * Every statement here is a published Mason fact (site FAQ, process, packages, /why framework) or a
 * cited external figure from content/evidence. CMS-owned values (prices, kit size, process steps) are
 * passed in from Sanity rather than written here, so the page cannot drift from the rest of the site.
 */
export type AssessmentFacts = {
  standardPrice: string;
  advancedPrice: string;
  componentCount: number;
  processSteps: { title: string; description: string }[];
};

export function assessmentDoc(facts: AssessmentFacts): KnowledgeDoc {
  return {
    breadcrumb: "Bathroom safety assessment",
    eyebrow: "Free inspection · Goa",
    title: "Bathroom safety assessment in Goa",
    intro:
      "Before Mason recommends anything, we look at the bathroom your parent actually uses - and how they move in it. The inspection is free, and you decide what happens next.",
    summary: [
      { term: "What it is", detail: "A free inspection of an ageing parent's bathroom by Mason Company, a bathroom safety company serving families in Goa, India." },
      { term: "What we look at", detail: "The five moments of every bathroom visit - stepping in, turning around, sitting and standing, showering, and the walk back - and the room itself." },
      { term: "What you get", detail: `A recommendation: the Standard package (${facts.standardPrice}) or Advanced (${facts.advancedPrice}, with a 2-Year Safety AMC). You decide, and there is a full refund any time before installation.` },
      { term: "Where", detail: "Goa. If you are outside Goa, we still keep your request as we expand to more locations." }
    ],
    sections: [
      {
        id: "who-it-is-for",
        heading: "Who the assessment is for",
        blocks: [
          { p: "Families with ageing parents, seniors living independently, people with balance concerns, and households that want to reduce bathroom risk before an incident happens. Nothing needs to have gone wrong first." }
        ]
      },
      {
        id: "observe-first",
        heading: "Observe first. Recommend second. Sell last.",
        blocks: [
          { p: "That is the order Mason works in. A bathroom is only unsafe in relation to the person using it: the same step, floor or toilet can be fine for one parent and a daily risk for another. So we start by watching how the room is used, explain what we see, and only then suggest what would help." }
        ]
      },
      {
        id: "what-we-observe",
        heading: "What we observe",
        blocks: [
          { p: "We walk through the same trip your parent makes several times a day, moment by moment ([why these five](/why)):" },
          { list: [
            "Stepping in - the threshold and the first metre of floor, where it is often wet and there is nothing to hold.",
            "Turning around - how much room there is, and whether there is support within reach mid-turn.",
            "Sitting and standing - the height of the toilet and what your parent holds on to while lowering and rising.",
            "Showering - whether bathing happens standing on wet tile, and whether a seat would make it steadier.",
            "The walk back - lighting on the way, and whether the floor is still wet at night."
          ] },
          { p: "We also look at the room itself: how slippery the floor is when wet, where water collects, sharp edges and corners, the door lock, and whether the walls can take a properly fixed support. Final support placement is confirmed by a Mason technician on site." }
        ]
      },
      {
        id: "how-it-works",
        heading: "How it works",
        blocks: [{ steps: facts.processSteps.map((step) => ({ title: step.title, text: step.description })) }]
      },
      {
        id: "after-the-assessment",
        heading: "What happens after the assessment",
        blocks: [
          { p: `We recommend one of two packages. Both install the same complete ${facts.componentCount}-component kit, fitted and handed over by Mason-trained technicians, with no renovation. Standard is ${facts.standardPrice}; Advanced is ${facts.advancedPrice} and adds a 2-Year Safety AMC - annual safety visits for two years after installation, where we inspect the setup and fix, change or replace items where required. [Compare the packages](/packages).` },
          { p: "Our team confirms the package and payment details with you after your visit request. If you change your mind, there is a full refund any time before installation." }
        ]
      },
      {
        id: "what-it-is-not",
        heading: "What the assessment is not",
        blocks: [
          { p: "It is a home safety assessment, not a medical one. Mason does not diagnose or treat, and no service can guarantee a fall-free outcome. If your parent has fallen, feels dizzy or has new trouble with balance, eyesight or medicines, speak to their doctor as well." }
        ]
      },
      {
        id: "why-not-buy-a-grab-bar",
        heading: "Why not just buy a grab bar online?",
        blocks: [
          { p: "A single bar covers a single spot. Without an assessment, its height is guesswork and no one checks whether the wall behind the tile can hold it - and the other four moments stay untouched. Mason is package-first for that reason: the aim is to cover the whole visit to the bathroom, installed and owned end to end by one accountable team." }
        ]
      },
      {
        id: "why-it-matters",
        heading: "Why it matters",
        blocks: [
          { p: "In India, about 1 in 8 adults aged 60 and over reported a fall in the two years before the national LASI survey, and across Indian studies most older adults who fell were injured. In randomised trials - mostly outside India - home fall-hazard programmes reduced the rate of falls by about a quarter, and by more for people already at higher risk. [See the evidence and sources](/evidence), or read [what to check in an elderly parent's bathroom](/guides/bathroom-safety-for-elderly-parents)." }
        ]
      }
    ],
    cta: {
      heading: "Book a free bathroom inspection",
      text: "Leave your details and a Mason advisor will call to arrange the visit. Mason currently provides installations in Goa.",
      label: "Book Free Inspection",
      secondary: { label: "See the packages", href: "/packages" }
    }
  };
}
