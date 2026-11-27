import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { DisclosureNav } from "../disclosure-nav";
import { selectMobileNavigation } from "./mobile-navigation";
import { OsIcon, type OsIconName } from "./os-icon";
import { QuickActions, type OsQuickAction } from "./quick-actions";
import styles from "./app-shell.module.css";

export type OsNavigationItem = {
  href: string;
  label: string;
  icon: OsIconName;
  group: string;
  active?: boolean;
};

const mobileRoutes = ["/panel", "/panel/agenda", "/panel/finanzas"];

function NavigationLink({ item }: { item: OsNavigationItem }) {
  return <Link className={styles.navLink} href={item.href} aria-current={item.active ? "page" : undefined}>
    <OsIcon name={item.icon} /><span>{item.label}</span>
  </Link>;
}

export function AppShell({ children, navigation, quickActions }: {
  children: ReactNode;
  navigation: OsNavigationItem[];
  quickActions: readonly OsQuickAction[];
}) {
  const mobileItems = selectMobileNavigation(navigation.filter((item) => mobileRoutes.includes(item.href)));
  const overflow = navigation.filter((item) => !mobileItems.some((entry) => entry.href === item.href));
  const groups = [...new Set(navigation.map((item) => item.group))];
  function mobileLink(href: string) {
    const item = mobileItems.find((entry) => entry.href === href);
    return item ? <NavigationLink item={item} /> : <span aria-hidden="true" />;
  }
  return <div className={styles.shell}>
    <a className={styles.skipLink} href="#os-main">Saltar al contenido</a>
    <aside className={styles.sidebar}>
      <Link className={styles.brand} href="/panel"><Image src="/brand/crisdal-imagotipo.png" width={31} height={34} alt="" />Crisdal OS</Link>
      {quickActions.length ? <QuickActions actions={quickActions} className={styles.create + " " + styles.desktopCreate} /> : <span aria-hidden="true" />}
      <nav aria-label="Navegación principal de Crisdal OS" className={styles.desktopNav}>
        {groups.map((group) => <section key={group} className={styles.group}>
          <h2>{group}</h2>
          {navigation.filter((item) => item.group === group).map((item) => <NavigationLink key={item.href} item={item} />)}
        </section>)}
      </nav>
    </aside>
    <main id="os-main" tabIndex={-1} className={styles.main}>{children}</main>
    <nav className={styles.mobileNav} aria-label="Navegación móvil de Crisdal OS">
      {mobileLink("/panel")}
      {mobileLink("/panel/agenda")}
      {quickActions.length ? <QuickActions actions={quickActions} className={styles.create} /> : <span aria-hidden="true" />}
      {mobileLink("/panel/finanzas")}
      {overflow.length > 0 ? <DisclosureNav className={styles.moreNav} label={<><OsIcon name="more" /><span>Más</span></>} navLabel="Más módulos de Crisdal OS">
        {overflow.map((item) => <NavigationLink key={item.href} item={item} />)}
      </DisclosureNav> : <span aria-hidden="true" />}
    </nav>
  </div>;
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

