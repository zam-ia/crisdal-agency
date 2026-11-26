import { requirePanelSession } from "../../lib/os/dal";
import { PanelShell } from "../../ui/os/panel-shell";
import { PackageAdmin } from "./package-admin";

export const metadata = { title: "Paquetes | Crisdal OS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PackagesAdminPage() {
  const session = await requirePanelSession("packages.read");
  return <PanelShell session={session} currentPath="/panel/paquetes"><PackageAdmin canWrite={session.capabilities.includes("packages.write")} /></PanelShell>;
}
