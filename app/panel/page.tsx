import { requirePanelSession } from "../lib/os/dal";
import { EmptyState, MetricCard, MetricGrid } from "../ui/os/app-shell";
import { PanelShell } from "../ui/os/panel-shell";
import styles from "./panel.module.css";

export const metadata = { title: "Inicio | Crisdal OS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [session, params] = await Promise.all([requirePanelSession(), searchParams]);
  return (
    <PanelShell session={session} currentPath="/panel">
      <section className={styles.heading}>
        <p className={styles.eyebrow}>Base operativa</p><h1>Crisdal OS</h1>
        <p>Identidad, permisos, sesiones y auditoría listos para recibir módulos sin inventar datos de negocio.</p>
      </section>
      {params.error === "sin-permiso" ? <p className={styles.error} role="alert">Tu rol no tiene permiso para acceder a esa sección.</p> : null}
      <MetricGrid>
        <MetricCard label="Sesión" value="Validada" hint="Verificada en servidor y contra el registro revocable." />
        <MetricCard label="Rol" value={session.role} hint={`${session.capabilities.length} capacidades explícitas habilitadas.`} />
        <MetricCard label="Moneda base" value="PEN" hint="Importes futuros en unidades menores enteras." />
      </MetricGrid>
      <div className={styles.sectionGap}>
        <EmptyState title="Módulos de negocio aún no activados" description="Clientes, calendario, proyectos y finanzas se conectarán sobre contratos versionados. Esta fase no carga cifras, proyectos ni clientes ficticios." action={{ href: "/panel/configuracion", label: "Ver configuración" }} />
      </div>
    </PanelShell>
  );
}
