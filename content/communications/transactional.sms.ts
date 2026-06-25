import type { CommunicationTemplate } from "./types";
import { tokens } from "./variables";

export const transactionalSmsTemplates: CommunicationTemplate[] = [
  {
    id: "sms-order-placed",
    name: "Booking received",
    channel: "SMS",
    audience: "BUYER_CHILD",
    objective: "Confirm booking receipt.",
    lifecycleEvent: "ORDER_PLACED",
    body: `Mason Company booking received: ${tokens.order_number}, ${tokens.package_name}, ${tokens.city}, ${tokens.package_price}.`,
    variables: ["order_number", "package_name", "city", "package_price"]
  },
  {
    id: "sms-order-confirmed",
    name: "Booking confirmed",
    channel: "SMS",
    audience: "BUYER_CHILD",
    objective: "Share confirmed slot.",
    lifecycleEvent: "ORDER_CONFIRMED",
    body: `Mason Company booking ${tokens.order_number} confirmed for ${tokens.visit_date}, ${tokens.visit_time_slot}.`,
    variables: ["order_number", "visit_date", "visit_time_slot"]
  },
  {
    id: "sms-tech-assigned",
    name: "Technician assigned",
    channel: "SMS",
    audience: "FAMILY_DECISION_UNIT",
    objective: "Share assigned technician details.",
    lifecycleEvent: "TECH_ASSIGNED",
    body: `Mason Company update ${tokens.order_number}: Technician ${tokens.technician_name} assigned for your visit.`,
    variables: ["order_number", "technician_name"]
  },
  {
    id: "sms-tech-en-route",
    name: "Technician en route",
    channel: "SMS",
    audience: "BUYER_CHILD",
    objective: "Enable secure arrival verification.",
    lifecycleEvent: "TECH_EN_ROUTE",
    body: `Mason Company tech ${tokens.technician_name} is en route for ${tokens.order_number}. Arrival OTP: ${tokens.otp_code}.`,
    variables: ["technician_name", "order_number", "otp_code"]
  },
  {
    id: "sms-visit-started",
    name: "Visit started",
    channel: "SMS",
    audience: "FAMILY_DECISION_UNIT",
    objective: "Confirm work start.",
    lifecycleEvent: "VISIT_IN_PROGRESS",
    body: `Mason Company work started for ${tokens.order_number} by ${tokens.technician_name}.`,
    variables: ["order_number", "technician_name"]
  },
  {
    id: "sms-work-completed",
    name: "Work completed",
    channel: "SMS",
    audience: "BUYER_CHILD",
    objective: "Close service with OTP checkpoint.",
    lifecycleEvent: "WORK_COMPLETED",
    body: `Mason Company work complete: ${tokens.order_number}. Share completion OTP ${tokens.otp_code} after review.`,
    variables: ["order_number", "otp_code"]
  },
  {
    id: "sms-payment-request",
    name: "Payment collection request",
    channel: "SMS",
    audience: "BUYER_CHILD",
    objective: "Collect payment clearly.",
    lifecycleEvent: "PAYMENT_COLLECTION_REQUEST",
    body: `Payment due for ${tokens.order_number}: ${tokens.amount_paid} via ${tokens.collection_method}.`,
    variables: ["order_number", "amount_paid", "collection_method"]
  },
  {
    id: "sms-payment-received",
    name: "Payment received",
    channel: "SMS",
    audience: "BUYER_CHILD",
    objective: "Confirm payment closure.",
    lifecycleEvent: "PAYMENT_RECEIVED",
    body: `Payment received for ${tokens.order_number}: ${tokens.amount_paid}. Thank you for choosing Mason Company.`,
    variables: ["order_number", "amount_paid"]
  },
  {
    id: "sms-online-payment-success",
    name: "Online payment success",
    channel: "SMS",
    audience: "BUYER_CHILD",
    objective: "Confirm online payment.",
    lifecycleEvent: "ONLINE_PAYMENT_SUCCESS",
    body: `Online payment successful for ${tokens.order_number}. Amount: ${tokens.amount_paid}.`,
    variables: ["order_number", "amount_paid"]
  },
  {
    id: "sms-online-payment-failed",
    name: "Online payment failed",
    channel: "SMS",
    audience: "BUYER_CHILD",
    objective: "Recover failed payment.",
    lifecycleEvent: "ONLINE_PAYMENT_FAILED",
    body: `Online payment failed for ${tokens.order_number}. For support call ${tokens.support_phone}.`,
    variables: ["order_number", "support_phone"]
  },
  {
    id: "sms-order-cancelled",
    name: "Order cancelled",
    channel: "SMS",
    audience: "BUYER_CHILD",
    objective: "Confirm cancellation.",
    lifecycleEvent: "ORDER_CANCELLED",
    body: `Booking ${tokens.order_number} has been cancelled. Rebook anytime on the Mason Company website.`,
    variables: ["order_number"]
  },
  {
    id: "sms-partial-refund",
    name: "Partial refund initiated",
    channel: "SMS",
    audience: "BUYER_CHILD",
    objective: "Provide partial refund status.",
    lifecycleEvent: "PARTIAL_REFUND_INITIATED",
    body: `Partial refund initiated for ${tokens.order_number}: ${tokens.refund_amount}. ETA ${tokens.refund_eta}.`,
    variables: ["order_number", "refund_amount", "refund_eta"]
  },
  {
    id: "sms-full-refund",
    name: "Full refund initiated",
    channel: "SMS",
    audience: "BUYER_CHILD",
    objective: "Provide full refund status.",
    lifecycleEvent: "FULL_REFUND_INITIATED",
    body: `Full refund initiated for ${tokens.order_number}: ${tokens.refund_amount}. ETA ${tokens.refund_eta}.`,
    variables: ["order_number", "refund_amount", "refund_eta"]
  },
  {
    id: "sms-six-month-checkin",
    name: "Six-month check-in invite",
    channel: "SMS",
    audience: "BUYER_CHILD",
    objective: "Invite customer for paid check-in add-on.",
    lifecycleEvent: "SIX_MONTH_CHECKIN_INVITE",
    body: `Mason Company Care check-in due for ${tokens.order_number}. Paid add-on available in ${tokens.city}.`,
    variables: ["order_number", "city"]
  },
  {
    id: "sms-grievance-acknowledged",
    name: "Grievance acknowledged",
    channel: "SMS",
    audience: "BUYER_CHILD",
    objective: "Acknowledge grievance.",
    lifecycleEvent: "GRIEVANCE_ACKNOWLEDGED",
    body: `Mason Company ticket ${tokens.grievance_ticket_id} created for ${tokens.order_number}. Update soon.`,
    variables: ["grievance_ticket_id", "order_number"]
  },
  {
    id: "sms-grievance-resolved",
    name: "Grievance resolved",
    channel: "SMS",
    audience: "BUYER_CHILD",
    objective: "Close grievance communication.",
    lifecycleEvent: "GRIEVANCE_RESOLVED",
    body: `Mason Company ticket ${tokens.grievance_ticket_id} resolved for ${tokens.order_number}. Need help: ${tokens.support_phone}.`,
    variables: ["grievance_ticket_id", "order_number", "support_phone"]
  },
  {
    id: "sms-testimonial-request",
    name: "Testimonial request",
    channel: "SMS",
    audience: "BUYER_CHILD",
    objective: "Collect testimonial post completion.",
    lifecycleEvent: "TESTIMONIAL_REQUEST",
    body: `Thank you for booking ${tokens.order_number} with Mason Company. Reply with your feedback.`,
    variables: ["order_number"]
  }
];
