import type { Metadata } from "next";
import Link from "next/link";
import styles from "../legal-page.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy | Mason Company",
  description: "How Mason Company collects, uses, and processes information submitted through its website and booking flow."
};

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Legal</p>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.intro}>
          This policy explains how Mason Company handles information when you browse our website, request guidance, check serviceability, or prepare a booking request.
        </p>
        <p className={styles.updated}>Last updated: 22 June 2026</p>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>Information we collect</h2>
          <p>Depending on how you use the website, we may collect:</p>
          <ul>
            <li>your name, phone number, city, address, locality, and access notes;</li>
            <li>preferred visit date and time, package choice, add-ons, payment preference, and booking totals;</li>
            <li>serviceability information, including a manually entered area or precise coordinates when you choose current-location access;</li>
            <li>risk-quiz answers, score, recommendation, and other context you choose to provide; and</li>
            <li>session and attribution information such as page path, referrer, campaign parameters, click identifiers, and the call-to-action used.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>How we use information</h2>
          <p>We use this information to:</p>
          <ul>
            <li>respond to enquiries and provide requested guidance;</li>
            <li>check whether an address is within our current service area;</li>
            <li>prepare, review, and follow up on booking requests;</li>
            <li>maintain customer and sales records and coordinate service delivery; and</li>
            <li>understand which website journeys and campaigns lead to enquiries.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Location processing</h2>
          <p>
            Current-location access is optional. If you choose it, your browser provides coordinates that are sent to OpenStreetMap&apos;s Nominatim service to translate them into an area. The resolved location and coordinates may be included in booking metadata. You can use manual area entry instead.
          </p>
        </section>

        <section className={styles.section}>
          <h2>CRM and service providers</h2>
          <p>
            Contact, service, booking, attribution, and related metadata may be processed in Mason Company systems and in Zoho CRM in India. We also use technical providers needed to host the website, operate the booking flow, and resolve locations. These providers process information for the relevant service they supply.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Session storage and attribution</h2>
          <p>
            The website uses browser session storage to maintain a temporary session identifier, remember selected calls-to-action, and carry quiz and attribution context into an enquiry or booking request. Session storage is normally cleared by the browser when the tab or browsing session ends, subject to browser behavior.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Retention and choices</h2>
          <p>
            We retain submitted information for as long as reasonably needed to respond, administer the customer relationship, maintain operational records, and meet applicable obligations. You may decline current-location access and enter an area manually. You may also ask us to review, correct, or delete information, subject to any information we must retain.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Updates and contact</h2>
          <p>
            We may update this policy as our services or processing practices change. The current version will be published here with its revision date. For a privacy request, contact Mason Company through the support channel provided during your enquiry or booking.
          </p>
          <p>
            Please also review our <Link href="/terms">Terms</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
