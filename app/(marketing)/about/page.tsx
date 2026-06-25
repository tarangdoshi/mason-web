import Link from "next/link";
import styles from "./about.module.css";

const founderCards = [
  {
    name: "Tarang Doshi",
    title: "Co-founder, Mason Company",
    copy:
      "Tarang brings a product, brand, and customer-experience lens to Mason Company. Having built consumer brands and worked across product-led businesses, he focuses on making Mason feel trustworthy, premium, and deeply human for families making an important decision."
  },
  {
    name: "Pranay Gupta",
    title: "Co-founder, Mason Company",
    copy:
      "Pranay brings startup-building, investment, and operating experience to Mason Company. As a co-founder of 91springboard and a long-time supporter of early-stage companies, he focuses on building Mason as a scalable, reliable, and accountable service for Indian families."
  }
];

const approachCards = [
  "We study real bathroom movement before choosing components.",
  "We take doctor inputs and senior-care context seriously.",
  "We install through trained technicians, not fragmented vendors.",
  "We design for safety without making the home feel clinical."
];

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <header className={styles.nav}>
        <Link href="/" className={styles.brand}>
          Mason Company
        </Link>
        <Link href="/#free-assessment" className={styles.navCta}>
          Book Free Safety Assessment
        </Link>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>About Mason Company</p>
        <h1>We started Mason Company because safety at home should still feel like home.</h1>
        <p>
          Mason Company was born from a deeply personal concern: ageing parents should not have to live with pain, restriction, or fear simply
          because the bathroom was never designed for changing mobility.
        </p>
        <p>
          We help families upgrade existing bathrooms with thoughtful, premium safety solutions that support movement, dignity, and independence
          without making the home feel clinical.
        </p>
      </section>

      <section className={styles.storySection}>
        <div>
          <p className={styles.eyebrow}>Our story</p>
          <h2>Built by families, for families.</h2>
        </div>
        <div className={styles.storyCopy}>
          <p>
            Tarang Doshi and Pranay Gupta have known each other since 2013. Over the years, they had both built, advised, and worked with
            businesses across consumer products, startups, operations, and early-stage company building. But Mason Company did not begin as a
            business idea. It began as a conversation between two people who had seen the same problem from very close quarters.
          </p>
          <p>
            During a catch-up in Goa, Pranay spoke about elder care and how badly families can suffer after a fall at home. Tarang had experienced
            something similar when his father slipped, after which he had to find and put together safety solutions himself. Both had seen the
            emotional weight of the problem. Both had tried to solve it in their own way. And when they discussed it together, one thing became
            clear: this was not an isolated family concern. It was a much larger gap.
          </p>
          <p>
            Most families only begin looking for support after something has already gone wrong. A fall. A fracture. A hospital visit. A painful
            recovery. Until then, the bathroom often feels ordinary, even though it may be one of the most unsafe rooms for an ageing parent.
          </p>
          <p>
            When Tarang and Pranay spoke to more friends and family, the same pattern kept coming up. Adult children were worried, but did not know
            what to install, whom to trust, how to plan it, or how to make the bathroom safer without making it look like a hospital. There were
            products. There were vendors. There was advice. But there was no complete, reliable, premium solution designed for Indian homes.
          </p>
        </div>
      </section>

      <section className={styles.missionBand}>
        <p className={styles.eyebrow}>Why we exist</p>
        <h2>No elder should have to live a painful or restricted life because their bathroom was unsafe for their mobility.</h2>
        <p>
          We believe ageing parents deserve safer homes without giving up comfort, independence, or dignity. A bathroom safety upgrade should not
          feel like a compromise. It should be thoughtfully planned, medically informed, carefully installed, and finished in a way that still
          belongs in a beautiful home.
        </p>
      </section>

      <section className={styles.foundersSection}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Founders</p>
          <h2>Why we are built for this</h2>
          <p>
            Mason Company brings together the founders' experience in brand-building, product thinking, startup creation, operations, investing,
            and service design.
          </p>
        </div>
        <div className={styles.founderGrid}>
          {founderCards.map((founder) => (
            <article key={founder.name} className={styles.founderCard}>
              <h3>{founder.name}</h3>
              <p className={styles.founderTitle}>{founder.title}</p>
              <p>{founder.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.approachSection}>
        <div>
          <p className={styles.eyebrow}>Our approach</p>
          <h2>Prevention, planned beautifully.</h2>
          <p>
            Mason Company is designed for families who want to act before a fall changes everything. Our work covers the full bathroom routine:
            entering, turning, sitting, standing, showering, night-time use, wet zones, support points, drainage, and visibility.
          </p>
        </div>
        <div className={styles.approachGrid}>
          {approachCards.map((card) => (
            <article key={card}>{card}</article>
          ))}
        </div>
      </section>

      <section className={styles.closingCta}>
        <h2>Make the bathroom safer before it becomes urgent.</h2>
        <p>Mason Company helps families care for ageing parents with thoughtful, premium, preventive bathroom safety upgrades.</p>
        <Link href="/#free-assessment">Book Free Safety Assessment</Link>
      </section>
    </main>
  );
}
