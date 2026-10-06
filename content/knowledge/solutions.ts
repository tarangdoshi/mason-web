import type { KnowledgeBlock, KnowledgeDoc, KnowledgeSection } from "@/components/KnowledgePage";

/*
 * /solutions/* — practical pages for the four bathroom problems families most often search for.
 * Each one explains the problem, what Mason looks at during the inspection and what Mason installs.
 * Mason method and kit facts come from the site (FAQ, /why, packages) and Sanity; practical
 * reasoning is written as such; figures are limited to sources already in content/evidence.
 * CMS-owned values (prices, kit components and their photos) are passed in, never written here.
 * The information applies to families anywhere in India; installation is Goa only, and every page
 * says so.
 */
export type SolutionSlug = "grab-bars" | "anti-slip-bathroom" | "safer-bathing" | "toilet-safety";

export type SolutionComponent = {
  id: string;
  title: string;
  quantity?: number;
  description?: string;
  image: { src: string; alt: string };
};

export type SolutionFacts = {
  standardPrice: string;
  advancedPrice: string;
  componentCount: number;
  components: SolutionComponent[];
};

/** The four solution pages, in the order they are linked everywhere. */
export const SOLUTIONS: { slug: SolutionSlug; name: string; anchor: string; summary: string }[] = [
  { slug: "grab-bars", name: "Grab bars", anchor: "Grab bars for elderly parents", summary: "where support goes, which bar fits which spot, and why placement depends on the person and the wall" },
  { slug: "anti-slip-bathroom", name: "Anti-slip bathroom floors", anchor: "Anti-slip bathroom floors", summary: "making wet tile safer to walk on without re-tiling" },
  { slug: "safer-bathing", name: "Safer bathing", anchor: "Safer bathing and seated showering", summary: "a stable shower seat, support within reach and a setup that suits how your parent bathes" },
  { slug: "toilet-safety", name: "Toilet safety", anchor: "Toilet safety and sit-to-stand support", summary: "support for sitting down and standing up, day and night" }
];

export const solutionPath = (slug: SolutionSlug) => `/solutions/${slug}`;

/* Alt text describes each genuine Mason kit photo as it actually appears (product shots, not installs). */
const PHOTO_ALT: Record<string, string> = {
  "vertical-grab-bars": "Straight grab bar with a dark finish",
  "angled-grab-bar": "Angled stainless-steel grab bar",
  "folding-bar": "Flip-up folding support bar with its wall plate",
  "shower-stool": "Round shower stool with height-adjustable legs and rubber feet",
  "anti-slip-mat-shower": "Grey textured anti-slip mat, partly rolled out",
  "anti-slip-mat-post-shower": "Grey patterned bathroom mat on a wooden floor",
  "raised-toilet-seat": "White raised toilet seat with lid",
  "total-support-solution": "Heavy-duty fixing anchors in their box",
  "two-way-lock": "Two dark lever door handles"
};

function figures(facts: SolutionFacts, ids: string[]): KnowledgeBlock | null {
  const items = ids
    .map((id) => facts.components.find((component) => component.id === id))
    // Only photos uploaded to Mason's Sanity library: bundled fallback images are not Mason product shots.
    .filter((component): component is SolutionComponent => Boolean(component && component.image.src.startsWith("https://cdn.sanity.io/") && PHOTO_ALT[component.id]))
    .map((component) => ({
      src: component.image.src,
      alt: PHOTO_ALT[component.id],
      caption: component.quantity && component.quantity > 1 ? `${component.title} (${component.quantity} in every kit)` : component.title
    }));
  return items.length ? { figures: items } : null;
}

function kitList(facts: SolutionFacts, ids: string[]): string[] {
  return ids
    .map((id) => facts.components.find((component) => component.id === id))
    .filter((component): component is SolutionComponent => Boolean(component))
    .map((component) => {
      const count = component.quantity && component.quantity > 1 ? `${component.quantity} × ` : "";
      return component.description ? `${count}${component.title} - ${component.description}` : `${count}${component.title}`;
    });
}

function packagesParagraph(facts: SolutionFacts): KnowledgeBlock {
  return {
    p: `These are part of the same complete ${facts.componentCount}-component kit in both Mason packages, so the rest of the bathroom is covered too. [Standard](/packages/standard) is ${facts.standardPrice}; [Advanced](/packages/advanced) is ${facts.advancedPrice} and adds a 2-Year Safety AMC - annual visits where we inspect the setup and fix, change or replace items where required. Everything is fitted by Mason-trained technicians, with no renovation.`
  };
}

