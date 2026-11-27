import { peruToday } from "../../lib/availability/public-calendar";
import { agendaDay } from "../../lib/os/agenda-calendar";
import { requirePanelSession } from "../../lib/os/dal";
import { PanelShell } from "../../ui/os/panel-shell";
import { AgendaClient } from "./agenda-client";

export const metadata = { title: "Agenda | Crisdal OS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ fecha?: string; accion?: string }> }) {
  const [session, query] = await Promise.all([requirePanelSession("calendar.read"), searchParams]);
  const today = peruToday();
  const initialDay = agendaDay(query.fecha, today);
  const startCreating = query.accion === "nuevo" && session.capabilities.includes("calendar.write");
  return <PanelShell session={session} currentPath="/panel/agenda">
    <AgendaClient key={initialDay + String(startCreating)} initialDay={initialDay} startCreating={startCreating} canWrite={session.capabilities.includes("calendar.write")} canReadProjects={session.capabilities.includes("projects.read")} />
  </PanelShell>;
}
