import type { Metadata } from "next";
import Link from "next/link";
import styles from "../legal-page.module.css";

export const metadata: Metadata = {
  title: "Terms | Mason Company",
  description: "Terms governing use of the Mason Company website and submission of service and booking requests."
};

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Legal</p>
        <h1 className={styles.title}>Terms</h1>
        <p className={styles.intro}>
          These terms govern your use of the Mason Company website and the submission of guidance, serviceability, and booking requests.
        </p>
        <p className={styles.updated}>Last updated: 22 June 2026</p>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>Using this website</h2>
          <p>
            You may use this website for lawful personal purposes and to learn about or request Mason Company services. You must provide information that is accurate to the best of your knowledge and must not interfere with the website, impersonate another person, or submit unlawful or harmful content.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Information, guidance, and safety</h2>
          <p>
            Website content, risk estimates, package recommendations, and general guidance are informational. They are not medical advice, diagnosis, emergency assistance, or a substitute for advice from a qualified healthcare or safety professional. Bathroom conditions and individual mobility needs vary and require on-site confirmation.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Booking requests</h2>
          <p>
            Submitting the checkout form prepares a booking request; it does not by itself guarantee availability, confirm an installation date, or create a completed purchase. Mason Company will review serviceability, visit details, package availability, pricing, and next steps before confirming the service.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Pricing and payment preferences</h2>
          <p>
            Prices, add-ons, estimated totals, and payment options shown on the website are subject to confirmation. Selecting online payment or pay on installation records your preference. Any assisted collection fee or other charge displayed in the booking flow will be included in the estimated total before submission.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Service area and site conditions</h2>
          <p>
            Website serviceability checks are indicative. Final service availability depends on the address, access, site conditions, technician capacity, and the suitability of the requested work. Mason Company may decline or reschedule a request when it cannot safely or reasonably provide the service.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Intellectual property</h2>
          <p>
            The website, brand, copy, graphics, photographs, package descriptions, and other materials are owned by or licensed to Mason Company. You may not reproduce or commercially exploit them without permission, except as allowed by law.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Availability and liability</h2>
          <p>
            We aim to keep the website accurate and available, but it may occasionally contain errors or be interrupted. To the extent permitted by applicable law, Mason Company is not responsible for indirect or consequential loss caused solely by use of, or inability to use, the website. Nothing in these terms excludes rights or liabilities that cannot lawfully be excluded.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Privacy and changes</h2>
          <p>
            Our <Link href="/privacy">Privacy Policy</Link> explains how website and booking information is handled. We may update these terms as the website or service changes. The version published here with its revision date is the current version.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Contact</h2>
          <p>For questions about these terms, contact Mason Company through the support channel provided during your enquiry or booking.</p>
        </section>
      </div>
    </main>
  );
}
