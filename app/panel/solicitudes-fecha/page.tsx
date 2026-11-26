import { redirect } from "next/navigation";
import { requirePanelSession } from "../../lib/os/dal";
import { PanelShell } from "../../ui/os/panel-shell";
import { DateRequestsAdmin } from "./requests-admin";

export const metadata = { title: "Solicitudes de fechas | Crisdal OS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DateRequestsAdminPage() {
  const session = await requirePanelSession("clients.read");
  if (!session.capabilities.includes("calendar.read")) redirect("/panel?error=sin-permiso");
  return <PanelShell session={session} currentPath="/panel/solicitudes-fecha"><DateRequestsAdmin canWrite={session.capabilities.includes("calendar.write")} /></PanelShell>;
}
