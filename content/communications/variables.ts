import type { TemplateVariableDefinition, TemplateVariableKey } from "./types";

export const templateVariables: Record<TemplateVariableKey, TemplateVariableDefinition> = {
  customer_name: {
    key: "customer_name",
    token: "{{customer_name}}",
    label: "Customer name",
    description: "Primary buyer or recipient full name.",
    example: "Aarav Mehta",
    requiredIn: ["WHATSAPP", "SMS", "EMAIL", "SCRIPT"]
  },
  city: {
    key: "city",
    token: "{{city}}",
    label: "City",
    description: "Operating city for package delivery and support.",
    example: "Mumbai",
    requiredIn: ["WHATSAPP", "SMS", "EMAIL", "WEB", "SCRIPT"]
  },
  order_number: {
    key: "order_number",
    token: "{{order_number}}",
    label: "Order number",
    description: "Unique booking identifier.",
    example: "AEG-2038",
    requiredIn: ["WHATSAPP", "SMS", "EMAIL", "SCRIPT"]
  },
  package_name: {
    key: "package_name",
    token: "{{package_name}}",
    label: "Package name",
    description: "Booked package display name.",
    example: "Mumbai Essential Package",
    requiredIn: ["WHATSAPP", "SMS", "EMAIL", "WEB", "SCRIPT"]
  },
  package_price: {
    key: "package_price",
    token: "{{package_price}}",
    label: "Package price",
    description: "Final package amount shown to the customer.",
    example: "INR 14,900",
    requiredIn: ["WHATSAPP", "SMS", "EMAIL", "WEB", "SCRIPT"]
  },
  visit_date: {
    key: "visit_date",
    token: "{{visit_date}}",
    label: "Visit date",
    description: "Scheduled visit date.",
    example: "12 March 2026",
    requiredIn: ["WHATSAPP", "SMS", "EMAIL", "SCRIPT"]
  },
  visit_time_slot: {
    key: "visit_time_slot",
    token: "{{visit_time_slot}}",
    label: "Visit time slot",
    description: "Scheduled visit window.",
    example: "10:00 AM - 1:00 PM",
    requiredIn: ["WHATSAPP", "SMS", "EMAIL", "SCRIPT"]
  },
  technician_name: {
    key: "technician_name",
    token: "{{technician_name}}",
    label: "Technician name",
    description: "Assigned field expert name.",
    example: "Rohit Patil",
    requiredIn: ["WHATSAPP", "SMS", "EMAIL", "SCRIPT"]
  },
  otp_code: {
    key: "otp_code",
    token: "{{otp_code}}",
    label: "OTP code",
    description: "Verification code for arrival/completion authentication.",
    example: "729184",
    requiredIn: ["WHATSAPP", "SMS", "SCRIPT"]
  },
  payment_mode: {
    key: "payment_mode",
    token: "{{payment_mode}}",
    label: "Payment mode",
    description: "Online or pay-on-installation mode selected at checkout.",
    example: "PAY_ON_INSTALLATION",
    requiredIn: ["WHATSAPP", "SMS", "EMAIL", "SCRIPT"]
  },
  collection_method: {
    key: "collection_method",
    token: "{{collection_method}}",
    label: "Collection method",
    description: "Cash, UPI, or POS at installation.",
    example: "UPI",
    requiredIn: ["WHATSAPP", "SMS", "EMAIL", "SCRIPT"]
  },
  amount_paid: {
    key: "amount_paid",
    token: "{{amount_paid}}",
    label: "Amount paid",
    description: "Amount collected from customer.",
    example: "INR 14,900",
    requiredIn: ["WHATSAPP", "SMS", "EMAIL", "SCRIPT"]
  },
  refund_amount: {
    key: "refund_amount",
    token: "{{refund_amount}}",
    label: "Refund amount",
    description: "Refund amount initiated or completed.",
    example: "INR 5,000",
    requiredIn: ["WHATSAPP", "SMS", "EMAIL", "SCRIPT"]
  },
  refund_eta: {
    key: "refund_eta",
    token: "{{refund_eta}}",
    label: "Refund ETA",
    description: "Expected refund timeline.",
    example: "3-5 business days",
    requiredIn: ["WHATSAPP", "SMS", "EMAIL", "SCRIPT"]
  },
  support_phone: {
    key: "support_phone",
    token: "{{support_phone}}",
    label: "Support phone",
    description: "Primary support helpline.",
    example: "+91 98765 43210",
    requiredIn: ["WHATSAPP", "SMS", "EMAIL", "WEB", "SCRIPT"]
  },
  support_whatsapp: {
    key: "support_whatsapp",
    token: "{{support_whatsapp}}",
    label: "Support WhatsApp",
    description: "Official support WhatsApp number.",
    example: "+91 98765 43210",
    requiredIn: ["WHATSAPP", "SMS", "EMAIL", "WEB", "SCRIPT"]
  },
  grievance_ticket_id: {
    key: "grievance_ticket_id",
    token: "{{grievance_ticket_id}}",
    label: "Grievance ticket ID",
    description: "Support grievance ticket reference.",
    example: "GR-23019",
    requiredIn: ["WHATSAPP", "SMS", "EMAIL", "SCRIPT"]
  }
};

export const templateVariableList = Object.values(templateVariables);

export const tokens: Record<TemplateVariableKey, `{{${TemplateVariableKey}}}`> = {
  customer_name: "{{customer_name}}",
  city: "{{city}}",
  order_number: "{{order_number}}",
  package_name: "{{package_name}}",
  package_price: "{{package_price}}",
  visit_date: "{{visit_date}}",
  visit_time_slot: "{{visit_time_slot}}",
  technician_name: "{{technician_name}}",
  otp_code: "{{otp_code}}",
  payment_mode: "{{payment_mode}}",
  collection_method: "{{collection_method}}",
  amount_paid: "{{amount_paid}}",
  refund_amount: "{{refund_amount}}",
  refund_eta: "{{refund_eta}}",
  support_phone: "{{support_phone}}",
  support_whatsapp: "{{support_whatsapp}}",
  grievance_ticket_id: "{{grievance_ticket_id}}"
};

export function hasOnlyRegisteredVariables(variables: TemplateVariableKey[]): boolean {
  return variables.every((item) => Boolean(templateVariables[item]));
}
