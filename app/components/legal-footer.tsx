import Link from "next/link";
import { homepageContent } from "../../content/homepage.content";
import styles from "./legal-footer.module.css";

export default function LegalFooter() {
  const { brand } = homepageContent;

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.brand}>© 2026 Mason Company. Bathroom safety upgrades for ageing parents.</p>
        <div className={styles.linkGroups}>
          <nav className={styles.links} aria-label="Contact">
            <a href={`tel:${brand.phoneTel}`} data-analytics-cta-location="footer-contact" data-analytics-section="footer">
              Call {brand.phoneDisplay}
            </a>
            <a href={brand.whatsappUrl} data-analytics-cta-location="footer-contact" data-analytics-section="footer">
              {brand.whatsappLabel}
            </a>
          </nav>
          <nav className={styles.links} aria-label="Legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
