import type { Metadata } from "next";
import { MarketingShell } from "../ui/marketing/marketing-shell";
import { PublicAvailabilityExperience } from "../ui/availability/public-availability";

export const metadata: Metadata = {
  title: "Consulta una fecha para tu evento | Crisdal Agency",
  description: "Selecciona una fecha para boda, quinceaños o evento corporativo y solicita información de fotografía y video profesional. Consulta no equivale a reserva.",
  alternates: { canonical: "/consultar-fecha" },
};
export const dynamic = "force-dynamic";
export default function ConsultarFechaPage() {
  return <MarketingShell><PublicAvailabilityExperience /></MarketingShell>;
}
