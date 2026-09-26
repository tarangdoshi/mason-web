/* Prerna's legal-page content, structured for the shared page layout. Company
   name, registered address, and customer-care details come from company.ts.
   Paragraphs may carry inline [label](/href) links. */

import type { LegalDoc } from "./LegalPage";
import {
  COMPANY_NAME,
  LEGAL_NAME,
  REGISTERED_OFFICE,
  LEGAL_EFFECTIVE_DATE,
  CARE_EMAIL,
  PHONE_DISPLAY,
  PHONE_HREF,
  HOURS,
} from "./company";

export const PRIVACY: LegalDoc = {
  title: "Privacy Policy",
  updated: "September 2026",
  intro: `This Privacy Policy explains how ${LEGAL_NAME}, operating the Mason service ("Mason", "we", "us" or "our"), collects, uses, stores and shares personal data when you use our website, submit an enquiry or assessment, book a service, make a purchase, or otherwise interact with Mason.`,
  sections: [
    {
      heading: "Information We Collect",
      blocks: [
        { p: "Depending on how you interact with Mason, we may collect:" },
        {
          list: [
            "name, phone number, email address and other contact information;",
            "address, city, locality and location information you provide;",
            "information submitted through enquiries, lead forms, assessments or questionnaires;",
            "service preferences, package selections, appointment preferences and booking information;",
            "transaction, payment-status and invoice-related information (payment-card or banking credentials may be handled directly by payment providers rather than stored by Mason);",
            "communications with Mason, including customer-support and service records;",
            "website and attribution information such as referral source, campaign parameters and click identifiers where used; and",
            "technical information reasonably generated when you use the website, such as device, browser, IP or interaction information where collected by our hosting, security or analytics tools.",
          ],
        },
      ],
    },
    {
      heading: "How We Use Your Information",
      blocks: [
        { p: "We may use personal data to:" },
        {
          list: [
            "respond to enquiries and provide requested information;",
            "understand customer requirements and provide assessments or recommendations;",
            "arrange surveys, bookings, installations, support and warranty services;",
            "communicate about appointments, orders, payments and service delivery;",
            "operate and improve Mason's website, services and customer experience;",
            "understand demand, service areas, marketing attribution and business performance;",
            "prevent misuse, maintain security and resolve complaints or disputes; and",
            "comply with applicable legal, tax, accounting and regulatory requirements.",
          ],
        },
      ],
    },
    {
      heading: "Location Information",
      blocks: [
        { p: "If you use a location or address picker, we may receive and store address, locality, city, geographic or place-related information that you choose to provide. We use this information to understand the property location, coordinate services, analyse service areas and improve our operations." },
        { p: "Providing an address outside Mason's current service areas does not, by itself, prevent you from submitting an enquiry or assessment." },
      ],
    },
    {
      heading: "Cookies, Analytics and Attribution",
      blocks: [
        { p: "Our website may use cookies and similar technologies for essential website functionality, analytics, performance measurement and attribution. Where third-party analytics or advertising tools are enabled, they may process device, browser, referral, campaign or interaction information in accordance with their own terms and our instructions." },
        { p: "We will update this policy if the categories of tracking technologies we use materially change." },
      ],
    },
    {
      heading: "How We Share Information",
      blocks: [
        { p: "We do not sell personal data. We may share information where reasonably necessary with:" },
        {
          list: [
            "employees, consultants and authorised personnel involved in providing Mason services;",
            "installation, logistics, vendor or service partners where information is required to fulfil the customer's request;",
            "technology providers supporting hosting, CRM, communications, analytics, mapping/location, payments or other business systems;",
            "professional advisers such as accountants, auditors, insurers or lawyers where reasonably necessary; and",
            "government, regulatory or law-enforcement authorities where disclosure is required by applicable law.",
          ],
        },
        { p: "We aim to limit sharing to information reasonably necessary for the relevant purpose." },
      ],
    },
    {
      heading: "Data Retention",
      blocks: [
        { p: "We retain personal data only for as long as reasonably necessary for the purposes for which it was collected, including providing services, maintaining customer and transaction records, handling warranty or support requests, complying with legal and accounting obligations, resolving disputes and maintaining appropriate business records." },
        { p: "When information is no longer reasonably required, we may delete or anonymise it, subject to applicable legal requirements." },
      ],
    },
    {
      heading: "Data Security",
      blocks: [
        { p: "We take reasonable technical and organisational measures designed to protect personal data against unauthorised access, disclosure, alteration, loss or misuse. No method of electronic storage or transmission can be guaranteed to be completely secure." },
      ],
    },
    {
      heading: "Your Choices and Rights",
      blocks: [
        { p: "Subject to applicable law, you may contact Mason to request information about your personal data, seek correction or updating of inaccurate information, request deletion where applicable, withdraw consent where processing is based on consent, or raise a grievance about how your personal data is handled." },
        { p: "Withdrawing consent does not affect processing already carried out lawfully before withdrawal and may affect our ability to provide a service that requires the relevant information." },
      ],
    },
    {
      heading: "Communications",
      blocks: [
        { p: "If you provide your contact details, we may use them to respond to your enquiry, provide requested service information, coordinate appointments, send transaction or service updates and provide customer support." },
        { p: "Promotional communications, where used, will be handled in accordance with applicable law and available opt-out mechanisms." },
      ],
    },
    {
      heading: "Children's Data",
      blocks: [
        { p: "Mason's services and website are not directed at children for independent purchase or contracting. If information about a minor is provided in connection with a household enquiry or service, the person providing it should be authorised to do so. We will handle such information only as reasonably necessary for the relevant purpose and in accordance with applicable law." },
      ],
    },
    {
      heading: "Third-Party Services",
      blocks: [
        { p: "Our website and operations may use third-party service providers such as hosting, cloud infrastructure, mapping/location services, customer relationship management, analytics, communications and payment providers. These providers may process personal data as necessary to provide their services to Mason." },
        { p: "Third-party websites or services linked from our website are governed by their own privacy practices." },
      ],
    },
    {
      heading: "Changes to This Policy",
      blocks: [
        { p: "We may update this Privacy Policy from time to time to reflect changes in our services, technology, business practices or applicable law. The latest version will be published on the website with its updated date." },
      ],
    },
    {
      heading: "Contact and Grievances",
      blocks: [
        { p: "For privacy questions, requests or grievances, please contact Mason using the details below." },
        { p: `${LEGAL_NAME}, ${REGISTERED_OFFICE}.` },
        { p: `Privacy / grievance email: [${CARE_EMAIL}](mailto:${CARE_EMAIL}). Phone: [${PHONE_DISPLAY}](${PHONE_HREF}) (${HOURS}).` },
      ],
    },
  ],
};