function related(current: SolutionSlug): KnowledgeSection {
  return {
    id: "related",
    heading: "Related",
    blocks: [{
      list: [
        ...SOLUTIONS.filter((item) => item.slug !== current).map((item) => `[${item.anchor}](${solutionPath(item.slug)}) - ${item.summary}.`),
        "[Bathroom safety for elderly parents in India](/guides/bathroom-safety-for-elderly-parents) - a ten-minute check you can do yourself.",
        "[Evidence on falls in India](/evidence) - the research behind the risks, with sources."
      ]
    }]
  };
}

const goaCta = (heading: string): KnowledgeDoc["cta"] => ({
  heading,
  text: "Mason's inspection is free, and you decide what happens next. Mason currently provides installations in Goa.",
  label: "Book Free Inspection",
  secondary: { label: "How the assessment works", href: "/bathroom-safety-assessment" }
});

const parent = { label: "Bathroom safety assessment", href: "/bathroom-safety-assessment" };

function compact(sections: (KnowledgeSection | null)[]): KnowledgeSection[] {
  return sections.filter((section): section is KnowledgeSection => section !== null);
}

function withPhotos(section: KnowledgeSection, photos: KnowledgeBlock | null): KnowledgeSection {
  return photos ? { ...section, blocks: [...section.blocks, photos] } : section;
}

/* ------------------------------------------------------------------ grab bars */

