"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { clearAdminToken } from "./auth";
import { useAdminAuth } from "./use-admin-auth";
import styles from "./admin.module.css";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/packages", label: "Packages" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/doctors", label: "Doctors" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/homepage", label: "Homepage" },
  { href: "/admin/media", label: "Media" }
];

export default function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, user, error } = useAdminAuth();

  if (loading) {
    return <div className={styles.loginWrap}>Checking admin session…</div>;
  }

  if (!user) {
    return <div className={styles.loginWrap}>{error || "Redirecting to login…"}</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <Link href="/admin" className={styles.brand}>
            Mason Control
          </Link>
          <nav className={styles.sidebarNav}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.sidebarLink} ${pathname === item.href ? styles.sidebarLinkActive : ""}`.trim()}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className={styles.sidebarMeta}>
            <strong>{user.fullName}</strong>
            <span>{user.email}</span>
            <span className={styles.statusBadge}>{user.role}</span>
            <button
              type="button"
              className={styles.ghostButton}
              onClick={() => {
                clearAdminToken();
                router.replace("/admin/login");
              }}
            >
              Sign out
            </button>
          </div>
        </aside>
        <main className={styles.main}>
          <div className={styles.topbar}>
            <div>
              <h1>{title}</h1>
              <p className={styles.helperText}>Draft first, publish when ready. Website layout stays in code.</p>
            </div>
            <div className={styles.topbarActions}>
              <a href="/" className={styles.secondaryButton}>
                Open site
              </a>
              <a href="/compare-packages" className={styles.ghostButton}>
                Preview compare page
              </a>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
