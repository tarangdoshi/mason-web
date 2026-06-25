import type { CampaignAssetSet } from "./types";

export const whatsappCampaignAssets: CampaignAssetSet = {
  channel: "WHATSAPP",
  objective: "Generate direct package bookings through broadcast and retargeting nudges.",
  destination: "/compare-packages#packages",
  assets: [
    {
      theme: "Awareness 01",
      audience: "BUYER_CHILD",
      messages: [
        "Mason Company now helps families in Mumbai and Goa make bathrooms safer with complete packages. See pricing and book directly in minutes."
      ],
      cta: "View Packages",
      destination: "/compare-packages#packages"
    },
    {
      theme: "Awareness 02",
      audience: "FAMILY_DECISION_UNIT",
      messages: [
        "Your family does not need product confusion. Mason Company offers one complete bathroom safety solution with transparent pricing."
      ],
      cta: "Compare Packages",
      destination: "/compare-packages#packages"
    },
    {
      theme: "Awareness 03",
      audience: "BUYER_CHILD",
      messages: [
        "Lifestyle-first safety upgrades are now one booking away. Explore Mason Company package options for Mumbai and Goa."
      ],
      cta: "Book Package",
      destination: "/compare-packages#packages"
    },
    {
      theme: "Consideration 01",
      audience: "BUYER_CHILD",
      messages: [
        "Mason Company process includes mandatory doctor video inspection, onsite expert checks, and OTP-authenticated service milestones."
      ],
      cta: "See How It Works",
      destination: "/#how-it-works"
    },
    {
      theme: "Consideration 02",
      audience: "BUYER_CHILD",
      messages: [
        "Each Mason Company package shows before/after visuals plus losses if delayed so families can decide with clarity, not pressure."
      ],
      cta: "Choose Your Package",
      destination: "/compare-packages#packages"
    },
    {
      theme: "Consideration 03",
      audience: "FAMILY_DECISION_UNIT",
      messages: [
        "Pay online or choose pay-on-installation with UPI, POS, or Cash. Your payment choice is locked before visit confirmation."
      ],
      cta: "Book with Confidence",
      destination: "/compare-packages#packages"
    },
    {
      theme: "Urgency 01",
      audience: "BUYER_CHILD",
      messages: [
        "If bathroom routines already feel uncertain, delaying safety upgrades can increase avoidable stress. Book your Mason Company package today."
      ],
      cta: "Book Today",
      destination: "/compare-packages#packages"
    },
    {
      theme: "Urgency 02",
      audience: "BUYER_CHILD",
      messages: [
        "Slots for this week are filling. Confirm your package and preferred visit window now for Mumbai/Goa coverage."
      ],
      cta: "Secure Slot",
      destination: "/#book-visit"
    },
    {
      theme: "Follow-up 01",
      audience: "BUYER_CHILD",
      messages: [
        "Still deciding? Mason Company specialists can help you pick the right package in one callback."
      ],
      cta: "Talk to Specialist",
      destination: "/#book-visit"
    },
    {
      theme: "Follow-up 02",
      audience: "BUYER_CHILD",
      messages: [
        "Families who choose package-first booking avoid product confusion and move to installation faster. Explore Mason Company packages now."
      ],
      cta: "Return to Packages",
      destination: "/compare-packages#packages"
    }
  ]
};
