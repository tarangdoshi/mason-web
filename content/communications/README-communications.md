# Mason Company Communications Library

This folder contains production-draft communication assets for Mason Company across website, transactional messaging, marketing campaigns, and internal scripts.

## Folder map

- `types.ts`
  - Shared interfaces and enums for templates, lifecycle events, campaign assets, and script structures.
- `variables.ts`
  - Approved dynamic token dictionary (single source of truth).
- `brand-voice.ts`
  - Messaging guardrails for tone and claims.
- `compliance.ts`
  - Disclaimer and compliance statement library.
- `website.ts`
  - Website communication pack (hero/process/package framing/FAQ/CTAs/support).
- `transactional.whatsapp.ts`
  - WhatsApp lifecycle templates (primary transactional channel).
- `transactional.sms.ts`
  - SMS fallback templates for each critical lifecycle event.
- `scripts.ts`
  - Internal call and onsite scripts for team execution.
- `campaigns.meta.ts`
  - Meta ads copy bank.
- `campaigns.google.ts`
  - Google Search RSA copy bank with Mumbai/Goa variants.
- `campaigns.whatsapp.ts`
  - WhatsApp outbound campaign copy bank.
- `campaigns.email.ts`
  - Email lifecycle copy bank (channel-ready; data capture integration pending).
- `index.ts`
  - Export barrel and validation helper.

## Dynamic token policy

Use only tokens defined in `variables.ts`:

- `{{customer_name}}`, `{{city}}`, `{{order_number}}`, `{{package_name}}`, `{{package_price}}`
- `{{visit_date}}`, `{{visit_time_slot}}`, `{{technician_name}}`, `{{otp_code}}`
- `{{payment_mode}}`, `{{collection_method}}`, `{{amount_paid}}`
- `{{refund_amount}}`, `{{refund_eta}}`
- `{{support_phone}}`, `{{support_whatsapp}}`, `{{grievance_ticket_id}}`

## Operational notes

1. Website CTA destination for campaigns is `/#packages`.
2. Transactional channel priority is WhatsApp with SMS fallback.
3. Communication templates are English-only in this phase.
4. Medical and testimonial disclaimers must remain intact unless legal review approves edits.
5. Email assets are copy-ready but require future user email capture and send pipeline integration.

## Validation

Use the helper exported in `index.ts`:

- `validateCommunicationsLibrary()`

Expected:

- `missingLifecycleEvents` is empty.
- `undefinedTemplateVariables` is empty.
