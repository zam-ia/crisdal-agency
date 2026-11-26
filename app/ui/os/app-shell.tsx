import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./app-shell.module.css";
import { DisclosureNav } from "../disclosure-nav";
import { selectMobileNavigation } from "./mobile-navigation";

export type OsNavigationItem = {
  href: string;
  label: string;
  active?: boolean;
};

type AppShellProps = {
  children: ReactNode;
  navigation: OsNavigationItem[];
  brand?: string;
};

function Navigation({ items, label = "Navegación principal de Crisdal OS" }: { items: OsNavigationItem[]; label?: string }) {
  return (
    <nav aria-label={label}>
      {items.map((item) => (
        <Link
          className={styles.navLink}
          href={item.href}
          key={item.href}
          aria-current={item.active ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({
  children,
  navigation,
  brand = "CRISDAL OS",
}: AppShellProps) {
  const mobileItems = selectMobileNavigation(navigation);
  const overflowItems = navigation.filter(item => !mobileItems.some(mobile => mobile.href === item.href));

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#os-main">Saltar al contenido</a>
      <aside className={styles.sidebar}>
        <span className={styles.brand}>{brand}</span>
        <Navigation items={navigation} />
      </aside>
      <main id="os-main" tabIndex={-1} className={styles.main}>{children}</main>
      <div className={styles.mobileNav}>
        <Navigation items={mobileItems} />
        {overflowItems.length > 0 && (
          <DisclosureNav className={styles.moreNav} label="Más" navLabel="Más módulos de Crisdal OS">
            {overflowItems.map(item => <Link className={styles.navLink} key={item.href} href={item.href} aria-current={item.active ? "page" : undefined}>{item.label}</Link>)}
          </DisclosureNav>
        )}
      </div>
    </div>
  );
}

export function MetricGrid({ children }: { children: ReactNode }) {
  return <section className={styles.metricGrid}>{children}</section>;
}

export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <article className={styles.card}>
      <span className={styles.metricLabel}>{label}</span>
      <strong className={styles.metricValue}>{value}</strong>
      {hint ? <span className={styles.metricHint}>{hint}</span> : null}
    </article>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <section className={styles.emptyState}>
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? (
        <Link className={styles.action} href={action.href}>
          {action.label}
        </Link>
      ) : null}
    </section>
  );
}

export function LoadingSkeleton({ label = "Cargando" }: { label?: string }) {
  return (
    <div
      className={styles.skeleton}
      role="status"
      aria-label={label}
      aria-live="polite"
    />
  );
}

