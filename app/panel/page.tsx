import Image from "next/image";
import Link from "next/link";
import { agendaCategoryLabels, dayOfItem } from "../lib/os/agenda-calendar";
import { readDailyOperations } from "../lib/os/daily-operations";
import { requirePanelSession } from "../lib/os/dal";
import { PanelShell, panelQuickActions } from "../ui/os/panel-shell";
import { OsIcon } from "../ui/os/os-icon";
import styles from "./daily.module.css";

export const metadata = { title: "Inicio | Crisdal OS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const dayFormat = new Intl.DateTimeFormat("es-PE", { dateStyle: "full", timeZone: "America/Lima" });
const eventFormat = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" });

export default async function PanelPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [session, params] = await Promise.all([requirePanelSession(), searchParams]);
  const { event, eventUnavailable, metrics } = await readDailyOperations(session);
  const canReadCalendar = session.capabilities.includes("calendar.read");
  const quickActions = panelQuickActions(session.capabilities);
  return <PanelShell session={session} currentPath="/panel">
    <div className={styles.dashboard}>
      <section className={styles.heading}>
        <Image src="/brand/crisdal-imagotipo.png" width={44} height={48} alt="" />
        <div><p>{dayFormat.format(new Date())}</p><h1>Hoy en Crisdal</h1><p>Hola, {session.displayName}</p></div>
      </section>
      {params.error === "sin-permiso" && <p className={styles.alert} role="alert">Tu perfil no tiene acceso a esa sección.</p>}
      {canReadCalendar && <section className={styles.nextEvent} aria-labelledby="next-event-title">
        <div className={styles.eventIcon}><OsIcon name="calendar" /></div>
        <div>
          <p>Próxima actividad confirmada</p>
          <h2 id="next-event-title">{event?.title ?? (eventUnavailable ? "Agenda no disponible" : "Sin eventos confirmados")}</h2>
          {event && <p><time dateTime={event.starts_at}>{eventFormat.format(new Date(event.starts_at))} · Lima</time>{agendaCategoryLabels[event.category as keyof typeof agendaCategoryLabels] && " · " + agendaCategoryLabels[event.category as keyof typeof agendaCategoryLabels]}</p>}
        </div>
        <Link className={styles.primary} href={event ? "/panel/agenda?fecha=" + dayOfItem(event.starts_at) : "/panel/agenda"}>{event ? "Ver evento" : "Abrir agenda"}</Link>
      </section>}
      {metrics.length > 0 && <section className={styles.metrics} aria-label="Pendientes y estado operativo">
        {metrics.map((metric) => <article key={metric.label} className={styles.metric}>
          <p>{metric.label}</p><strong>{metric.value}</strong><Link href={metric.href}>Ver módulo <span aria-hidden="true">↗</span></Link>
        </article>)}
      </section>}
      {quickActions.length > 0 && <section className={styles.actions}>
        <h2>Acciones rápidas</h2>
        <div>{quickActions.map((action) => <Link key={action.href} href={action.href}><OsIcon name={action.icon} />{action.label}</Link>)}</div>
      </section>}
    </div>
  </PanelShell>;
}