function grabBars(facts: SolutionFacts): KnowledgeDoc {
  return {
    breadcrumb: "Grab bars",
    parent,
    eyebrow: "Solutions · Grab bars",
    title: "Grab bars for elderly parents: where they go, and why placement matters",
    intro:
      "A grab bar is the simplest support in a bathroom, and the one most often put in the wrong place. This page explains where bars usually help an older person, which type suits which spot, and why the right position depends on your parent and the wall - not on a standard height.",
    topCta: true,
    topLink: { label: "What we check at the inspection", href: "#inspection" },
    summary: [
      { term: "What they are for", detail: "Something fixed and strong to hold at the moments your parent's balance is tested: stepping in, turning, sitting down, standing up and bathing." },
      { term: "Where they usually help", detail: "Beside the toilet, at the shower or bathing area, and at the bathroom entrance - the same places older adults tend to reach for a towel rail, basin or door instead." },
      { term: "Why placement varies", detail: "Height, reach, the stronger hand, how your parent rises and the layout of the room all change the right position. So does what the wall behind the tile can hold." },
      { term: "In Goa", detail: "Mason inspects the bathroom for free, recommends placement, and Mason-trained technicians install the bars as part of a complete kit." }
    ],
    sections: compact([
      {
        id: "what-families-notice",
        heading: "Signs your parent needs grab bars",
        blocks: [
          { p: "Most families do not decide on grab bars in the abstract. They notice something:" },
          { list: [
            "your parent steadies themselves on the towel rail, the basin or the door handle;",
            "they push up from the toilet with both hands on the seat, or take more than one attempt to stand;",
            "they put a hand on the wall when stepping into or out of the bathing area;",
            "they slow right down at the bathroom door, especially at night."
          ] },
          { p: "Each of those is a moment where proper support is missing. In a study of 198 older adults' bathrooms in Ahmedabad, 97% had no grab bars at all ([sources](/evidence))." }
        ]
      },
      {
        id: "not-a-towel-rail",
        heading: "Why a towel rail, basin or suction handle is not a grab bar",
        blocks: [
          { p: "Towel rails and soap holders are fixed to carry towels and soap, not a person's weight. A basin can shift on its brackets. Suction-cup handles depend on a perfectly clean, flat, dry surface and can let go without warning. A grab bar is there to take your parent's weight at the moment they need it most, so it has to be built for that and fixed into a wall that can hold it." }
        ]
      },
      {
        id: "where-grab-bars-go",
        heading: "Where grab bars usually help an older person",
        blocks: [
          { list: [
            "Beside the toilet - support for lowering down and pushing up. An angled bar suits a push-and-pull movement; a flip-up bar works where there is no wall alongside the toilet.",
            "At the shower or bathing area - a vertical bar where your parent steps in and out, and support within reach of where they stand or sit to bathe.",
            "At the entrance - a vertical bar at the door, where the floor is often wet and there is a step or threshold.",
            "Along the turn - wherever your parent has to turn around on a wet floor with nothing to hold."
          ] },
          { p: "The aim is that a hand is never far from support at any of the five moments of a bathroom visit: stepping in, turning around, sitting and standing, showering and the walk back ([why these five](/why))." }
        ]
      },
      withPhotos({
        id: "types",
        heading: "Types of grab bar in a Mason kit",
        blocks: [
          { list: kitList(facts, ["vertical-grab-bars", "angled-grab-bar", "folding-bar"]) },
          { p: "Vertical bars suit standing up and stepping in and out, because the hand can slide to the height that suits it. Angled bars support a lean-and-push movement such as rising from the toilet. A flip-up bar folds against the wall when it is not needed, which matters in a narrow bathroom or where a carer needs space." }
        ]
      }, figures(facts, ["vertical-grab-bars", "angled-grab-bar", "folding-bar"])),
      {
        id: "no-single-height",
        heading: "Why there is no single correct grab bar height",
        blocks: [
          { p: "Most published grab bar heights come from accessibility rules written for public buildings, where the user is unknown. In a home, the user is known. A bar that is right for a tall parent who pulls up with one arm can be wrong for a shorter parent who pushes down with both hands. Your parent's height and reach, their stronger side, whether they lean forward to stand, and where the toilet, shower and door sit in the room all change the right position." },
          { p: "That is why Mason does not install bars at a fixed catalogue height. Placement is informed by doctor input and by watching how your parent actually moves, and is confirmed by a Mason technician on site before anything is drilled." }
        ]
      },
      {
        id: "the-wall",
        heading: "The wall matters as much as the bar",
        blocks: [
          { p: "A grab bar is only as strong as what it is fixed into. Behind bathroom tiles there can be solid masonry, a hollow patch, or plumbing. Before fixing, the technician checks the wall at the exact spot, chooses the fixing for it, and moves the position if the wall will not hold. That check is one reason every Mason grab bar is fitted by a Mason-trained technician rather than left to be put up later." }
        ]
      },
      {
        id: "inspection",
        heading: "What Mason looks at during the inspection",
        blocks: [
          { list: [
            "How your parent sits, stands, turns and bathes today, and what they already reach for.",
            "Their height and reach, and which hand or side they rely on.",
            "The layout: toilet, shower or bathing area, door swing and the space to turn.",
            "The wall at each likely position, and anything behind it.",
            "How the bars will work with the rest of the bathroom - floor grip, seating and lighting."
          ] },
          { p: "The inspection is free, and you see the recommendation before deciding anything. [How the assessment works](/bathroom-safety-assessment)." }
        ]
      },
      {
        id: "what-mason-provides",
        heading: "What Mason provides in Goa",
        blocks: [packagesParagraph(facts)]
      },
      related("grab-bars")
    ]),
    cta: goaCta("Get grab bars placed for your parent, not for a catalogue")
  };
}

/* ------------------------------------------------------------- anti-slip floors */

