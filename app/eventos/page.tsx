import type { Metadata } from "next";
import { publicSite } from "../lib/public-site-content";
import Link from "next/link";
import { MarketingShell, PageHero, SectionHeading, marketingStyles as styles } from "../ui/marketing/marketing-shell";
import { WhatsAppLink } from "../ui/whatsapp-link";
import { PromotionSlot } from "../ui/marketing/promotion-slot";

export const metadata: Metadata = {
  title: "Fotografía y video para eventos | Crisdal Agency",
  description: "Cobertura audiovisual profesional para eventos, con fecha, equipo y condiciones confirmadas antes de reservar.",
  alternates: { canonical: "/eventos" },
};

export default function EventsPage() {
  return <MarketingShell>
    <PageHero eyebrow="Fotografía y producción audiovisual" title="Hay momentos que merecen volver a vivirse." description="Fotografía y video profesional para bodas, quinceaños, celebraciones y eventos corporativos. La disponibilidad, el equipo y los entregables se confirman antes de reservar.">
      <WhatsAppLink placement="events_page" eventName="click_whatsapp_events_page" phone={publicSite.brand.whatsapp} message={publicSite.messages.eventAvailability} className={styles.primaryButton}>Cotizar mi evento</WhatsAppLink><Link href="/portafolio" className={styles.secondaryButton}>Ver nuestros trabajos</Link>
    </PageHero>
    <PromotionSlot page="events" />
    <section className={styles.eventCategorySection}><SectionHeading eyebrow="Tipo de evento" title="Cada celebración necesita una cobertura distinta." /><div className={styles.eventCategoryGrid}>{["Bodas","Quinceaños","Eventos corporativos","Cumpleaños y celebraciones","Bautizos","Pedidas de mano","Sesiones fotográficas","Detrás de cámaras"].map((item,index)=><a href="#coberturas" key={item}><span>{String(index+1).padStart(2,"0")}</span><h3>{item}</h3><p>Consulta disponibilidad y alcance según tu fecha.</p></a>)}</div></section>
    <section className={styles.eventsSection} id="coberturas"><div className={styles.eventsLead}><SectionHeading eyebrow="Propuestas de cobertura" title="Elige una referencia. Definimos juntos el alcance real." description="MOMENTO, HISTORIA y CINEMA son nombres de referencia; tarifas y condiciones todavía requieren confirmación comercial." /></div>
      <div className={styles.eventPackages}>{publicSite.eventPackages.map((pack)=><article key={pack.slug}><span>Cobertura</span><h3>{pack.name}</h3><p>{pack.summary}</p><WhatsAppLink placement={`event_${pack.slug}`} eventName={`click_whatsapp_event_${pack.slug}`} phone={publicSite.brand.whatsapp} message={pack.message}>Consultar condiciones</WhatsAppLink></article>)}</div>
    </section>
    <section className={styles.finalCta}><p className={styles.eyebrow}>Disponibilidad real</p><h2>Cuéntanos tu fecha, lugar y tipo de evento.</h2><div className={styles.heroActions}><WhatsAppLink placement="events_page" eventName="click_whatsapp_events_page_final" phone={publicSite.brand.whatsapp} message={publicSite.messages.eventAvailability} className={styles.darkButton}>Consultar mi fecha</WhatsAppLink></div></section>
    <section className={styles.lightSection}><SectionHeading eyebrow="Reserva responsable" title="Consultar una fecha no significa reservarla." description="Primero verificamos disponibilidad y alcance. La confirmación se realiza únicamente bajo las condiciones acordadas con Crisdal." />
      <div className={styles.methodStrip}><p><span>01</span> Cuéntanos fecha, lugar y tipo de evento.</p><p><span>02</span> Verificamos disponibilidad del equipo.</p><p><span>03</span> Acordamos cobertura, entregables y condiciones.</p><p><span>04</span> Recibes confirmación explícita de la reserva.</p></div>
    </section>
  </MarketingShell>;
}