export const TERMS: LegalDoc = {
  title: "Terms & Conditions",
  updated: "September 2026",
  intro: `These Terms & Conditions ("Terms") apply to services provided by ${LEGAL_NAME}, operating the Mason service ("Mason", "we", "us" or "our"). By booking, purchasing or using Mason services, you agree to these Terms.`,
  sections: [
    {
      heading: "Our Services",
      blocks: [
        { p: "Mason provides home-safety and accessibility-related assessments, recommendations, products, installation and related services." },
        { p: "The exact products and services provided will depend on the package, quotation, order or scope agreed with the customer. Recommendations may be based on information provided by the customer and conditions reasonably observable at the property." },
      ],
    },
    {
      heading: "Safety Disclaimer",
      blocks: [
        { p: "Mason services are intended to help identify and reduce common safety and accessibility risks within the home." },
        { p: "No home, product, modification or installation can eliminate the possibility of a fall, accident or injury. Mason does not guarantee that a person will not fall, suffer an accident or sustain an injury after using our services or products." },
        { p: "Our assessments and recommendations are home-safety and accessibility recommendations. They are not medical advice, medical diagnoses, physiotherapy, occupational therapy or a substitute for advice from an appropriately qualified healthcare professional. Where a person's medical condition, mobility or physical ability may affect what is suitable, customers should obtain appropriate professional advice." },
      ],
    },
    {
      heading: "Property Conditions",
      blocks: [
        { p: "Our recommendations and installation work are based on conditions that are reasonably visible or disclosed to us." },
        { p: "Mason is not responsible for pre-existing or concealed conditions that could not reasonably have been identified before work began, including hidden plumbing or electrical issues, structural defects, waterproofing defects, deterioration inside walls or floors, or other concealed property conditions." },
        { p: "If an unexpected condition is discovered during installation, we may pause or modify the work and discuss the appropriate next steps and any additional costs with the customer." },
      ],
    },
    {
      heading: "Customer Responsibilities",
      blocks: [
        { p: "Customers agree to:" },
        {
          list: [
            "provide accurate information relevant to the services;",
            "inform Mason of known property defects or restrictions that may affect installation;",
            "provide reasonable access to the property;",
            "follow reasonable usage, maintenance and safety instructions; and",
            "not improperly modify or relocate installed products.",
          ],
        },
        { p: "Where relevant, the customer is responsible for obtaining permission from the property owner, housing society or other authority before authorising work." },
      ],
    },
    {
      heading: "Products and Installation",
      blocks: [
        { p: "Products may be manufactured or supplied by third parties. Where a manufacturer provides a product warranty, that warranty may be subject to the manufacturer's own terms." },
        { p: "Mason remains responsible for installation work performed by Mason or persons engaged by Mason to the extent required by applicable law and these Terms." },
        { p: "Mason is not responsible for work independently performed or subsequently modified by third parties who have not been engaged by Mason." },
      ],
    },
    {
      heading: "Pricing and Payment",
      blocks: [
        { p: "Prices will be communicated before an order or service is confirmed. Unless otherwise stated, the customer must pay the amount shown at checkout, in the quotation or otherwise agreed with Mason." },
        { p: "Additional work requested by the customer, or reasonably required because of previously undisclosed or concealed property conditions, may be charged separately after informing the customer." },
      ],
    },
    {
      heading: "Cancellations and Refunds",
      blocks: [
        { p: "If you wish to cancel or reschedule a service, please contact Mason as soon as possible." },
        { p: "Where work has not commenced and products have not been specially procured, manufactured or customised for the order, amounts paid may be refundable subject to reasonable costs already incurred by Mason." },
        { p: "Once customised products have been ordered, materials have been specially procured, or work has commenced, Mason may deduct reasonable costs already incurred before determining any refund." },
        { p: "Nothing in this section limits any refund, replacement or other remedy to which a customer is entitled under applicable law." },
      ],
    },
    {
      heading: "Warranty",
      blocks: [
        { p: "Mason provides a 12-month warranty on installation workmanship, starting from the date the installation is completed." },
        { p: "During this period, Mason will rectify, at no additional labour cost to the customer, defects that result directly from Mason's installation workmanship." },
        { p: "The workmanship warranty does not cover normal wear and tear; misuse, negligence or accidental damage; failure to follow reasonable usage or maintenance instructions; modifications, relocation or repairs performed by anyone other than Mason; pre-existing or concealed property defects; or defects or failures in third-party products unrelated to Mason's installation workmanship." },
        { p: "Products supplied by Mason may also carry warranties provided by their respective manufacturers. Any such product warranty is subject to the manufacturer's applicable warranty terms." },
        { p: "Nothing in this warranty limits rights or remedies available to the customer under applicable law." },
      ],
    },
    {
      heading: "Limitation of Liability",
      blocks: [
        { p: "Mason will exercise reasonable care and skill in providing its services." },
        { p: "To the fullest extent permitted by applicable law, Mason will not be liable for indirect, incidental or consequential losses arising from the services." },
        { p: "Mason is not responsible merely because a fall, accident or injury occurs after an assessment, recommendation, product installation or other service has been provided." },
        { p: "Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited, including rights and remedies available to consumers under applicable law." },
      ],
    },
    {
      heading: "Website Information",
      blocks: [
        { p: "Information on Mason's website is provided for general information and may be updated from time to time. Images, illustrations, measurements and examples may be indicative. Final products, specifications and installation requirements may vary according to the property and agreed scope." },
      ],
    },
    {
      heading: "Privacy",
      blocks: [
        { p: "Mason collects and uses personal information in accordance with its [Privacy Policy](/privacy). By submitting information to Mason, you acknowledge that your information will be handled as described in that policy." },
      ],
    },
    {
      heading: "Complaints and Grievances",
      blocks: [
        { p: "If you have a concern about a Mason product or service, please contact us using the customer-care or grievance contact details displayed on the website. We will make reasonable efforts to resolve complaints promptly and in accordance with applicable law." },
      ],
    },
    {
      heading: "Changes to These Terms",
      blocks: [
        { p: "We may update these Terms from time to time. The Terms applicable to a confirmed order will be the version in effect when that order was placed, unless a change is required by law or agreed with the customer." },
      ],
    },
    {
      heading: "Governing Law and Disputes",
      blocks: [
        { p: "These Terms are governed by the laws of India." },
        { p: "If a dispute arises, the customer and Mason should first attempt to resolve it directly and in good faith. Subject to rights and remedies available to consumers under applicable law, disputes shall be subject to the jurisdiction of the competent courts in Goa, India." },
      ],
    },
    {
      heading: "Business Details",
      blocks: [
        { p: `${LEGAL_NAME}, ${REGISTERED_OFFICE}.` },
        { p: `Customer care email: [${CARE_EMAIL}](mailto:${CARE_EMAIL}). Customer care phone: [${PHONE_DISPLAY}](${PHONE_HREF}) (${HOURS}).` },
      ],
    },
  ],
};

