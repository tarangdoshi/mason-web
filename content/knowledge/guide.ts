import type { KnowledgeDoc } from "@/components/KnowledgePage";

/*
 * /guides/bathroom-safety-for-elderly-parents — a practical guide for families in India.
 * Evidence statements are limited to what the cited sources state (see content/evidence and
 * docs/seo/PHASE2_EVIDENCE.md); anything that is Mason's own practice is labelled as such. No universal
 * grab-bar heights: placement depends on the person and the wall, which is why it is set on site.
 */
export const GUIDE_PUBLISHED = "2026-10-06";

export const guideSources = [
  { label: "Associations between intrinsic capacity, functional difficulty, and fall outcomes among older adults in India (Scientific Reports, 2023)", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10276857/", note: "analysis of LASI Wave 1, 2017-18: 12.36% of adults aged 60+ reported a fall and 5.57% a fall-related injury in the previous two years" },
  { label: "Health Consequences of Falls among Older Adults in India: A Systematic Review and Meta-Analysis (Geriatrics, 2023)", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10137587/", note: "pooled prevalence of injury among older adults who fell: 65.63%, with a wide confidence interval" },
  { label: "Bathroom hazards among older adults in western India: a cross-sectional study (Asian Journal of Gerontology and Geriatrics, 2015)", href: "https://researcher.manipal.edu/en/publications/bathroom-hazards-among-older-adults-in-western-india-a-cross-sect/", note: "198 bathrooms in Ahmedabad: grab bars absent in 97%, slippery floor 91.9%, inadequate lighting 94.4%; every bathroom had at least 7 hazards" },
  { label: "Environmental interventions for preventing falls in older people living in the community (Cochrane Review, 2023)", href: "https://doi.org/10.1002/14651858.CD013258.pub2", note: "home fall-hazard interventions reduced the rate of falls by 26% overall and 38% in people at higher risk; 22 trials, 10 countries" },
  { label: "WHO Falls fact sheet", href: "https://www.who.int/news-room/fact-sheets/detail/falls", note: "falls are the second leading cause of unintentional injury death worldwide; adults over 60 suffer the greatest number of fatal falls" }
];

export const guideDoc: KnowledgeDoc = {
  breadcrumb: "Bathroom safety for elderly parents",
  eyebrow: "Guide · India",
  title: "Bathroom safety for elderly parents in India: what to check, and when to get help",
  intro:
    "A practical guide for families: why the bathroom deserves attention, what you can observe yourself in ten minutes, and which changes need a proper assessment. It separates what research shows from what Mason does in practice.",
  updated: "6 October 2026",
  summary: [
    { term: "The risk", detail: "About 1 in 8 Indians aged 60 and over reported a fall in the previous two years (LASI Wave 1), and across Indian studies most older adults who fell were injured." },
    { term: "The bathroom", detail: "In a study of 198 older adults' bathrooms in Ahmedabad, 97% had no grab bars and 92% had a slippery floor; every bathroom had at least seven hazards." },
    { term: "What helps", detail: "In randomised trials, mostly outside India, home fall-hazard programmes reduced falls by about a quarter - more for people at higher risk." },
    { term: "Where to start", detail: "Watch one ordinary visit to the bathroom using the five moments below, then make the simple fixes. Get a professional assessment after a fall, a hospital stay, or a new difficulty with walking or daily tasks - in Goa, Mason does this for free." }
  ],
  sections: [
    {
      id: "why-the-bathroom",
      heading: "Why bathroom safety matters for elderly parents",
      blocks: [
        { p: "Falls are common among older Indians: in the national Longitudinal Ageing Study in India (LASI, 2017-18), 12.4% of adults aged 60 and over reported a fall in the previous two years, and 5.6% a fall-related injury. A review of Indian studies found that most older adults who fell were injured (a pooled 65.6%, with wide variation between studies)." },
        { p: "Indian bathrooms concentrate several hazards in one small, often wet room. When researchers in Ahmedabad inspected 198 bathrooms used by adults aged 60+, 97% had no grab bars, 91.9% had a slippery floor and 94.4% had inadequate lighting - and every one had at least seven hazards. That is one city, but the pattern will be familiar to many families." },
        { p: "The encouraging part: a 2023 Cochrane review of 22 trials found that programmes which assess and reduce hazards at home lowered the rate of falls by 26% overall, and by 38% for people at higher risk of falling. Most trials were outside India, so treat these as a direction rather than a promise for any one home. [More on the evidence](/evidence)." }
      ]
    },
    {
      id: "five-moments",
      heading: "Watch one bathroom visit: the five risky moments",
      blocks: [
        { p: "Mason's method is to observe before recommending anything. You can do a simple version yourself: watch (or ask about) one ordinary trip to the bathroom and notice what happens at each of these moments." },
        { list: [
          "Stepping in. Is the floor at the door already wet? Is there a step or raised threshold? What does your parent reach for as they enter?",
          "Turning around. Is there space to turn without twisting on a wet floor? Is anything firm within reach mid-turn?",
          "Sitting and standing. How do they lower onto the toilet and get back up? Do they push on the seat, the basin or a towel rail?",
          "Showering. Do they bathe standing, on one leg at a time, with eyes shut against soap? Is there anywhere safe to sit?",
          "The walk back. Is there light on the way at night? Is the floor still wet when they come back to use it again?"
        ] },
        { p: "Basins, taps, towel rails and doors are not designed to take a person's weight. If your parent uses them for support, that is a sign of where proper support is missing." }
      ]
    },
    {
      id: "ten-minute-check",
      heading: "A ten-minute bathroom safety checklist for this week",
      blocks: [
        { list: [
          "Grip: wet the floor where your parent stands to bathe and where they step out. How slippery is it?",
          "Water: does water pool anywhere after a bath, or spread to the door?",
          "Support: is there anything fixed and strong to hold at the entrance, beside the toilet and in the bathing area?",
          "Seating: is there a stable seat for bathing if standing is tiring?",
          "Toilet: is getting up from the toilet a struggle?",
          "Light: can your parent see the floor clearly, including at night on the way to the bathroom?",
          "Edges and access: are there sharp corners at hip or head height? Could someone get in quickly if the door is locked?",
          "Footwear: are the slippers they wear in the bathroom secure on a wet floor?"
        ] },
        { p: "Small fixes - better light on the route, clearing the floor - you can make straight away. Anything that has to be fixed to a wall or changes how the floor grips is worth doing properly." }
      ]
    },
    {
      id: "modifications",
      heading: "Bathroom modifications for elderly parents: what helps",
      blocks: [
        { p: "Most senior bathroom safety changes need no renovation. Matched to what you saw in the five moments, these are the ones that make the biggest everyday difference:" },
        { list: [
          "[Grab bars](/solutions/grab-bars) at the points where your parent stands, turns, sits and steps - fixed into a wall that can hold them.",
          "[Anti-slip treatment](/solutions/anti-slip-bathroom) on the existing floor, plus anti-slip mats in the shower and where feet leave it.",
          "A stable [shower stool for seated bathing](/solutions/safer-bathing), so bathing does not mean balancing on one leg on wet tile.",
          "[Toilet support](/solutions/toilet-safety): a raised toilet seat and a support bar within reach for sitting and standing.",
          "Motion-triggered night lighting on the way to the bathroom and inside it.",
          "Edge and corner guards, better drainage so water does not linger, and a lock that family can open from outside in an emergency.",
          "Bathroom slippers that grip on a wet floor."
        ] },
        { p: "The order and placement matter as much as the items. That is what an assessment is for: deciding which changes your parent actually needs, and where." }
      ]
    },
    {
      id: "grab-bars",
      heading: "Grab bars for elderly parents: placement depends on the person and the wall",
      blocks: [
        { p: "Grab bars help most where your parent stands, turns, sits and steps over something. But there is no single right height for every home: published heights come from accessibility rules written for public buildings, while at home the right position depends on your parent's height, reach and the way they move." },
        { p: "The wall matters as much as the bar. A bar is only as strong as what it is fixed into, and the wall behind tile is not always solid. In Mason's practice, placement is informed by doctor input and by watching how your parent actually moves, and is finalised by a technician on site before anything is fixed. Mason uses support hardware selected for safety-critical use - a grab bar has to take a person's full weight, which towel rails and suction-cup handles are not built for. [More on grab bar types and placement](/solutions/grab-bars)." }
      ]
    },
    {
      id: "wet-floors-and-bathing",
      heading: "Anti-slip floors, safe bathing and toilet support",
      blocks: [
        { p: "In the Ahmedabad study, 92% of bathrooms had a slippery floor. Practical responses include an anti-slip treatment on the existing floor, mats where feet are wet (in the shower and where your parent steps out), better drainage so water does not linger, and bathroom slippers that grip." },
        { p: "Bathing seated on a stable shower stool removes the need to balance on one leg on wet tile. For the toilet, a raised seat and a support bar within reach can make sitting and standing easier. If getting up has become hard, it is also worth mentioning to your parent's doctor or a physiotherapist." },
        { p: "In more detail: [anti-slip bathroom floors](/solutions/anti-slip-bathroom), [safer bathing and seated showering](/solutions/safer-bathing) and [toilet safety](/solutions/toilet-safety)." }
      ]
    },
    {
      id: "when-to-get-help",
      heading: "Bathroom fall prevention: when to get a professional assessment",
      blocks: [
        { p: "The Cochrane review found home-hazard programmes worked best for people at higher risk of falling - for example, someone who has fallen in the past year, has recently been in hospital, or needs help with daily activities. Those are good moments to have the bathroom assessed rather than waiting." },
        { p: "Some causes of falls are medical: changes in balance, eyesight, blood pressure or medicines. A home assessment does not replace a conversation with your parent's doctor." }
      ]
    },
    {
      id: "mason-in-goa",
      heading: "Bathroom safety for ageing parents in Goa: how Mason helps",
      blocks: [
        { p: "If your family is in Goa, you do not have to work out every change yourself. Mason Company offers a free [bathroom safety assessment in Goa](/bathroom-safety-assessment): we observe the five moments in your parent's bathroom, explain what we see, and recommend what would help. If you go ahead, Mason-trained technicians install a complete kit - grab support, anti-slip treatment and mats, a shower stool, a raised toilet seat and more - with no renovation." },
        { p: "Compare the [Standard bathroom safety package](/packages/standard) with the [Advanced package, which adds a 2-Year Safety AMC](/packages/advanced), or read [why Mason plans support around how your parent moves](/why)." }
      ]
    }
  ],
  sources: guideSources,
  cta: {
    heading: "Want a second pair of eyes on the bathroom?",
    text: "Mason's inspection is free, and you decide what happens next. Mason currently provides installations in Goa.",
    label: "Book Free Inspection",
    secondary: { label: "How the assessment works", href: "/bathroom-safety-assessment" }
  }
};
