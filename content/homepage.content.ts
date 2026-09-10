import type { HomepageContent } from "./types";

export const homepageContent: HomepageContent = {
  language: "EN",
  nav: {
    links: [
      { label: "Why", href: "#why-mason" },
      { label: "Packages", href: "#package-comparison" },
      { label: "Process", href: "#how-it-works" },
      { label: "FAQ", href: "#faq" }
    ],
    locationLabel: "City",
    locationValue: "Mumbai & Goa",
    searchPlaceholder: ""
  },
  brand: {
    name: "Mason Company",
    tagline: "",
    serviceLine: "Premium bathroom safety upgrades for ageing parents",
    trustBadges: ["Pre-priced safety packages", "Trained Mason experts", "Doctor-reviewed planning", "Full refund any time before installation."],
    phoneDisplay: "+91 98765 43210",
    phoneTel: "+919876543210",
    whatsappLabel: "WhatsApp Support",
    whatsappUrl: "https://wa.me/919876543210",
    headerStats: [
      { value: "2 Packages", label: "Standard and Advanced" },
      { value: "Doctor inputs", label: "Safety planning" },
      { value: "Before + after", label: "Completion proof" }
    ]
  },
  hero: {
    eyebrow: "Bathroom Safety for Ageing Parents",
    heading: "Most falls happen here. We make sure yours don't.",
    subcopy: "You can't always be there - safety can be. Premium, doctor-informed, expertly-installed bathroom safety.",
    primaryCta: "Book a Safety Visit",
    secondaryCta: "See Transformations",
    supportNote: "",
    supportPoints: ["Premium home-first finish", "Trained Mason experts", "Doctor-reviewed planning"],
    visual: {
      image: "/images/hero/transformed-bathroom-desktop.jpg",
      alt: "Bathroom after a Mason Company upgrade with clearer movement space and support",
      beforeImage: "/images/hero/normal-bathroom.jpg",
      afterImage: "/images/hero/transformed-bathroom.jpg",
      beforeImageMobile: "/images/hero/normal-bathroom-mobile.jpg",
      beforeImageDesktop: "/images/hero/normal-bathroom-desktop.jpg",
      afterImageMobile: "/images/hero/transformed-bathroom-mobile.jpg",
      afterImageDesktop: "/images/hero/transformed-bathroom-desktop.jpg",
      beforeAlt: "Bathroom before safety upgrades with limited support and tighter circulation",
      afterAlt: "Bathroom after safety upgrades with cleaner movement and improved support planning",
      beforeLabel: "Before",
      afterLabel: "After",
      autoplayMs: 5500,
      videoPoster: "/images/hero/transformed-bathroom-desktop.jpg",
      videoTitle: "Short Mason Company bathroom upgrade walkthrough",
      badge: "Before -> After",
      caption: "Safer movement without a renovation."
    },
    trustModule: {
      title: "Why families act early",
      otpBadge: "Full refund any time before installation.",
      doctorQuote: "A serious bathroom fall can affect treatment, recovery, mobility, caregiving, and weeks of family coordination.",
      doctorByline: "Estimated family impact range: ₹3L-₹10L",
      stats: [
        { value: "25%", label: "60+ injury and/or fall" },
        { value: "81%", label: "Bathroom injuries caused by falls" },
        { value: "26-38%", label: "Fall-rate reduction from home hazard changes" }
      ]
    }
  },
  whatWeDoSection: {
    eyebrow: "What we do",
    title: "A reassurance. Not a renovation.",
    description:
      "Leave your details and a Mason advisor will call to arrange the visit. Full refund any time before installation.",
    valueTags: ["Grip", "Balance", "Comfort", "Ease"],
    visual: {
      src: "/images/stock-web/upgrades/upgrade-shower-support.jpg",
      alt: "Walk-in shower area illustrating a calmer, easier-to-navigate bathroom layout",
      objectPosition: "50% 50%"
    }
  },
  transformationGallerySection: {
    id: "transformations",
    title: "A reassurance. Not a renovation.",
    subtitle: "We make bathrooms safer through thoughtful additions - grip, balance, comfort, ease. Drag to see the difference.",
    explainer: {
      title: "Bathroom safety in 20 seconds",
      caption: "A short walkthrough of a safer bathroom layout.",
      poster: "/images/hero/transformed-bathroom-desktop.jpg",
      posterAlt: "Preview image of a transformed bathroom layout with clearer support and circulation",
      embedUrl: "https://www.youtube.com/embed/In7wMKcerf8",
      externalUrl: "https://www.youtube.com/shorts/In7wMKcerf8",
      durationLabel: "20 sec"
    },
    items: [
      {
        id: "gallery-full-upgrade",
        title: "The whole bathroom feels safer",
        caption: "A clearer layout, stronger support, and more confidence in daily movement.",
        before: {
          src: "/images/hero/normal-bathroom-desktop.jpg",
          alt: "Bathroom before safety upgrades with older fixtures and weaker support layout",
          label: "Before",
          objectPosition: "50% 52%"
        },
        after: {
          src: "/images/hero/transformed-bathroom-desktop.jpg",
          alt: "Bathroom after safety upgrades with cleaner circulation and stronger support planning",
          label: "After",
          objectPosition: "50% 52%"
        },
        tags: ["Full upgrade", "Safer movement"]
      },
      {
        id: "gallery-layout-refresh",
        title: "Daily movement becomes calmer",
        caption: "A neater bathroom with easier circulation and less hesitation at every turn.",
        before: {
          src: "/images/hero/normal-bathroom.jpg",
          alt: "Bathroom before a safety-focused redesign",
          label: "Before",
          objectPosition: "50% 54%"
        },
        after: {
          src: "/images/hero/transformed-bathroom.jpg",
          alt: "Bathroom after a safety-focused redesign with cleaner layout planning",
          label: "After",
          objectPosition: "50% 52%"
        },
        tags: ["Layout refresh", "Turning room"]
      },
      {
        id: "gallery-shower-zone",
        title: "Shower entry feels safer",
        caption: "More control where slips usually start.",
        before: {
          src: "/images/stock-web/risk/risk-tight-turning.jpg",
          alt: "Shower entry before bathroom safety upgrades",
          label: "Before",
          objectPosition: "52% 56%"
        },
        after: {
          src: "/images/stock-web/upgrades/upgrade-shower-support.jpg",
          alt: "Shower-side movement zone after bathroom safety upgrades",
          label: "After",
          objectPosition: "50% 50%"
        },
        tags: ["Wet zone", "Shower entry"]
      },
      {
        id: "gallery-overview",
        title: "The whole bathroom feels more confident",
        caption: "A calmer everyday layout without a disruptive remodel.",
        before: {
          src: "/images/packages/goa-comfort-before.jpg",
          alt: "Full bathroom view before safety upgrades",
          label: "Before",
          objectPosition: "52% 52%"
        },
        after: {
          src: "/images/hero/transformed-bathroom.jpg",
          alt: "Full bathroom view after safety upgrades",
          label: "After",
          objectPosition: "50% 52%"
        },
        tags: ["One-visit upgrade", "No renovation"]
      }
    ]
  },
  problemSection: {
    id: "why-it-matters",
    title: "The cost of a fall is rarely just the hospital bill.",
    subtitle: "The risk is real. The response should be thoughtful.",
    lead: "A serious bathroom fall can affect the whole household: treatment, recovery, mobility, caregiving, and weeks of family coordination.",
    highlights: [
      "25% of Indians aged 60+ reported injury and/or fall",
      "81% of bathroom injuries were caused by falls",
      "Potential full recovery cost: ₹3L-₹10L",
      "Home hazard changes can reduce fall rates by 26-38%"
    ],
    stats: [
      {
        icon: "01",
        title: "Wet entry zones",
        description: "Wet entry points drive slip risk first.",
        visual: {
          src: "/images/stock-web/risk/risk-wet-floor.jpg",
          alt: "Wet bathroom floor and shower threshold showing a slip-prone zone",
          objectPosition: "54% 56%"
        }
      },
      {
        icon: "02",
        title: "Tight turning space",
        description: "Tight layouts make turning harder.",
        visual: {
          src: "/images/stock-web/risk/risk-tight-turning.jpg",
          alt: "Compact bathroom layout where turning space is limited between fixtures",
          objectPosition: "52% 56%"
        }
      },
      {
        icon: "03",
        title: "No fixed support point",
        description: "Missing support makes standing less stable.",
        visual: {
          src: "/images/stock-web/risk/risk-no-support.jpg",
          alt: "Bathroom sink and shower area without a clear fixed support point",
          objectPosition: "56% 52%"
        }
      }
    ],
    conclusion: "Make the bathroom safer while it still feels like home."
  },
  evidenceSection: {
    id: "evidence-snapshot",
    title: "Why families act before a fall",
    subtitle: "Numbers that make the decision visible.",
    cards: [
      {
        id: "ev-card-serious-injury",
        kicker: "Reported injury and/or fall",
        value: "25%",
        label: "Among Indians aged 60+, 1 in 4 reported an injury and/or fall in the previous two years.",
        context: "Fall risk is already present in many ageing households.",
        sourceLabel: "LASI India Executive Summary",
        sourceId: "lasi-exec-2019",
        ctaLabel: "View Evidence",
        ctaHref: "/evidence"
      },
      {
        id: "ev-card-independence-loss",
        kicker: "Bathroom injuries from falls",
        value: "81%",
        label: "Falls are the dominant risk around wet zones, toilets, and transfers.",
        context: "The bathroom concentrates several high-risk movements in one room.",
        sourceLabel: "CDC Bathroom Injuries Report",
        sourceId: "cdc-bathroom-injuries",
        ctaLabel: "View Evidence",
        ctaHref: "/evidence"
      },
      {
        id: "ev-card-falls-injury-rate",
        kicker: "Falls that led to injury",
        value: "66%",
        label: "A review of older adults in India put the pooled injury rate at 65.6% among those who fell.",
        context: "A fall often carries an injury burden beyond the immediate incident.",
        sourceLabel: "India falls-injury systematic review",
        sourceId: "india-falls-injury-review",
        ctaLabel: "View Evidence",
        ctaHref: "/evidence"
      },
      {
        id: "ev-card-prevention-effect",
        kicker: "Fewer falls after home changes",
        prefix: "Up to",
        value: "38%",
        label: "Home hazard interventions cut fall rates by 26–38%, with the largest effect for higher-risk adults.",
        context: "Targeted changes at home can make a measurable difference.",
        sourceLabel: "Cochrane home hazard review",
        sourceId: "cochrane-home-hazards-2021",
        ctaLabel: "View Evidence",
        ctaHref: "/evidence"
      }
    ]
  },
  riskQuizSection: {
    id: "risk-quiz",
    title: "Check bathroom fall risk in 30 seconds",
    subtitle: "Answer four quick questions to understand likely safety needs before Mason confirms the right fit.",
    intro: "A simple starting point for families deciding how much support the bathroom routine may need. For a safer recommendation, start with a free assessment.",
    questions: [
      {
        id: "rq-1",
        prompt: "Has your parent had a bathroom slip, near-fall, or fall in the last 12 months?",
        options: [
          { id: "yes", label: "Yes", score: 35 },
          { id: "no", label: "No", score: 0 }
        ]
      },
      {
        id: "rq-2",
        prompt: "Does your parent need support while sitting, standing, or turning in the bathroom?",
        options: [
          { id: "yes", label: "Yes", score: 25 },
          { id: "no", label: "No", score: 0 }
        ]
      },
      {
        id: "rq-3",
        prompt: "Does the bathroom have slippery zones or no fixed support points?",
        options: [
          { id: "yes", label: "Yes", score: 25 },
          { id: "no", label: "No", score: 0 }
        ]
      },
      {
        id: "rq-4",
        prompt: "Does your parent use the bathroom independently for most of the day?",
        options: [
          { id: "yes", label: "Yes", score: 15 },
          { id: "no", label: "No", score: 0 }
        ]
      }
    ],
    bands: [
      {
        id: "low",
        min: 0,
        max: 24,
        label: "Low",
        summary: "Standard can address the main everyday safety gaps.",
        recommendedPlan: "Standard"
      },
      {
        id: "moderate",
        min: 25,
        max: 59,
        label: "Moderate",
        summary: "Advanced is better when routines need broader daily support.",
        recommendedPlan: "Advanced"
      },
      {
        id: "high",
        min: 60,
        max: 100,
        label: "High",
        summary: "Advanced is the stronger fit when the bathroom routine already feels high risk.",
        recommendedPlan: "Advanced"
      }
    ],
    startLabel: "Start the 30-second quiz",
    resultCtaLabel: "See recommended package",
    restartLabel: "Retake Quiz"
  },
  transformationSection: {
    id: "before-after",
    title: "Bathroom Transformation",
    subtitle: "What changes in one visit.",
    beforeTitle: "Before",
    beforePoints: ["No support while standing", "Slippery surfaces", "Weak support points"],
    afterTitle: "After",
    afterPoints: ["Reinforced grab bars", "Anti-slip flooring", "Safe standing support"],
    installLine: "Installed in 3-4 hours. No renovation."
  },
  processSection: {
    id: "how-it-works",
    title: "From booking to a safer bathroom.",
    subtitle: "Six clear steps, handled by one accountable Mason team - from package booking all the way to final handover.",
    highlights: ["Clear steps", "Assisted support", "One accountable Mason team from booking to handover"],
    addOnDisclosure: "Clear steps. Assisted support. One accountable Mason team from booking to handover.",
    primaryCta: "Book a Safety Visit",
    secondaryCta: "Talk to a Mason Company specialist",
    steps: [
      {
        id: "process-step-1",
        title: "Request your visit",
        description: "Leave your details and a Mason advisor will call to arrange the visit.",
        icon: "/images/stock-web/process/process-book-consultation.jpg",
        alt: "Family discussing a home safety visit at a table",
        badge: "INCLUDED",
        visual: {
          src: "/images/stock-web/process/process-book-consultation.jpg",
          alt: "Family discussing a home safety visit and booking online",
          objectPosition: "52% 44%"
        }
      },
      {
        id: "process-step-2",
        title: "Mason follow-up",
        description: "Our team reviews your request and contacts you to confirm the visit, package details, and next steps.",
        icon: "/images/stock-web/process/process-doctor-video-review.jpg",
        alt: "Doctor on a video consultation using a laptop",
        badge: "MANDATORY",
        visual: {
          src: "/images/stock-web/process/process-doctor-video-review.jpg",
          alt: "Doctor conducting a remote safety review on video call",
          objectPosition: "56% 46%"
        }
      },
      {
        id: "process-step-3",
        title: "Inspection",
        description: "We schedule a virtual or physical bathroom inspection depending on location and logistics.",
        icon: "/images/stock-web/process/process-onsite-inspection.jpg",
        alt: "Technician inspecting a bathroom before installation planning",
        badge: "INCLUDED",
        visual: {
          src: "/images/stock-web/process/process-onsite-inspection.jpg",
          alt: "Technician assessing bathroom walls and movement zones on site",
          objectPosition: "52% 52%"
        }
      },
      {
        id: "process-step-4",
        title: "Technician visit",
        description: "Our trained technicians verify the site and finalise support placement.",
        icon: "/images/stock-web/process/process-installation-day.jpg",
        alt: "Bathroom safety installation work in progress",
        badge: "INCLUDED",
        visual: {
          src: "/images/stock-web/process/process-installation-day.jpg",
          alt: "Technician completing bathroom support installation in one visit",
          objectPosition: "58% 50%"
        }
      },
      {
        id: "process-step-5",
        title: "Installation",
        description: "The selected package is installed with careful fitting, clean execution, and minimal disruption.",
        icon: "/images/stock-web/process/process-family-walkthrough.jpg",
        alt: "Family reviewing the upgraded bathroom after installation",
        badge: "INCLUDED",
        visual: {
          src: "/images/stock-web/process/process-family-walkthrough.jpg",
          alt: "Family handover and final walkthrough after bathroom upgrade completion",
          objectPosition: "56% 40%"
        }
      },
      {
        id: "process-step-6",
        title: "Success handover",
        description: "We complete a walkthrough and document the upgrade with before-and-after pictures.",
        icon: "/images/stock-web/process/process-family-walkthrough.jpg",
        alt: "Family reviewing the upgraded bathroom after installation",
        badge: "INCLUDED",
        visual: {
          src: "/images/stock-web/process/process-family-walkthrough.jpg",
          alt: "Family handover and before-after documentation after bathroom upgrade completion",
          objectPosition: "56% 40%"
        }
      }
    ]
  },
  categoriesSection: {
    title: "Package Categories",
    subtitle: "Package browsing is available after the assessment path or for customers who already know what they need.",
    emptyMessage: "Category browsing is disabled in this version.",
    items: []
  },
  featuredSection: {
    title: "Featured Packages",
    subtitle: "Package browsing is available for confident customers.",
    emptyMessage: "Featured product listings are disabled in this version.",
    items: []
  },
  packagesSection: {
    title: "The same complete kit. You choose the cover.",
    subtitle: "Both packages install everything, fitted by Mason-trained experts. Advanced includes one safety check-up visit during the first year.",
    features: [
      { id: "vertical-grab-bars", label: "Vertical grab bars", description: "Support placed at key standing and movement points.", quantity: 3 },
      { id: "angled-grab-bar", label: "L / angled grab bar", description: "Angled support for reaching and turning.", quantity: 1 },
      { id: "folding-bar", label: "Flip-up / folding support bar", description: "Foldable support where access and clearance matter.", quantity: 1 },
      { id: "anti-slip-coating", label: "Anti-slip surface treatment", description: "Treatment for improved traction on existing surfaces.", quantity: 1 },
      { id: "anti-slip-mat-shower", label: "Shower anti-slip mat", description: "Added grip in the shower zone.", quantity: 1 },
      { id: "anti-slip-mat-post-shower", label: "Post-shower anti-slip mat", description: "Added grip where feet leave the shower.", quantity: 1 },
      { id: "shower-stool", label: "Shower seating stool", description: "Seated support for showering.", quantity: 1 },
      { id: "two-way-lock", label: "Two-way lock", description: "A lock designed for safer access and family response.", quantity: 1 },
      { id: "corner-safety", label: "Edge & corner protection", description: "Protective cushioning for sharp edges and corners that could cause injury.", quantity: 1 },
      { id: "drainage-solution", label: "Drainage support", description: "Drainage improvements without redesigning the bathroom.", quantity: 4 },
      { id: "slippers-one", label: "Bathroom slippers", description: "Bathroom-use slippers for steadier footing.", quantity: 1 },
      { id: "total-support-solution", label: "Reinforced fixture support", description: "Upgraded high-strength fixings for toilets and washbasins to improve stability and long-term support.", quantity: 1 }
    ],
    plans: [
      {
        id: "package-standard",
        name: "Standard",
        badge: "The complete kit",
        titleDescriptor: "Everyday safety",
        isFeatured: true,
        bestFor: "The full safety upgrade, installed, inspected and handed over in one go.",
        outcome: "A complete everyday safety upgrade for steadier movement, better grip, and more confidence at home.",
        price: "₹30,000",
        referencePrice: "₹35,000",
        currentPrice: "₹30,000",
        savings: "Core package",
        visual: {
          src: "/images/hero/transformed-bathroom-desktop.jpg",
          alt: "Bathroom with essential safety upgrades for the Standard package",
          objectPosition: "50% 52%"
        },
        visualHighlights: ["Grab support", "Wet-zone grip", "Steadier movement"],
        includedFeatureIds: [
          "vertical-grab-bars",
          "angled-grab-bar",
          "folding-bar",
          "anti-slip-coating",
          "anti-slip-mat-shower",
          "anti-slip-mat-post-shower",
          "shower-stool",
          "two-way-lock",
          "corner-safety",
          "drainage-solution",
          "slippers-one",
          "total-support-solution"
        ],
        ctaLabel: "Book Standard"
      },
      {
        id: "package-advanced",
        name: "Advanced",
        badge: "The complete kit + 1-Year Safety Check-Up Included",
        titleDescriptor: "Full Mason safety setup",
        isFeatured: false,
        bestFor: "The same installation, with one included safety check-up during the first year.",
        outcome: "The complete installation kit, plus one technician visit within the first year to inspect the work and cover necessary corrective support identified during that visit.",
        price: "₹37,000",
        referencePrice: "₹44,000",
        currentPrice: "₹37,000",
        savings: "Premium package",
        visual: {
          src: "/images/stock-web/upgrades/upgrade-shower-support.jpg",
          alt: "Bathroom with broader safety support for the Advanced package",
          objectPosition: "50% 48%"
        },
        visualHighlights: ["Same complete kit", "Home-first finish", "1-year safety check-up"],
        includedFeatureIds: [
          "vertical-grab-bars",
          "angled-grab-bar",
          "folding-bar",
          "anti-slip-coating",
          "anti-slip-mat-shower",
          "anti-slip-mat-post-shower",
          "shower-stool",
          "two-way-lock",
          "corner-safety",
          "drainage-solution",
          "slippers-one",
          "total-support-solution"
        ],
        ctaLabel: "Book Advanced"
      },
    ]
  },
  whySection: {
    title: "Why Mason Company",
    subtitle: "A complete bathroom safety solution, shaped by medical expertise, expert installation, and the design standards families expect at home.",
    items: [
      {
        title: "Comprehensive by design",
        description: "We look at the full bathroom routine: entry, turning, sitting, standing, showering, and night-time use."
      },
      {
        title: "Doctor-informed planning",
        description: "Our approach is shaped with doctor inputs, preventive mobility guidance, and senior-care context."
      },
      {
        title: "Trained Mason experts",
        description: "Every visit is handled by trained technicians who understand support placement and secure fitting."
      },
      {
        title: "One accountable team",
        description: "From selection to inspection, installation, and follow-up, Mason stays responsible for the outcome."
      },
      {
        title: "Premium, home-first finish",
        description: "The solution is built to feel calm and considered, not hospital-like or temporary."
      },
      {
        title: "Evidence-led prevention",
        description: "We study fall-risk patterns and assisted-care environments to design practical home upgrades."
      }
    ]
  },
  testimonialsSection: {
    title: "What Families Say After Installation",
    subtitle: "Families choose Mason Company because the upgrade feels thoughtful, premium, and reassuring, not like a temporary hospital setup.",
    emptyMessage: "Testimonials will appear here once approved.",
    items: [
      {
        id: "ts-1",
        quote: "We wanted the bathroom to be safer for my father, but we were worried it would look too clinical. Mason made the space feel more secure without changing the warmth of the home.",
        author: "Anita Mehra",
        relation: "Daughter",
        city: "Bengaluru",
        outcomeLine: "Safer movement, premium finish",
        photo: {
          src: "/images/proof/testimonial-anita.jpg",
          alt: "Portrait of Anita Sharma"
        }
      },
      {
        id: "ts-2",
        quote: "The process was clear from the first call. The team explained the package, inspected the bathroom, and installed everything neatly. My mother now has support exactly where she needs it.",
        author: "Rohan Kapoor",
        relation: "Son",
        city: "Goa",
        outcomeLine: "Clear process, confident handover",
        photo: {
          src: "/images/proof/testimonial-rohan.jpg",
          alt: "Portrait of Rohan Desai"
        }
      },
      {
        id: "ts-3",
        quote: "The biggest relief was not having to coordinate multiple vendors. Mason handled the planning, products, installation, and walkthrough as one complete solution.",
        author: "Neha Shah",
        relation: "Daughter-in-law",
        city: "Bengaluru",
        outcomeLine: "One accountable team"
      },
      {
        id: "ts-4",
        quote: "The before-and-after difference was obvious. The bathroom feels safer, but it still looks like a well-designed home bathroom, not a medical facility.",
        author: "Vikram Rao",
        relation: "Son",
        city: "Goa",
        outcomeLine: "Visible upgrade, home-first design"
      }
    ]
  },
  doctorsSection: {
    title: "Doctor-Reviewed Safety Thinking",
    subtitle: "Mason Company's bathroom safety approach has been shaped with medical inputs, senior-care context, and practical guidance from experienced doctors, so every package is designed around real movement, balance, and daily-use risks.",
    emptyMessage: "Doctor attestations will appear here once published.",
    items: [
      {
        id: "doc-1",
        quote: "For ageing adults, bathroom safety should focus on predictable support: standing, turning, sitting, bathing, and moving across wet areas. A well-planned home upgrade can support safer daily routines without making the space feel institutional.",
        doctorName: "Dr. Ashok Gupta",
        specialty: "MBBS (UCMS), MRSH (London)",
        registration: "40+ years of experience",
        city: "Delhi",
        photo: {
          src: "/images/proof/doctor-meera.jpg",
          alt: "Portrait of Dr. Meera Kulkarni"
        }
      },
      {
        id: "doc-2",
        quote: "Good preventive design respects both safety and dignity. The right bathroom changes should reduce avoidable risk while still feeling comfortable, clean, and appropriate for the home.",
        doctorName: "Dr. Rajiv Goyal",
        specialty: "MBBS, MD - Dermatology, Venereology & Leprosy",
        registration: "Dermatologist | 22 years overall experience",
        city: "Delhi",
        photo: {
          src: "/images/proof/doctor-rohan.jpg",
          alt: "Portrait of Dr. Rohan D'Souza"
        }
      },
      {
        id: "doc-3",
        quote: "Fall prevention begins with understanding daily movement. Support placement, slip-risk reduction, visibility, and ease of use all matter when designing safer spaces for older adults.",
        doctorName: "Dr. Prerna Goyal",
        specialty: "MBBS, DMRD, DNB",
        registration: "Radiologist | MAMC, Delhi University",
        city: "Delhi"
      }
    ]
  },
  whoForSection: {
    id: "who-its-for",
    title: "Who this helps",
    subtitle: "Typical family situations where Mason fits best.",
    items: ["Parents above 60", "Recent fall incidents", "Knee weakness or balance issues", "Post-surgery recovery", "Seniors living alone"]
  },
  installationTrustSection: {
    id: "installation-trust",
    title: "Installation standards",
    subtitle: "The installation experience families expect from day one.",
    items: ["Completed in 3-4 hours", "Minimal drilling", "No renovation required", "Designed to match modern bathrooms"]
  },
  productShowcaseSection: {
    id: "upgrade-details",
    title: "Safety upgrades you notice every day",
    subtitle: "The support zones families usually want to understand before booking.",
    items: [
      {
        id: "product-grab-support",
        title: "Grab support planning",
        caption: "Support points follow standing and turning movement.",
        visual: {
          src: "/images/stock-web/upgrades/upgrade-grab-support.jpg",
          alt: "Bathroom support zone near the basin and standing area",
          objectPosition: "46% 56%"
        }
      },
      {
        id: "product-antislip",
        title: "Anti-slip floor cue",
        caption: "Wet floor zones are reviewed first.",
        visual: {
          src: "/images/stock-web/upgrades/upgrade-anti-slip-floor.jpg",
          alt: "Bathroom floor detail reviewed for anti-slip treatment",
          objectPosition: "50% 66%"
        }
      },
      {
        id: "product-toilet-support",
        title: "Toilet support zone",
        caption: "Sit-stand support is planned around height and hand reach.",
        visual: {
          src: "/images/stock-web/upgrades/upgrade-toilet-support.jpg",
          alt: "Toilet-side layout used to evaluate sit-stand support placement",
          objectPosition: "52% 54%"
        }
      },
      {
        id: "product-shower-support",
        title: "Shower grip zone",
        caption: "Entry, exit, and reach zones get the most attention.",
        visual: {
          src: "/images/stock-web/upgrades/upgrade-shower-support.jpg",
          alt: "Shower-side movement zone evaluated for grip and reach support",
          objectPosition: "58% 48%"
        }
      }
    ]
  },
  faqSection: {
    id: "faq",
    title: "Questions, answered",
    subtitle: "Everything about packages, booking, and installation. Still unsure? Book a free visit and we'll talk it through.",
    items: [
      {
        question: "What does Mason Company do?",
        answer: "Mason Company upgrades existing bathrooms with grab support, anti-slip treatments and mats, shower seating, safer locks, edge and corner protection, drainage support, slippers, and reinforced fixture support."
      },
      {
        question: "Who is Mason Company for?",
        answer: "Mason is designed for families with ageing parents, seniors living independently, people with balance concerns, and households that want to reduce bathroom risk before an incident happens."
      },
      {
        question: "Do you renovate the entire bathroom?",
        answer: "No. Mason focuses on safety upgrades to the existing bathroom. Most installations do not require a major renovation."
      },
      {
        question: "Will the bathroom look clinical?",
        answer: "No. Mason's solution is designed to feel premium and home-first. The goal is to improve safety while preserving the comfort and dignity of the space."
      },
      {
        question: "What packages do you offer?",
        answer: "Mason currently offers two packages: Standard at ₹30,000 and Advanced at ₹37,000. Both install the same complete kit. Advanced adds one technician safety check-up visit during the first year."
      },
      {
        question: "What is included in Standard?",
        answer: "Standard includes the complete 12-item kit: three vertical grab bars, one L / angled grab bar, one folding support bar, one anti-slip treatment, one shower mat, one post-shower mat, one shower stool, one two-way lock, one edge and corner protection treatment, four drainage supports, one pair of bathroom slippers, and one reinforced fixture support. Sensor lighting, SOS hardware, and toilet-seat support are not included."
      },
      {
        question: "What is included in Advanced?",
        answer: "Advanced includes the same complete 12-item installation kit as Standard, plus one technician follow-up visit within the first year. During that visit we inspect the completed work, check for flaws or additional support needs, and cover necessary corrective work or additional support identified during that included visit."
      },
      {
        question: "Can I buy only one product, like a grab bar?",
        answer: "Mason is designed as a package-first service. We focus on complete bathroom safety coverage rather than isolated product installation."
      },
      {
        question: "How does booking work?",
        answer: "Leave your details and a Mason advisor will call to arrange the visit."
      },
      {
        question: "How can I pay?",
        answer: "Our team will confirm the package and payment details with you after your visit request."
      },
      {
        question: "Can I cancel after booking?",
        answer: "Yes. Full refund any time before installation."
      },
      {
        question: "Do you inspect the bathroom before installation?",
        answer: "Yes. Depending on location and logistics, Mason may complete a virtual or physical inspection before installation."
      },
      {
        question: "Does this guarantee that no fall will happen?",
        answer: "No service can guarantee a fall-free outcome. Mason focuses on preventive bathroom safety upgrades that support safer daily movement."
      },
      {
        question: "Who installs the package?",
        answer: "Mason-trained technicians handle the installation, site verification, fitting, and final handover."
      }
    ]
  },
  finalCtaSection: {
    id: "final-cta",
    title: "Book the visit. We'll handle the rest.",
    subtitle: "Act before a fall changes everything. Leave your number and one accountable Mason team handles the rest.",
    primaryCta: "Request a Callback",
    secondaryLabel: "Call +91 98765 43210"
  }
};