function antiSlip(facts: SolutionFacts): KnowledgeDoc {
  return {
    breadcrumb: "Anti-slip bathroom floors",
    parent,
    eyebrow: "Solutions · Anti-slip floors",
    title: "Anti-slip bathroom floors for elderly parents",
    intro:
      "Wet tile is where many bathroom slips start. The good news is that a safer floor rarely needs new tiles. This page covers where bathroom floors get slippery, what can change without renovation, and how to keep the grip working.",
    topCta: true,
    topLink: { label: "What we check at the inspection", href: "#inspection" },
    summary: [
      { term: "The problem", detail: "Glazed tiles, water, soap and a bare foot. In a study of 198 older adults' bathrooms in Ahmedabad, 92% had a slippery floor." },
      { term: "What helps", detail: "An anti-slip treatment on the existing floor, anti-slip mats where feet are wettest, water that drains away instead of spreading, and footwear that grips." },
      { term: "What it is not", detail: "No floor is impossible to slip on. Grip works best together with support to hold and a seat for bathing." },
      { term: "In Goa", detail: "Mason inspects the floor for free, and Mason-trained technicians treat it and fit the mats as part of a complete kit - no re-tiling." }
    ],
    sections: compact([
      {
        id: "where-floors-get-slippery",
        heading: "Where bathroom floors get slippery",
        blocks: [
          { list: [
            "The bathing area - water, soap and shampoo on tile, often while your parent is on one foot.",
            "The step-out zone - the first wet footprint outside the shower, where people relax their guard.",
            "The path to the door - many Indian bathrooms are one open wet room, and bucket-and-mug bathing spreads water across the whole floor.",
            "Around the toilet - after the floor is washed, or where water collects near the drain."
          ] },
          { p: "In Goa's monsoon months a bathroom can stay damp for much longer, so a floor that feels fine in the dry season can become a daily risk." }
        ]
      },
      {
        id: "what-families-notice",
        heading: "Signs the floor is a problem",
        blocks: [
          { list: [
            "your parent shuffles or holds the wall on a wet floor;",
            "water spreads to the door or lingers long after bathing;",
            "a loose mat slides when stepped on;",
            "there has already been a slip or a near-miss."
          ] }
        ]
      },
      withPhotos({
        id: "options",
        heading: "Making a bathroom floor less slippery without re-tiling",
        blocks: [
          { list: [
            "Anti-slip surface treatment - applied to the existing tiles to improve traction, with no new flooring.",
            "Anti-slip mats in the bathing area and where feet leave it - the two places a wet foot meets the floor.",
            "Drainage support - so water runs to the drain instead of pooling or spreading.",
            "Bathroom slippers that grip on a wet floor.",
            "Light on the floor - wet patches you can see are easier to avoid, especially at night."
          ] },
          { p: "In Mason's kit these are:" },
          { list: kitList(facts, ["anti-slip-coating", "anti-slip-mat-shower", "anti-slip-mat-post-shower", "drainage-solution", "slippers-one"]) }
        ]
      }, figures(facts, ["anti-slip-mat-shower", "anti-slip-mat-post-shower"])),
      {
        id: "inspection",
        heading: "What Mason looks at during the inspection",
        blocks: [
          { list: [
            "The tile and its finish, and how it behaves when wet.",
            "How your parent bathes - shower, bucket and mug, standing or seated - and where the water goes.",
            "Where water collects, and how quickly it drains.",
            "The route from bathing area to door and toilet, including at night.",
            "Where your parent will need something to hold as well as better grip."
          ] }
        ]
      },
      {
        id: "keeping-it-working",
        heading: "Keeping an anti-slip floor working",
        blocks: [
          { list: [
            "Rinse soap and shampoo off the floor after bathing; residue makes any surface slippery.",
            "Avoid oil-based products on the bathroom floor.",
            "Let mats dry, and replace one that has worn smooth or stopped lying flat.",
            "Clean the floor the way the technician recommends for the treatment."
          ] },
          { p: "With the Advanced package, Mason's annual Safety AMC visits include inspecting the installed setup and fixing, changing or replacing items where required." }
        ]
      },
      {
        id: "what-mason-provides",
        heading: "What Mason provides in Goa",
        blocks: [packagesParagraph(facts)]
      },
      related("anti-slip-bathroom")
    ]),
    cta: goaCta("Have the bathroom floor checked")
  };
}

/* ---------------------------------------------------------------- safer bathing */

