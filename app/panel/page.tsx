import { requirePanelSession } from "../lib/os/dal";
import { EmptyState, MetricCard, MetricGrid } from "../ui/os/app-shell";
import { PanelShell } from "../ui/os/panel-shell";
import { safeAgendaSummary } from "../lib/os/agenda-repository";
import type { Capability } from "../lib/os/capabilities";
import Link from "next/link";
import styles from "./panel.module.css";

export const metadata = { title: "Inicio | Crisdal OS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const quickActions: ReadonlyArray<{ capability: Capability; href: string; label: string }> = [
  { capability: "clients.write", href: "/panel/clientes", label: "Registrar cliente" },
  { capability: "quotes.manage", href: "/panel/cotizaciones", label: "Crear cotización" },
  { capability: "finance.write", href: "/panel/finanzas", label: "Registrar cobro, gasto o boleta" },
  { capability: "calendar.read", href: "/panel/agenda", label: "Consultar agenda" },
  { capability: "portfolio.manage", href: "/panel/portafolio", label: "Gestionar portafolio" },
  { capability: "packages.read", href: "/panel/paquetes", label: "Revisar paquetes" },
  { capability: "promotions.manage", href: "/panel/promociones", label: "Programar promoción" },
];

export default async function PanelPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [session, params] = await Promise.all([requirePanelSession(), searchParams]);
  const agenda = session.capabilities.includes("calendar.read") ? await safeAgendaSummary() : null;
  const actions = quickActions.filter(({ capability }) => session.capabilities.includes(capability));
  return (
    <PanelShell session={session} currentPath="/panel">
      <section className={styles.heading}>
        <p className={styles.eyebrow}>Vista operativa</p><h1>Hoy en Crisdal</h1>
        <p>Accesos rápidos y agenda real. Cuando un módulo no está conectado, se muestra como pendiente en lugar de inventar cifras.</p>
      </section>
      {params.error === "sin-permiso" ? <p className={styles.error} role="alert">Tu rol no tiene permiso para acceder a esa sección.</p> : null}
      <MetricGrid>
        {agenda && <>
          <MetricCard label="Próximos 30 días" value={agenda.status === "ready" ? String(agenda.items.length) : "Activación pendiente"} hint={agenda.status === "ready" ? "Actividades reales registradas en agenda." : "Ejecuta la migración de agenda para habilitar este dato."} />
          <MetricCard label="Confirmadas" value={agenda.status === "ready" ? String(agenda.items.filter((item) => item.status === "confirmed").length) : "—"} hint="No incluye consultas, pendientes ni canceladas." />
        </>}
        <MetricCard label="Rol activo" value={session.role} hint={`${session.capabilities.length} permisos explícitos habilitados.`} />
      </MetricGrid>
      <div className={styles.sectionGap}>
        {actions.length > 0 && <section className={styles.quickLinks}><h2>Acciones rápidas</h2><div>{actions.map(({ href, label }) => <Link key={href} href={href}>{label}</Link>)}</div></section>}
        {agenda && agenda.status !== "ready" ? <EmptyState title="Agenda pendiente de activación" description="El código y la migración están versionados, pero no se muestran datos hasta conectar la base real." action={{ href: "/panel/configuracion", label: "Ver configuración" }} /> : null}
      </div>
    </PanelShell>
  );
}
