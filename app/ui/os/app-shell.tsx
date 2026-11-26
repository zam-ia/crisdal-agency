import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./app-shell.module.css";

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
  const mobileItems = navigation.slice(0, 3);
  const overflowItems = navigation.slice(3);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <span className={styles.brand}>{brand}</span>
        <Navigation items={navigation} />
      </aside>
      <main className={styles.main}>{children}</main>
      <div className={styles.mobileNav}>
        <Navigation items={mobileItems} />
        {overflowItems.length > 0 && (
          <details className={styles.moreNav}>
            <summary className={styles.navLink}>Más</summary>
            <Navigation items={overflowItems} label="Más módulos de Crisdal OS" />
          </details>
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