function saferBathing(facts: SolutionFacts): KnowledgeDoc {
  return {
    breadcrumb: "Safer bathing",
    parent,
    eyebrow: "Solutions · Safer bathing",
    title: "Safer bathing for elderly parents: seated showering and support",
    intro:
      "Bathing asks a lot of an older body at once: standing on a wet floor, balancing on one leg to wash, closing the eyes against soap, turning to rinse. This page explains what a safer bathing setup looks like and how it is matched to the way your parent bathes.",
    topCta: true,
    topLink: { label: "What we check at the inspection", href: "#inspection" },
    summary: [
      { term: "The risk", detail: "Balance is tested repeatedly on a wet, soapy floor, often with no one else in the room." },
      { term: "What helps", detail: "A stable shower seat with non-slip feet, support within reach of the seat and the entry, grip underfoot, and water and toiletries reachable without standing or stretching." },
      { term: "It depends on the person", detail: "Some parents are steady standing; others are safer seated. The setup should follow what your parent can do, not a single rule." },
      { term: "In Goa", detail: "Mason inspects how your parent bathes for free and installs seating, support and grip as part of a complete kit." }
    ],
    sections: compact([
      {
        id: "what-families-notice",
        heading: "Signs bathing has become harder",
        blocks: [
          { list: [
            "baths take longer, or your parent waits until someone else is home;",
            "they hold the tap or a pipe to wash their feet;",
            "they sit on an upturned bucket or a light plastic stool that can tip or slide;",
            "they come out tired, or say they felt unsteady."
          ] }
        ]
      },
      withPhotos({
        id: "safer-setup",
        heading: "What a safer bathing setup involves",
        blocks: [
          { list: [
            "A stable shower stool with non-slip feet, at a height that lets your parent sit and rise without dropping or straining.",
            "A grab bar where they step in and out, and one within reach of the seat for sitting down and standing up.",
            "Anti-slip mats where feet are wet, and an anti-slip treatment on the floor.",
            "Water within reach while seated - a bucket and mug at seat height, or a handheld shower if the plumbing allows.",
            "Soap and towel within reach of the seat, so there is no stretching or standing to fetch them."
          ] },
          { p: "From Mason's kit:" },
          { list: kitList(facts, ["shower-stool", "vertical-grab-bars", "anti-slip-mat-shower", "anti-slip-mat-post-shower"]) }
        ]
      }, figures(facts, ["shower-stool", "anti-slip-mat-shower"])),
      {
        id: "standing-or-seated",
        heading: "Standing or seated: following how your parent bathes",
        blocks: [
          { p: "The way someone has always bathed is not automatically the safest way for them now, but it is the starting point. Mason watches how your parent actually bathes, then recommends what would make that routine steadier: for one parent a seat and a bar beside it, for another simply support at the entry and grip underfoot. The goal is a routine they can keep doing independently and with dignity." }
        ]
      },
      {
        id: "handheld-shower",
        heading: "What about a handheld shower?",
        blocks: [
          { p: "A handheld shower makes seated bathing easier because the water comes to the person. It is a plumbing change rather than part of Mason's kit, so if it would help, Mason notes it in the recommendation for you to arrange with your plumber, and places the seat and support to work with it." }
        ]
      },
      {
        id: "inspection",
        heading: "What Mason looks at during the inspection",
        blocks: [
          { list: [
            "How your parent bathes today: standing or seated, shower or bucket, and how long it takes.",
            "Getting into and out of the bathing area, including any step or threshold.",
            "Space for a seat, and where support can reach both the seat and the entry.",
            "Floor grip, drainage and lighting in the bathing area.",
            "What your parent and family want the routine to look like."
          ] },
          { p: "Bathing support is a home safety matter, not medical treatment. If your parent feels dizzy or unwell when bathing, speak to their doctor as well." }
        ]
      },
      {
        id: "what-mason-provides",
        heading: "What Mason provides in Goa",
        blocks: [packagesParagraph(facts)]
      },
      related("safer-bathing")
    ]),
    cta: goaCta("Make bathing steadier for your parent")
  };
}

/* ---------------------------------------------------------------- toilet safety */

