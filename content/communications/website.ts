import type { WebsiteCommunicationPack } from "./types";
import { complianceLibrary } from "./compliance";

export const websiteCommunicationPack: WebsiteCommunicationPack = {
  hero: {
    headline: "A safer bathroom, with dignity intact.",
    subcopy:
      "Mason helps families make bathrooms safer by starting with a free assessment, then recommending the right package when the need is clear.",
    trustBadges: [
      "Free assessment before package selection",
      "Own verified technicians",
      "OTP-authenticated arrival and completion",
      "Package checkout available for confident customers"
    ],
    primaryCtas: ["Book Free Safety Assessment", "Request Assessment", "Schedule Assessment"],
    secondaryCtas: ["Compare Packages", "Talk to Specialist", "Continue with Package"]
  },
  process: {
    title: "How Mason Company Works",
    intro:
      "From free assessment to installation, every step is designed to reduce decision stress for families and improve confidence for older adults.",
    stepMicrocopy: [
      "Request a free home visit or video assessment without selecting a package.",
      "Mason reviews the bathroom routine, risk points, and family concerns.",
      "The team recommends the right package scope before installation.",
      "Confident customers can also continue directly with package checkout.",
      "Add six-month check-ins to help the space stay reliable over time."
    ]
  },
  packages: {
    sectionTitle: "Understand complete safety packages",
    sectionSubcopy:
      "Each package shows the likely scope and inclusions. Families who are unsure should start with the free assessment before choosing.",
    valueFramingBullets: [
      "Clear package-level scope before booking",
      "Before/after visuals to show real improvement",
      "Assessment-first guidance for families who need help choosing",
      "Single accountable team from inspection to installation"
    ],
    paymentNote:
      "At checkout, families can choose online payment or pay on installation using UPI, POS, or Cash. Pay on installation includes a ₹500 assisted collection fee."
  },
  whyAegis: {
    title: "Why families choose Mason Company",
    points: [
      {
        title: "Decision clarity",
        description:
          "Families compare complete outcomes instead of juggling a long list of product choices."
      },
      {
        title: "Respectful design",
        description:
          "Upgrades are positioned as confidence and comfort improvements, not age labels."
      },
      {
        title: "Verified execution",
        description:
          "Own technicians, OTP verification, and transparent process checkpoints build trust."
      },
      {
        title: "Medical context",
        description:
          "Doctor attestation adds preventive safety context while maintaining conservative claims."
      }
    ]
  },
  testimonials: {
    title: "Family confidence stories",
    framingCopy:
      "Real buyer experiences focused on steadier routines, better confidence, and smoother family decision-making.",
    legalNote: complianceLibrary.testimonialUse
  },
  doctorAttestation: {
    title: "Doctor attestation",
    framingCopy:
      "Featured doctors share preventive mobility guidance on reducing avoidable bathroom risk through practical home upgrades.",
    disclaimer: complianceLibrary.medicalDisclaimer
  },
  otpTrust: {
    title: "Why OTP verification matters",
    lines: [
      "Arrival OTP confirms the right technician has reached your home.",
      "Completion OTP confirms work closure only after household review.",
      "No OTP should be shared outside the verified household contact."
    ]
  },
  support: {
    title: "Support and grievance resolution",
    lines: [
      "Every concern is acknowledged with a ticket ID and callback timeline.",
      "Support teams stay available on call and WhatsApp through completion.",
      "Escalation paths are defined for schedule, quality, and payment issues."
    ]
  },
  ctaBank: {
    sticky: ["Book Free Safety Assessment", "Request Assessment", "Get Safety Guidance"],
    card: ["Continue with This Package", "Compare Package Scope", "Proceed if Ready"],
    nav: ["How It Works", "Compare Packages", "Book Assessment"]
  },
  faq: [
    {
      question: "Is Mason Company selling products or a complete service?",
      answer:
        "Mason Company is an assessment-first service that recommends an end-to-end bathroom safety package after understanding the household need."
    },
    {
      question: "How do I choose the right package?",
      answer:
        "Start with the free assessment if you are unsure. Package comparison is available for families who already know the scope they want."
    },
    {
      question: "Do you provide service in Mumbai and Goa?",
      answer: "Yes. Current launch markets are Mumbai and Goa, with city-specific package options."
    },
    {
      question: "Can I pay after installation?",
      answer:
        "Yes. At booking, choose either online payment or pay on installation via UPI, POS, or Cash. Pay on installation includes a ₹500 assisted collection fee."
    },
    {
      question: "Why is OTP verification used?",
      answer:
        "OTP validates technician arrival and completion so families have a secure checkpoint before and after work."
    },
    {
      question: "Is doctor video inspection optional?",
      answer:
        "No. The doctor video inspection is a mandatory process step in the current Mason Company workflow."
    },
    {
      question: "How long does installation take?",
      answer:
        "Most package installations are completed in a single scheduled visit, depending on site conditions and package scope."
    },
    {
      question: "Will this guarantee that no fall happens in future?",
      answer:
        "No service can guarantee incident-free outcomes. Mason Company focuses on preventive safety upgrades that support safer daily movement."
    },
    {
      question: "Are your technicians third-party contractors?",
      answer:
        "No. Mason Company uses own technicians trained in package SOPs and OTP-authenticated service flow."
    },
    {
      question: "How are testimonials and doctor statements verified?",
      answer:
        "Only approved testimonials and verified doctor attestations are published after moderation and legal review."
    },
    {
      question: "What if I have a complaint after installation?",
      answer:
        "Mason Company support raises a grievance ticket, shares an update timeline, and provides escalation if needed."
    },
    {
      question: "Is there any long-term follow-up?",
      answer:
        "Yes. A six-month check-in is available through the paid Mason Company Care add-on plan."
    }
  ]
};
