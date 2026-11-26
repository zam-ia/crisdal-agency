import { requirePanelSession } from "../../lib/os/dal";
import { PanelShell } from "../../ui/os/panel-shell";
import { QuoteEditor } from "./quote-editor";

export const metadata = { title: "Cotizaciones | Crisdal OS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const session = await requirePanelSession("quotes.manage");
  return <PanelShell session={session} currentPath="/panel/cotizaciones"><QuoteEditor /></PanelShell>;
}
