import { requirePanelSession } from "../../lib/os/dal";
import { PanelShell } from "../../ui/os/panel-shell";
import { AgendaClient } from "./agenda-client";

export const metadata = { title: "Agenda | Crisdal OS", robots: { index: false, follow: false } }; export const dynamic = "force-dynamic";
export default async function AgendaPage() { const session = await requirePanelSession("calendar.read"); return <PanelShell session={session} currentPath="/panel/agenda"><AgendaClient canWrite={session.capabilities.includes("calendar.write")}/></PanelShell>; }
