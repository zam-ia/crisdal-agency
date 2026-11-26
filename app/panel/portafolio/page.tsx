import { requirePanelSession } from "../../lib/os/dal";
import { PanelShell } from "../../ui/os/panel-shell";
import { PortfolioAdmin } from "./portfolio-admin";

export const metadata = { title: "Portafolio | Crisdal OS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PortfolioAdminPage() {
  const session = await requirePanelSession("portfolio.manage");
  return <PanelShell session={session} currentPath="/panel/portafolio"><PortfolioAdmin /></PanelShell>;
}