function toiletSafety(facts: SolutionFacts): KnowledgeDoc {
  return {
    breadcrumb: "Toilet safety",
    parent,
    eyebrow: "Solutions · Toilet safety",
    title: "Toilet safety for elderly parents: support for sitting down and standing up",
    intro:
      "Lowering onto a toilet and standing back up is one of the hardest movements an older person makes several times a day - and many of those trips happen at night. This page covers what makes toilet use harder with age and what support helps.",
    topCta: true,
    topLink: { label: "What we check at the inspection", href: "#inspection" },
    summary: [
      { term: "The movement", detail: "Sitting down in control and standing up again needs leg strength and balance; a low seat and nothing to hold make both harder." },
      { term: "What helps", detail: "A raised toilet seat, a grab bar or flip-up support bar within reach, a firmly fixed toilet, and light on the way at night." },
      { term: "Placement varies", detail: "Which side the wall is on, your parent's stronger hand and how they rise all change what goes where." },
      { term: "In Goa", detail: "Mason inspects the toilet area for free and installs seating height, support and fixings as part of a complete kit." }
    ],
    sections: compact([
      {
        id: "what-families-notice",
        heading: "Signs the toilet has become hard to use",
        blocks: [
          { list: [
            "your parent drops onto the seat rather than lowering in control;",
            "they push on the seat, the basin, the cistern or the wall to stand up;",
            "they need more than one attempt to get up;",
            "night-time trips are slow, or happen in the dark."
          ] }
        ]
      },
      withPhotos({
        id: "support",
        heading: "Toilet support that helps sitting and standing",
        blocks: [
          { list: [
            "A raised toilet seat - less distance to lower and to rise.",
            "A grab bar beside the toilet - an angled bar for a lean-and-push movement, or a vertical bar to pull up on.",
            "A flip-up support bar where there is no wall alongside the toilet; it folds away when not in use.",
            "Reinforced fixings for the toilet and washbasin, which older adults often lean on.",
            "Night lighting on the route to the toilet, and a lock that family can open from outside in an emergency."
          ] },
          { p: "From Mason's kit:" },
          { list: kitList(facts, ["raised-toilet-seat", "angled-grab-bar", "folding-bar", "total-support-solution", "two-way-lock"]) }
        ]
      }, figures(facts, ["raised-toilet-seat", "folding-bar", "total-support-solution"])),
      {
        id: "placement",
        heading: "Why toilet grab bar placement depends on your parent",
        blocks: [
          { p: "There is no single right position for a toilet grab bar. If the wall is on your parent's weaker side, a bar there helps less than a flip-up bar on their stronger side. A parent who leans forward to stand needs support further forward than one who pushes straight up. Door swing and the space in front of the toilet matter too. Mason places toilet support after watching how your parent sits and stands, with placement informed by doctor input and confirmed on site by a Mason technician." }
        ]
      },
      {
        id: "indian-toilets",
        heading: "If the bathroom has an Indian-style toilet",
        blocks: [
          { p: "Squatting and rising from an Indian-style toilet becomes very difficult for many older adults. Replacing it with a Western-style toilet is plumbing work rather than part of Mason's kit; if it would help, Mason notes it in the recommendation so you can arrange it with your plumber, and plans the support around the new layout." }
        ]
      },
      {
        id: "inspection",
        heading: "What Mason looks at during the inspection",
        blocks: [
          { list: [
            "How your parent sits down and stands up today, and what they hold.",
            "Toilet height, and the space and walls around it.",
            "Which side and which hand they rely on.",
            "How firmly the toilet and basin are fixed.",
            "The route to the toilet at night: light, floor and door."
          ] }
        ]
      },
      {
        id: "what-mason-provides",
        heading: "What Mason provides in Goa",
        blocks: [packagesParagraph(facts)]
      },
      related("toilet-safety")
    ]),
    cta: goaCta("Make sitting and standing easier for your parent")
  };
}

const BUILDERS: Record<SolutionSlug, (facts: SolutionFacts) => KnowledgeDoc> = {
  "grab-bars": grabBars,
  "anti-slip-bathroom": antiSlip,
  "safer-bathing": saferBathing,
  "toilet-safety": toiletSafety
};

export function solutionDoc(slug: SolutionSlug, facts: SolutionFacts): KnowledgeDoc {
  return BUILDERS[slug](facts);
}

/** Search metadata per page (titles and descriptions are written for the person searching). */
export const SOLUTION_META: Record<SolutionSlug, { title: string; description: string; serviceType: string }> = {
  "grab-bars": {
    title: "Grab Bars for Elderly Parents: Placement & Installation in Goa | Mason Company",
    description: "Where grab bars help an older person in the bathroom, which type suits the toilet, shower and entrance, and why placement depends on the person and the wall. Free inspection in Goa.",
    serviceType: "Grab bar placement and installation for older adults"
  },
  "anti-slip-bathroom": {
    title: "Anti-Slip Bathroom Floors for Elderly Parents | Mason Company, Goa",
    description: "Why wet bathroom tiles are slippery for older adults and how to make the floor safer without re-tiling: anti-slip treatment, mats, drainage and footwear. Free inspection in Goa.",
    serviceType: "Anti-slip bathroom floor treatment for older adults"
  },
  "safer-bathing": {
    title: "Safer Bathing for Elderly Parents: Shower Stools & Support | Mason Company",
    description: "How to make bathing safer for an elderly parent: a stable shower stool, grab bars within reach, grip underfoot and a setup that suits how they bathe. Free inspection in Goa.",
    serviceType: "Safer bathing setup for older adults"
  },
  "toilet-safety": {
    title: "Toilet Safety for Elderly Parents: Grab Bars & Raised Seats | Mason Company",
    description: "Support for an elderly parent to sit down and stand up at the toilet: raised toilet seats, toilet grab bars, flip-up support bars and night lighting. Free inspection in Goa.",
    serviceType: "Toilet safety and sit-to-stand support for older adults"
  }
};
