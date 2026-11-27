import { requirePanelSession } from "../../lib/os/dal";
import { LIMA_TIME_ZONE } from "../../lib/os/domain-schemas";
import { PanelShell } from "../../ui/os/panel-shell";
import { OsInstallGuide } from "../../ui/os/install-guide";
import styles from "../panel.module.css";

export const metadata = { title: "Configuración | Crisdal OS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ConfigurationPage() {
  const session = await requirePanelSession();
  const expiry = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: LIMA_TIME_ZONE }).format(session.expiresAt);
  return (
    <PanelShell session={session} currentPath="/panel/configuracion">
      <section className={styles.heading}><p className={styles.eyebrow}>Configuración</p><h1>Acceso y permisos</h1><p>Vista de solo lectura de la sesión activa. Los cambios de roles requieren un flujo auditado.</p></section>
      <dl className={styles.details}>
        <div><dt>Usuario</dt><dd>{session.displayName}</dd></div>
        <div><dt>Correo</dt><dd>{session.email}</dd></div>
        <div><dt>Rol</dt><dd>{session.role}</dd></div>
        <div><dt>Vence</dt><dd>{expiry} ({LIMA_TIME_ZONE})</dd></div>
      </dl>
      <section className={styles.capabilities}><h2>Capacidades efectivas</h2><ul>{session.capabilities.map((capability) => <li key={capability}>{capability}</li>)}</ul></section>
      <OsInstallGuide />
    </PanelShell>
  );
}
