import { homepageContent } from "./homepage.content";
import type { HomepageContent } from "./types";

export const comparePackagesContent: HomepageContent = {
  ...homepageContent,
  riskQuizSection: {
    ...homepageContent.riskQuizSection,
    subtitle: "Four quick questions to understand likely fit before Mason confirms the right recommendation.",
    intro: "Use this to understand likely needs. For the safest fit, book a free assessment.",
    bands: [
      {
        id: "low",
        min: 0,
        max: 24,
        label: "Low",
        summary: "Standard can cover the main risk points.",
        recommendedPlan: "Standard"
      },
      {
        id: "moderate",
        min: 25,
        max: 59,
        label: "Moderate",
        summary: "Advanced is better for broader daily support.",
        recommendedPlan: "Advanced"
      },
      {
        id: "high",
        min: 60,
        max: 100,
        label: "High",
        summary: "Advanced is best for higher-risk routines.",
        recommendedPlan: "Advanced"
      }
    ]
  },
  processSection: {
    ...homepageContent.processSection,
    addOnDisclosure: "AMC care follow-up available as an add-on."
  },
  packagesSection: {
    title: "Compare package options",
    subtitle: "Use this page for clarity on scope and pricing. Most families should start with a free assessment before choosing.",
    features: homepageContent.packagesSection.features,
    addOnFeatures: [
      {
        id: "amc-recheck",
        label: "AMC care plan",
        description: "Optional follow-up support to keep installed safety components reliable after handover.",
        benefits: [
          "Periodic post-installation health check",
          "Re-tightening and alignment review",
          "Wear-and-tear inspection of installed support points",
          "Priority support follow-up scheduling"
        ]
      }
    ],
    plans: homepageContent.packagesSection.plans.map((plan) => ({
      ...plan,
      availableAddOnIds: ["amc-recheck"]
    }))
  }
};
