import type { InternalScript } from "./types";
import { tokens } from "./variables";

export const internalScripts: InternalScript[] = [
  {
    id: "script-callback-consultation",
    name: "Callback consultation script",
    objective: "Convert inquiry into direct package booking with confidence.",
    channel: "CALL",
    audience: "BUYER_CHILD",
    steps: [
      {
        speaker: "AGENT",
        line: `Hello ${tokens.customer_name}, this is Mason Company support. I am here to help you choose the right package for your family in ${tokens.city}.`
      },
      {
        speaker: "AGENT",
        line: "At Mason Company, you do not buy individual products. You select a complete safety solution with transparent pricing."
      },
      {
        speaker: "AGENT",
        line: `For your requirement, ${tokens.package_name} is a strong fit at ${tokens.package_price}.`
      },
      {
        speaker: "AGENT",
        line: "Would you like to confirm booking now with online payment or pay on installation with a ₹500 assisted collection fee?"
      }
    ],
    escalationRule: "If customer asks medical questions, route to doctor attestation team and avoid treatment advice."
  },
  {
    id: "script-booking-closure",
    name: "Booking closure script",
    objective: "Close booking with complete expectation-setting.",
    channel: "CALL",
    audience: "BUYER_CHILD",
    steps: [
      {
        speaker: "AGENT",
        line: `Your booking is confirmed as ${tokens.order_number} for ${tokens.package_name}.`
      },
      {
        speaker: "AGENT",
        line: `Visit window is ${tokens.visit_date}, ${tokens.visit_time_slot}.`
      },
      {
        speaker: "AGENT",
        line: `Payment mode selected is ${tokens.payment_mode}. If pay-on-installation, accepted methods are ${tokens.collection_method}.`
      },
      {
        speaker: "AGENT",
        line: "You will receive OTP-based verification messages at arrival and completion."
      }
    ],
    escalationRule: "If schedule conflict occurs, offer nearest alternate slot before closing call."
  },
  {
    id: "script-pre-visit-confirmation",
    name: "Pre-visit confirmation script",
    objective: "Ensure household readiness and reduce no-shows.",
    channel: "CALL",
    audience: "FAMILY_DECISION_UNIT",
    steps: [
      {
        speaker: "AGENT",
        line: `Confirming Mason Company visit for ${tokens.order_number} on ${tokens.visit_date}, ${tokens.visit_time_slot}.`
      },
      {
        speaker: "AGENT",
        line: `Your assigned expert is ${tokens.technician_name}.`
      },
      {
        speaker: "AGENT",
        line: "Please keep one family decision-maker available for walkthrough and OTP verification."
      }
    ],
    escalationRule: "If household is unavailable, reschedule immediately and trigger confirmation template again."
  },
  {
    id: "script-arrival-otp-explanation",
    name: "On-arrival OTP explanation script",
    objective: "Securely authenticate technician and build doorstep trust.",
    channel: "ONSITE",
    audience: "FAMILY_DECISION_UNIT",
    steps: [
      {
        speaker: "TECHNICIAN",
        line: `Good morning, I am ${tokens.technician_name} from Mason Company for booking ${tokens.order_number}.`
      },
      {
        speaker: "TECHNICIAN",
        line: `Please share the arrival OTP now: ${tokens.otp_code}.`
      },
      {
        speaker: "TECHNICIAN",
        line: "This OTP confirms secure start of work and protects your family from unauthorized visits."
      }
    ],
    escalationRule: "If OTP mismatch persists, pause work and call central support before proceeding."
  },
  {
    id: "script-post-installation-handover",
    name: "Post-installation handover script",
    objective: "Close installation with confidence and payment clarity.",
    channel: "ONSITE",
    audience: "FAMILY_DECISION_UNIT",
    steps: [
      {
        speaker: "TECHNICIAN",
        line: `Installation for ${tokens.order_number} is complete. Let us do a final walkthrough together.`
      },
      {
        speaker: "TECHNICIAN",
        line: `Your payable amount is ${tokens.amount_paid} via ${tokens.collection_method}.`
      },
      {
        speaker: "TECHNICIAN",
        line: `Please share completion OTP ${tokens.otp_code} only after you are satisfied.`
      },
      {
        speaker: "TECHNICIAN",
        line: `For future help, call ${tokens.support_phone} or WhatsApp ${tokens.support_whatsapp}.`
      }
    ],
    escalationRule: "If dissatisfaction is raised, open grievance ticket before leaving premises."
  },
  {
    id: "script-grievance-de-escalation",
    name: "Grievance de-escalation script",
    objective: "Acknowledge concern, restore trust, and set resolution timeline.",
    channel: "CALL",
    audience: "BUYER_CHILD",
    steps: [
      {
        speaker: "AGENT",
        line: "Thank you for reporting this. I understand this is important for your family."
      },
      {
        speaker: "AGENT",
        line: `Your grievance is logged as ${tokens.grievance_ticket_id} for booking ${tokens.order_number}.`
      },
      {
        speaker: "AGENT",
        line: "I will now confirm the exact issue category and priority so we can resolve this quickly."
      },
      {
        speaker: "AGENT",
        line: "You will receive the next update within the committed timeline."
      }
    ],
    escalationRule: "Escalate immediately to operations lead for safety-critical complaints."
  }
];
