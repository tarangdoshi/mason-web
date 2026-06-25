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
    trustBadges: ["Pre-priced safety packages", "Trained Mason experts", "Doctor-reviewed planning", "Full refund before technician arrival"],
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
    heading: "Prevent the most common home accidents for ageing parents.",
    subcopy:
      "You cannot always be there. Safety can be. Mason Company upgrades existing bathrooms into safer, more comfortable spaces with premium, home-first safety solutions.",
    primaryCta: "Book Free Safety Assessment",
    secondaryCta: "See Packages",
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
      otpBadge: "Full refund before technician arrival or implementation",
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
      "Mason Company upgrades existing bathrooms into safer, calmer spaces for ageing parents. We plan the support points, install the right safety components, and finish the space so it feels premium at home, not clinical.",
    valueTags: ["Grip", "Balance", "Comfort", "Ease"],
    visual: {
      src: "/images/stock-web/upgrades/upgrade-shower-support.jpg",
      alt: "Walk-in shower area illustrating a calmer, easier-to-navigate bathroom layout",
      objectPosition: "50% 50%"
    }
  },
  transformationGallerySection: {
    id: "transformations",
    title: "See what changes in one visit",
    subtitle: "Real before-and-after bathroom safety upgrades designed for everyday confidence.",
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
        kicker: "Bathroom injuries caused by falls",
        value: "81%",
        label: "Bathroom injury data shows falls are the dominant risk around wet zones, toilets, and transfers.",
        context: "The bathroom concentrates several high-risk movements in one room.",
        sourceLabel: "CDC Bathroom Injuries Report",
        sourceId: "cdc-bathroom-injuries",
        ctaLabel: "View Evidence",
        ctaHref: "/evidence"
      },
      {
        id: "ev-card-family-liability",
        kicker: "Potential full recovery cost",
        value: "₹3L-₹10L",
        label: "A serious fall can mean surgery, rehab, home care, transport, and weeks of family coordination.",
        context: "Estimated family impact range based on India injury-cost data and home-care benchmarks.",
        sourceLabel: "LASI cost data + recovery benchmarks",
        sourceId: "family-impact-estimate",
        ctaLabel: "View Evidence",
        ctaHref: "/evidence"
      },
      {
        id: "ev-card-prevention-effect",
        kicker: "Fall-rate reduction",
        value: "26-38%",
        label: "Evidence shows home hazard interventions can reduce fall rates, especially for higher-risk adults.",
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
    title: "From free assessment to a safer bathroom",
    subtitle: "Start with a free home visit or video assessment. Mason reviews your situation, helps you choose the right package when you are ready, and follows up with clear next steps.",
    highlights: ["Clear steps", "Assisted support", "One accountable Mason team from booking to handover"],
    addOnDisclosure: "Clear steps. Assisted support. One accountable Mason team from booking to handover.",
    primaryCta: "Book Free Safety Assessment",
    secondaryCta: "Talk to a Mason Company specialist",
    steps: [
      {
        id: "process-step-1",
        title: "Book your free assessment",
        description: "Share your name, phone, area, and whether you prefer a home visit or video assessment. No package selection is required.",
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
        title: "Team review and follow-up",
        description: "Our team reviews your assessment request and contacts you to schedule the right next step. No payment is taken on the website.",
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
        title: "Assessment and recommendation",
        description: "Mason checks the bathroom routine and risk points, then recommends the package scope that fits best.",
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
        title: "Confirm package and visit",
        description: "Once the recommendation is clear, confident customers can confirm a package and installation visit.",
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
        badge: "ADD_ON",
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
    title: "Understand your package options",
    subtitle: "Packages are shown for pricing and scope clarity. If you are unsure which one fits, start with a free safety assessment first.",
    features: [
      { id: "vertical-grab-bars", label: "3 vertical grab bars", description: "Support at key standing and movement points." },
      { id: "angled-grab-bar", label: "1 L / angled grab bar", description: "Angled support for reaching and turning." },
      { id: "folding-bar", label: "1 flip-up / folding bar", description: "Foldable support where access and clearance matter." },
      { id: "anti-slip-coating", label: "Anti-slip coating", description: "Slip reduction on existing surfaces." },
      { id: "anti-slip-mats", label: "2 anti-slip mats", description: "Extra grip in wet zones." },
      { id: "commode-support", label: "Toilet seat / raised seat / commode support", description: "Additional sit-stand support for toilet use." },
      { id: "shower-stool", label: "Shower seating stool", description: "Seated shower support." },
      { id: "sensor-lighting", label: "Sensor lighting", description: "Motion-triggered night lighting." },
      { id: "two-way-lock", label: "Two-way lock", description: "Safer access and family response support." },
      { id: "corner-safety", label: "8-corner equivalent corner safety solution", description: "Protective corner treatment." },
      { id: "drainage-solution", label: "4 drainage solutions", description: "Drainage support without redesign." },
      { id: "slippers-one", label: "1 pair bathroom slippers", description: "Bathroom-use slippers included." },
      { id: "slippers-two", label: "2 pairs bathroom slippers", description: "Additional bathroom-use slippers included." },
      { id: "total-support-solution", label: "Total support solution: 3 sizes, 4 quantity", description: "Support accessories across common movement zones." }
    ],
    plans: [
      {
        id: "package-standard",
        name: "Standard",
        badge: "Core safety upgrade",
        titleDescriptor: "Everyday safety",
        isFeatured: false,
        bestFor: "Families who want the essential support and slip-risk upgrades for everyday bathroom use.",
        outcome: "A complete everyday safety upgrade for steadier movement, better grip, and more confidence at home.",
        price: "Standard",
        savings: "Core package",
        visual: {
          src: "/images/hero/transformed-bathroom-desktop.jpg",
          alt: "Bathroom with essential safety upgrades for the Standard package",
          objectPosition: "50% 52%"
        },
        visualHighlights: ["Grab support", "Wet-zone grip", "Night-time visibility"],
        includedFeatureIds: [
          "vertical-grab-bars",
          "angled-grab-bar",
          "folding-bar",
          "anti-slip-coating",
          "anti-slip-mats",
          "shower-stool",
          "sensor-lighting",
          "two-way-lock",
          "corner-safety",
          "drainage-solution",
          "slippers-one",
          "total-support-solution"
        ],
        ctaLabel: "Continue with Standard"
      },
      {
        id: "package-advanced",
        name: "Advanced",
        badge: "Premium safety upgrade",
        titleDescriptor: "Full Mason safety setup",
        isFeatured: true,
        bestFor: "Families who want the full Mason safety setup with added comfort, premium finishes, and stronger sit-stand support.",
        outcome: "A more complete and premium bathroom safety upgrade, with stronger support for higher-risk daily routines.",
        price: "Advanced",
        savings: "Premium package",
        visual: {
          src: "/images/stock-web/upgrades/upgrade-shower-support.jpg",
          alt: "Bathroom with broader safety support for the Advanced package",
          objectPosition: "50% 48%"
        },
        visualHighlights: ["PVD-coated bars", "Raised-seat support", "Premium mats"],
        includedFeatureIds: [
          "vertical-grab-bars",
          "angled-grab-bar",
          "folding-bar",
          "anti-slip-coating",
          "anti-slip-mats",
          "commode-support",
          "shower-stool",
          "sensor-lighting",
          "two-way-lock",
          "corner-safety",
          "drainage-solution",
          "slippers-two",
          "total-support-solution"
        ],
        ctaLabel: "Continue with Advanced"
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
        description: "Our safety approach is shaped with doctor inputs, preventive mobility guidance, and senior-care context."
      },
      {
        title: "Trained Mason experts",
        description: "Every visit is handled by trained technicians who understand support placement, secure fitting, and family handover."
      },
      {
        title: "One accountable team",
        description: "From package selection to inspection, installation, and follow-up, Mason Company stays responsible for the outcome."
      },
      {
        title: "Premium, home-first finish",
        description: "The solution is built to feel calm and considered, not hospital-like or temporary."
      },
      {
        title: "Evidence-led prevention",
        description: "We study fall-risk patterns, hospital safety practices, and assisted-care environments to design practical home upgrades."
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
        city: "Delhi",
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
        city: "Gurgaon",
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
        city: "Mumbai",
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
    title: "Frequently Asked Questions",
    subtitle: "Clear answers before you book your Mason safety upgrade.",
    items: [
      {
        question: "What does Mason Company do?",
        answer: "Mason Company upgrades existing bathrooms with safety components such as grab bars, anti-slip solutions, support accessories, lighting, drainage support, corner protection, and package-specific senior-friendly additions."
      },
      {
        question: "Who is Mason Company for?",
        answer: "Mason is designed for families with ageing parents, seniors living independently, people with balance concerns, and households that want to reduce bathroom risk before an incident happens."
      },
      {
        question: "Will the bathroom look clinical?",
        answer: "No. Mason's solution is designed to feel premium and home-first. The goal is to improve safety while preserving the comfort and dignity of the space."
      },
      {
        question: "What packages do you offer?",
        answer: "Mason currently offers two packages: Standard and Advanced. Standard covers core safety needs. Advanced adds premium finish details and additional support components."
      },
      {
        question: "What is included in Standard?",
        answer: "Standard includes grab bars, anti-slip coating, anti-slip mats, shower seating, sensor lighting, two-way lock, corner safety, drainage support, bathroom slippers, and total support solutions."
      },
      {
        question: "What is included in Advanced?",
        answer: "Advanced includes everything in Standard, plus PVD-coated grab bars, toilet seat / raised seat / commode support, premium-looking mats, and additional bathroom slippers."
      },
      {
        question: "How does booking and payment work?",
        answer:
          "Most families start with a free safety assessment. Mason then helps confirm the right package and next step. If you already know what you need, you can submit a package booking request through checkout. The website does not currently collect payment or automatically issue a payment link."
      },
      {
        question: "Can I cancel after booking?",
        answer: "Yes. If you cancel before the technician arrives or starts implementation, you are eligible for a full refund."
      },
      {
        question: "Do you inspect the bathroom before installation?",
        answer: "Yes. Depending on location and logistics, Mason may complete a virtual or physical inspection before installation."
      },
      {
        question: "Does this guarantee that no fall will happen?",
        answer: "No service can guarantee a fall-free outcome. Mason focuses on preventive bathroom safety upgrades that support safer daily movement."
      }
    ]
  },
  finalCtaSection: {
    id: "final-cta",
    title: "Give your parents a safer bathroom that still feels like home.",
    subtitle: "Start with a free safety assessment, or compare packages if you already know what you need.",
    primaryCta: "Book Free Safety Assessment",
    secondaryLabel: "Call +91 98765 43210"
  }
};
