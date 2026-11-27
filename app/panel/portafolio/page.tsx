import { requirePanelSession } from "../../lib/os/dal";
import { PanelShell } from "../../ui/os/panel-shell";
import { PortfolioAdmin } from "./portfolio-admin";

export const metadata = { title: "Portafolio | Crisdal OS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PortfolioAdminPage({ searchParams }: { searchParams: Promise<{ accion?: string }> }) {
  const session = await requirePanelSession("portfolio.manage");
  const startCreating=(await searchParams).accion==="nuevo";
  return <PanelShell session={session} currentPath="/panel/portafolio"><PortfolioAdmin key={String(startCreating)} startCreating={startCreating} /></PanelShell>;
}
