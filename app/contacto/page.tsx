import type { Metadata } from "next";
import { publicSite } from "../lib/public-site-content";
import { MarketingShell, PageHero, marketingStyles as styles } from "../ui/marketing/marketing-shell";
import { WhatsAppLink } from "../ui/whatsapp-link";

export const metadata: Metadata = {
  title: "Contacto | Crisdal Agency",
  description: "Conversa con Crisdal Agency sobre contenido, fotografía comercial o cobertura audiovisual para eventos.",
  alternates: { canonical: "/contacto" },
};

const options = [
  { title: "Cobertura de evento", text: "Fecha, lugar y tipo de evento para revisar disponibilidad.", placement: "contact_events" as const, message: publicSite.messages.eventAvailability },
  { title: "Contenido para mi negocio", text: "Reels, producción audiovisual o una necesidad de comunicación.", placement: "contact_content" as const, message: publicSite.messages.content },
  { title: "Fotografía comercial", text: "Producto, espacios, retratos o equipo.", placement: "contact_photography" as const, message: publicSite.messages.photography },
  { title: "Consulta general", text: "Si aún no sabes qué formato necesitas, empezamos por el objetivo.", placement: "contact_general" as const, message: publicSite.messages.general },
];

export default function ContactPage() {
  return <MarketingShell>
    <PageHero eyebrow="Contacto" title="Cuéntanos qué necesitas mostrar o documentar." description="Elige el motivo de tu consulta para abrir WhatsApp con un mensaje contextual. Tú decides qué información enviar." />
    <section className={styles.contactGrid}>{options.map((option)=><article key={option.title}><span>Consulta</span><h2>{option.title}</h2><p>{option.text}</p><WhatsAppLink placement={option.placement} eventName={`click_whatsapp_${option.placement}`} phone={publicSite.brand.whatsapp} message={option.message} className={styles.secondaryButton}>Iniciar consulta</WhatsAppLink></article>)}</section>
    <section className={styles.contactNote}><strong>Importante</strong><p>Una conversación no confirma fecha, precio ni reserva. Recibirás las condiciones aplicables antes de contratar.</p></section>
  </MarketingShell>;
}
