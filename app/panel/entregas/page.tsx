import { requirePanelSession } from "../../lib/os/dal";
import { PanelShell } from "../../ui/os/panel-shell";
import { DeliveriesAdmin } from "./deliveries-admin";
export const dynamic = "force-dynamic";
export const metadata = { title: "Entregas privadas | Crisdal OS", robots: { index: false, follow: false } };
export default async function DeliveriesPage() {
  const session = await requirePanelSession("projects.write");
  return <PanelShell session={session} currentPath="/panel/entregas">{process.env.CRISDAL_PRIVATE_DELIVERIES_ENABLED === "true" ? <DeliveriesAdmin/> : <section><h1>Entregas privadas</h1><p>Activación pendiente de pruebas de privacidad, almacenamiento y recuperación.</p></section>}</PanelShell>;
}
