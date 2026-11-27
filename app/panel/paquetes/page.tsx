import { requirePanelSession } from "../../lib/os/dal";
import { PanelShell } from "../../ui/os/panel-shell";
import { PackageAdmin } from "./package-admin";

export const metadata = { title: "Paquetes | Crisdal OS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PackagesAdminPage({ searchParams }: { searchParams: Promise<{ accion?: string }> }) {
  const session = await requirePanelSession("packages.read");
  const startCreating=(await searchParams).accion==="nuevo";
  return <PanelShell session={session} currentPath="/panel/paquetes"><PackageAdmin key={String(startCreating)} startCreating={startCreating} canWrite={session.capabilities.includes("packages.write")} /></PanelShell>;
}
