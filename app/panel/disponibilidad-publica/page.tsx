import { requirePanelSession } from "../../lib/os/dal";
import { PanelShell } from "../../ui/os/panel-shell";
import { PublicAvailabilityAdmin } from "./availability-admin";
export const metadata = { title: "Disponibilidad pública | Crisdal OS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function PublicAvailabilityAdminPage() {
  const session = await requirePanelSession("calendar.write");
  return <PanelShell session={session} currentPath="/panel/disponibilidad-publica"><PublicAvailabilityAdmin /></PanelShell>;
}
