import type { MessagingGuardrails } from "./types";
import { complianceLibrary } from "./compliance";

export const brandVoiceGuardrails: MessagingGuardrails = {
  voiceSummary:
    "Emotionally reassuring and lifestyle-forward communication for family decision-makers, focused on confidence, dignity, and practical safety outcomes.",
  allowedPatterns: [
    "Use language that protects dignity: independent routines, confidence, comfort, control.",
    "Anchor every claim in clear process steps, visible upgrades, and transparent package pricing.",
    "Keep calls-to-action decisive and practical: Book Package, Confirm Visit Slot, Verify OTP.",
    "Use family reassurance framing without fear escalation.",
    "Prefer concrete operational details over abstract promises."
  ],
  bannedPatterns: [
    "Do not use fear-heavy statements that shame aging or mobility changes.",
    "Do not promise guaranteed prevention of falls, injuries, or hospitalizations.",
    "Do not imply doctor attestation is a diagnosis or medical prescription.",
    "Do not position Mason Company as a product catalog or bargain retail marketplace.",
    "Do not hide payment conditions or collection methods in fine print."
  ],
  proofPolicy: [
    "Use conservative, evidence-informed wording for health and financial impact.",
    complianceLibrary.medicalDisclaimer,
    complianceLibrary.outcomeDisclaimer,
    complianceLibrary.doctorAttestationUse,
    complianceLibrary.testimonialUse
  ]
};
