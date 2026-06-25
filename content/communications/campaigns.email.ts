import type { CampaignAssetSet } from "./types";

export const emailCampaignAssets: CampaignAssetSet = {
  channel: "EMAIL",
  objective:
    "Lifecycle nurture from awareness to reactivation. Channel-ready content; user email capture integration pending.",
  destination: "/compare-packages#packages",
  assets: [
    {
      theme: "Email 01 - Awareness",
      audience: "BUYER_CHILD",
      subjectLines: ["A practical way to make bathrooms safer for your family"],
      bodyLines: [
        "Mason Company helps families in Mumbai and Goa choose complete bathroom safety packages with transparent pricing.",
        "No product confusion. No hidden workflow. Just a clear path from booking to installation.",
        "Explore package options built for confident, dignified daily routines."
      ],
      cta: "Explore Packages",
      destination: "/compare-packages#packages"
    },
    {
      theme: "Email 02 - Process Education",
      audience: "BUYER_CHILD",
      subjectLines: ["How Mason Company works: from booking to verified completion"],
      bodyLines: [
        "Every booking follows a five-step pathway including mandatory doctor video inspection and OTP verification.",
        "This keeps families informed at every stage and improves decision confidence.",
        "See the complete process before you book."
      ],
      cta: "View How It Works",
      destination: "/#how-it-works"
    },
    {
      theme: "Email 03 - Package Comparison",
      audience: "BUYER_CHILD",
      subjectLines: ["Which package fits your home best?"],
      bodyLines: [
        "Compare packages by bathroom coverage, benefits, and likely downside if delayed.",
        "Each package is pre-priced so decisions are fast and clear.",
        "Choose your package and lock your preferred visit slot."
      ],
      cta: "Compare Packages",
      destination: "/compare-packages#packages"
    },
    {
      theme: "Email 04 - Trust Proof",
      audience: "FAMILY_DECISION_UNIT",
      subjectLines: ["Why families trust Mason Company for bathroom safety upgrades"],
      bodyLines: [
        "Mason Company combines own technicians, doctor attestation context, and OTP-authenticated service milestones.",
        "Families can review testimonials and process checkpoints before booking.",
        "Built for dignity, clarity, and practical execution."
      ],
      cta: "See Family Stories",
      destination: "/#outcomes"
    },
    {
      theme: "Email 05 - Booking Nudge",
      audience: "BUYER_CHILD",
      subjectLines: ["Your package options are ready when you are"],
      bodyLines: [
        "If you are still deciding, our specialists can help you finalize the right package in one quick conversation.",
        "You can pay online or choose pay on installation through UPI, POS, or Cash with a ₹500 assisted collection fee.",
        "Book now to secure your preferred slot."
      ],
      cta: "Book Package",
      destination: "/compare-packages#packages"
    },
    {
      theme: "Email 06 - Payment Assurance",
      audience: "BUYER_CHILD",
      subjectLines: ["Payment clarity before installation"],
      bodyLines: [
        "Your selected package price is shown before booking confirmation.",
        "Mason Company supports online payments and pay-on-installation options.",
        "Every payment update is communicated through verified channels."
      ],
      cta: "Review Payment Options",
      destination: "/compare-packages#packages"
    },
    {
      theme: "Email 07 - Six-Month Add-on",
      audience: "BUYER_CHILD",
      subjectLines: ["Keep safety performance high with Mason Company Care check-in"],
      bodyLines: [
        "A six-month check-in helps maintain long-term effectiveness of your bathroom safety setup.",
        "Mason Company Care check-ins are available as a paid add-on.",
        "Schedule your next preventive review."
      ],
      cta: "Book Check-in",
      destination: "/#book-visit"
    },
    {
      theme: "Email 08 - Reactivation",
      audience: "BUYER_CHILD",
      subjectLines: ["Still planning a safer bathroom setup?"],
      bodyLines: [
        "If your family needs have changed, you can revisit Mason Company package options any time.",
        "Our team can help you restart from package selection in one call.",
        "Take the next step when you are ready."
      ],
      cta: "Return to Packages",
      destination: "/compare-packages#packages"
    }
  ]
};