export const REFUND: LegalDoc = {
  title: "Refund & Cancellation Policy",
  updated: LEGAL_EFFECTIVE_DATE,
  intro: `We want you to feel confident booking with ${COMPANY_NAME}. This policy explains when you can cancel or reschedule, and how refunds work. It should be read together with our [Terms & Conditions](/terms).`,
  sections: [
    {
      heading: "Free Safety Visits",
      blocks: [
        { p: "Our initial safety visit is free and carries no obligation. You can cancel or reschedule it at any time, at no cost, by letting us know as early as you can so we can offer the slot to another family." },
      ],
    },
    {
      heading: "Cancelling a Booked Installation",
      blocks: [
        { p: "Once you have confirmed an installation, you may cancel or reschedule subject to the following:" },
        {
          list: [
            "If you cancel before we have ordered materials or scheduled technicians for your job, any advance you have paid is refundable in full, minus any costs already incurred on your behalf.",
            "If you cancel after materials have been ordered or custom items have been prepared for your bathroom, the cost of those materials or preparation may be deducted from your refund.",
            "To reschedule, please give us reasonable notice so we can adjust our team's plan. Repeated last-minute changes may affect timelines.",
          ],
        },
        { p: "Please confirm the exact notice periods and any advance for your job in your quote or order confirmation, as they can vary with the scope of work." },
      ],
    },
    {
      heading: "Deposits and Advance Payments",
      blocks: [
        { p: "Where a job requires an advance or deposit, this reserves your slot and covers initial material and planning costs. The refundable portion of an advance depends on how much work and procurement has already taken place when you cancel, as described above." },
      ],
    },
    {
      heading: "Refund Method and Timeline",
      blocks: [
        { p: "Approved refunds are made to the original payment method wherever possible. We aim to process refunds promptly once the amount is agreed; the time for the money to reach you also depends on your bank or payment provider." },
      ],
    },
    {
      heading: "If Something Isn't Right",
      blocks: [
        { p: "If an installation is defective because of our workmanship, we will put it right — that is our first commitment to you, under the workmanship warranty in our [Terms & Conditions](/terms). Please tell us promptly so we can inspect and resolve it." },
        { p: "Where a supplied product is faulty, we will help you claim under the applicable manufacturer or workmanship warranty." },
      ],
    },
    {
      heading: "Non-Refundable Items",
      blocks: [
        { p: "The following are generally not refundable:" },
        {
          list: [
            "Work already completed to the agreed standard.",
            "Custom-made or made-to-measure items prepared specifically for your bathroom, once production has begun.",
            "Third-party charges already incurred on your behalf that we cannot recover.",
          ],
        },
      ],
    },
    {
      heading: "How to Request a Cancellation or Refund",
      blocks: [
        { p: `To cancel, reschedule, or request a refund, contact us as early as possible:` },
        {
          list: [
            `Email: [${CARE_EMAIL}](mailto:${CARE_EMAIL})`,
            `Phone / WhatsApp: [${PHONE_DISPLAY}](${PHONE_HREF}) (${HOURS})`,
          ],
        },
        { p: "Please include your name, the phone number you booked with, and your booking or job reference so we can find your details quickly." },
      ],
    },
  ],
};
