import type { CommunicationTemplate } from "./types";
import { complianceLibrary } from "./compliance";
import { tokens } from "./variables";

export const transactionalWhatsAppTemplates: CommunicationTemplate[] = [
  {
    id: "wa-order-placed",
    name: "Booking received",
    channel: "WHATSAPP",
    audience: "BUYER_CHILD",
    objective: "Acknowledge successful package booking and reduce uncertainty.",
    lifecycleEvent: "ORDER_PLACED",
    body:
      `Hi ${tokens.customer_name}, your Mason Company booking ${tokens.order_number} is received for ${tokens.package_name} in ${tokens.city}.\n` +
      `Package value: ${tokens.package_price}.\n` +
      "Our team will confirm your visit slot shortly.",
    ctaLabel: "View Packages",
    ctaUrl: "#package-comparison",
    variables: ["customer_name", "order_number", "package_name", "city", "package_price"]
  },
  {
    id: "wa-order-confirmed",
    name: "Booking confirmed with schedule",
    channel: "WHATSAPP",
    audience: "BUYER_CHILD",
    objective: "Confirm visit schedule and keep customer prepared.",
    lifecycleEvent: "ORDER_CONFIRMED",
    body:
      `Your Mason Company booking ${tokens.order_number} is confirmed.\n` +
      `Visit: ${tokens.visit_date}, ${tokens.visit_time_slot}.\n` +
      `Package: ${tokens.package_name} (${tokens.package_price}).\n` +
      `Payment mode selected: ${tokens.payment_mode}.`,
    ctaLabel: "Talk to Specialist",
    ctaUrl: "#book-visit",
    variables: [
      "order_number",
      "visit_date",
      "visit_time_slot",
      "package_name",
      "package_price",
      "payment_mode"
    ]
  },
  {
    id: "wa-tech-assigned",
    name: "Technician assigned",
    channel: "WHATSAPP",
    audience: "FAMILY_DECISION_UNIT",
    objective: "Provide accountability by sharing assigned technician details.",
    lifecycleEvent: "TECH_ASSIGNED",
    body:
      `Mason Company update for ${tokens.order_number}: ${tokens.technician_name} is assigned for your ${tokens.package_name} visit in ${tokens.city}.\n` +
      `Scheduled slot: ${tokens.visit_date}, ${tokens.visit_time_slot}.`,
    ctaLabel: "Support on WhatsApp",
    ctaUrl: "#book-visit",
    variables: ["order_number", "technician_name", "package_name", "city", "visit_date", "visit_time_slot"]
  },
  {
    id: "wa-tech-en-route",
    name: "Technician en route with OTP reminder",
    channel: "WHATSAPP",
    audience: "BUYER_CHILD",
    objective: "Prepare household for secure technician arrival.",
    lifecycleEvent: "TECH_EN_ROUTE",
    body:
      `${tokens.technician_name} is on the way for booking ${tokens.order_number}.\n` +
      `Please keep arrival OTP ready: ${tokens.otp_code}.\n` +
      `Share OTP only after technician identity is verified at doorstep.`,
    ctaLabel: "Need Help",
    ctaUrl: "#book-visit",
    variables: ["technician_name", "order_number", "otp_code"],
    complianceNotes: [complianceLibrary.otpClarity]
  },
  {
    id: "wa-visit-started",
    name: "Visit started",
    channel: "WHATSAPP",
    audience: "FAMILY_DECISION_UNIT",
    objective: "Confirm onsite work start and maintain trust.",
    lifecycleEvent: "VISIT_IN_PROGRESS",
    body:
      `Mason Company work has started for ${tokens.order_number}.\n` +
      `${tokens.technician_name} is currently executing the ${tokens.package_name} workflow.\n` +
      "You will receive completion confirmation after final walkthrough.",
    ctaLabel: "Contact Support",
    ctaUrl: "#book-visit",
    variables: ["order_number", "technician_name", "package_name"]
  },
  {
    id: "wa-work-completed",
    name: "Work completed with completion OTP",
    channel: "WHATSAPP",
    audience: "BUYER_CHILD",
    objective: "Confirm completion with secure OTP closure.",
    lifecycleEvent: "WORK_COMPLETED",
    body:
      `Your Mason Company package installation for ${tokens.order_number} is complete.\n` +
      `Please review the final setup and share completion OTP ${tokens.otp_code} only when satisfied.\n` +
      `For support: ${tokens.support_phone}.`,
    ctaLabel: "Raise Support",
    ctaUrl: "#book-visit",
    variables: ["order_number", "otp_code", "support_phone"]
  },
  {
    id: "wa-payment-collection-request",
    name: "Pay-on-installation collection request",
    channel: "WHATSAPP",
    audience: "BUYER_CHILD",
    objective: "Collect payment with complete transparency.",
    lifecycleEvent: "PAYMENT_COLLECTION_REQUEST",
    body:
      `Payment request for ${tokens.order_number}: ${tokens.amount_paid}.\n` +
      `Collection method: ${tokens.collection_method} (${tokens.payment_mode}).\n` +
      "Please make payment only after completion confirmation.",
    ctaLabel: "Payment Support",
    ctaUrl: "#book-visit",
    variables: ["order_number", "amount_paid", "collection_method", "payment_mode"],
    complianceNotes: [complianceLibrary.paymentClarity]
  },
  {
    id: "wa-payment-received",
    name: "Payment received",
    channel: "WHATSAPP",
    audience: "BUYER_CHILD",
    objective: "Confirm successful payment and close transaction anxiety.",
    lifecycleEvent: "PAYMENT_RECEIVED",
    body:
      `Payment received for ${tokens.order_number}.\n` +
      `Amount: ${tokens.amount_paid} via ${tokens.collection_method}.\n` +
      "Thank you for choosing Mason Company.",
    ctaLabel: "Explore Care Add-on",
    ctaUrl: "#package-comparison",
    variables: ["order_number", "amount_paid", "collection_method"]
  },
  {
    id: "wa-online-payment-success",
    name: "Online payment success",
    channel: "WHATSAPP",
    audience: "BUYER_CHILD",
    objective: "Reassure customer after successful online transaction.",
    lifecycleEvent: "ONLINE_PAYMENT_SUCCESS",
    body:
      `Your online payment is successful for booking ${tokens.order_number}.\n` +
      `Amount: ${tokens.amount_paid}.\n` +
      `Scheduled visit remains ${tokens.visit_date}, ${tokens.visit_time_slot}.`,
    ctaLabel: "View Process",
    ctaUrl: "#how-it-works",
    variables: ["order_number", "amount_paid", "visit_date", "visit_time_slot"]
  },
  {
    id: "wa-online-payment-failed",
    name: "Online payment failed",
    channel: "WHATSAPP",
    audience: "BUYER_CHILD",
    objective: "Recover failed payments and preserve booking conversion.",
    lifecycleEvent: "ONLINE_PAYMENT_FAILED",
    body:
      `Your online payment for ${tokens.order_number} did not go through.\n` +
      "Your booking can still continue with pay-on-installation.\n" +
      `Need assistance? Call ${tokens.support_phone} or WhatsApp ${tokens.support_whatsapp}.`,
    ctaLabel: "Retry with Help",
    ctaUrl: "#book-visit",
    variables: ["order_number", "support_phone", "support_whatsapp"]
  },
  {
    id: "wa-order-cancelled",
    name: "Booking cancelled",
    channel: "WHATSAPP",
    audience: "BUYER_CHILD",
    objective: "Provide closure and clear next steps after cancellation.",
    lifecycleEvent: "ORDER_CANCELLED",
    body:
      `Booking ${tokens.order_number} for ${tokens.package_name} has been cancelled as requested.\n` +
      "If this was accidental, our team can help you rebook quickly.",
    ctaLabel: "Rebook Package",
    ctaUrl: "#package-comparison",
    variables: ["order_number", "package_name"]
  },
  {
    id: "wa-partial-refund",
    name: "Partial refund initiated",
    channel: "WHATSAPP",
    audience: "BUYER_CHILD",
    objective: "Build trust through transparent partial refund communication.",
    lifecycleEvent: "PARTIAL_REFUND_INITIATED",
    body:
      `Partial refund initiated for ${tokens.order_number}.\n` +
      `Refund amount: ${tokens.refund_amount}.\n` +
      `Expected timeline: ${tokens.refund_eta}.`,
    ctaLabel: "Contact Billing Support",
    ctaUrl: "#book-visit",
    variables: ["order_number", "refund_amount", "refund_eta"]
  },
  {
    id: "wa-full-refund",
    name: "Full refund initiated",
    channel: "WHATSAPP",
    audience: "BUYER_CHILD",
    objective: "Provide full refund clarity and support confidence.",
    lifecycleEvent: "FULL_REFUND_INITIATED",
    body:
      `Full refund initiated for ${tokens.order_number}.\n` +
      `Refund amount: ${tokens.refund_amount}.\n` +
      `Expected timeline: ${tokens.refund_eta}.`,
    ctaLabel: "Need More Help",
    ctaUrl: "#book-visit",
    variables: ["order_number", "refund_amount", "refund_eta"]
  },
  {
    id: "wa-six-month-checkin-invite",
    name: "Six-month check-in add-on invite",
    channel: "WHATSAPP",
    audience: "BUYER_CHILD",
    objective: "Promote paid six-month effectiveness check-in add-on.",
    lifecycleEvent: "SIX_MONTH_CHECKIN_INVITE",
    body:
      `It has been six months since booking ${tokens.order_number}.\n` +
      "Keep bathroom safety performance high with Mason Company Care Check-in (paid add-on).\n" +
      `Reply YES to schedule in ${tokens.city}.`,
    ctaLabel: "Book Check-in",
    ctaUrl: "#book-visit",
    variables: ["order_number", "city"]
  },
  {
    id: "wa-grievance-acknowledged",
    name: "Grievance acknowledged",
    channel: "WHATSAPP",
    audience: "BUYER_CHILD",
    objective: "Acknowledge complaint with traceable grievance ticket.",
    lifecycleEvent: "GRIEVANCE_ACKNOWLEDGED",
    body:
      `Your concern has been logged with ticket ${tokens.grievance_ticket_id} for booking ${tokens.order_number}.\n` +
      "Our support team will share the next update within the committed timeline.",
    ctaLabel: "Talk to Support",
    ctaUrl: "#book-visit",
    variables: ["grievance_ticket_id", "order_number"],
    complianceNotes: [complianceLibrary.grievanceClarity]
  },
  {
    id: "wa-grievance-resolved",
    name: "Grievance resolved",
    channel: "WHATSAPP",
    audience: "BUYER_CHILD",
    objective: "Close grievance ticket with confidence and transparency.",
    lifecycleEvent: "GRIEVANCE_RESOLVED",
    body:
      `Ticket ${tokens.grievance_ticket_id} linked to ${tokens.order_number} is now marked resolved.\n` +
      `If you need further help, call ${tokens.support_phone} or WhatsApp ${tokens.support_whatsapp}.`,
    ctaLabel: "Rate Support",
    ctaUrl: "#book-visit",
    variables: ["grievance_ticket_id", "order_number", "support_phone", "support_whatsapp"]
  },
  {
    id: "wa-testimonial-request",
    name: "Testimonial request",
    channel: "WHATSAPP",
    audience: "BUYER_CHILD",
    objective: "Collect post-service testimonials with consent.",
    lifecycleEvent: "TESTIMONIAL_REQUEST",
    body:
      `Thank you for trusting Mason Company for ${tokens.order_number}.\n` +
      "Your feedback helps other families make confident safety decisions.\n" +
      "Would you like to share a short testimonial?",
    ctaLabel: "Share Feedback",
    ctaUrl: "#outcomes",
    variables: ["order_number"],
    complianceNotes: [complianceLibrary.testimonialUse]
  }
];
