import type { Metadata } from "next";
import { publicSite } from "../lib/public-site-content";
import { MarketingShell, PageHero, SectionHeading, marketingStyles as styles } from "../ui/marketing/marketing-shell";
import { WhatsAppLink } from "../ui/whatsapp-link";

export const metadata: Metadata = {
  title: "Planes de contenido | Crisdal Agency",
  description: "Planes de referencia para creación de contenido audiovisual. Alcances y condiciones se confirman antes de contratar.",
  alternates: { canonical: "/planes" },
};

export default function PlansPage() {
  return <MarketingShell>
    <PageHero eyebrow="Planes comerciales" title="Un precio visible. Un alcance confirmado antes de producir." description="Los precios publicados son referencias comerciales aprobadas. No mostramos cantidades o bonos que todavía no hayan sido validados." />
    <section className={styles.plansSection} id="planes"><SectionHeading eyebrow="Contenido para negocios" title="Elige el punto de partida que quieres revisar." />
      <div className={styles.planGrid}>{publicSite.contentPlans.map((plan)=><article className={plan.recommended?styles.featuredPlan:styles.planCard} key={plan.slug}>{plan.recommended?<strong className={styles.planBadge}>Recomendado</strong>:null}<span>Punto de partida</span><h3>{plan.name}</h3><p className={styles.price}>{plan.price}</p><p>{plan.summary}</p><small>El alcance final se confirma por escrito.</small><WhatsAppLink placement={`plan_${plan.slug}`} eventName={`click_whatsapp_plan_${plan.slug}`} phone={publicSite.brand.whatsapp} message={plan.message} className={plan.recommended?styles.primaryButton:styles.secondaryButton}>Confirmar condiciones</WhatsAppLink></article>)}</div>
    </section>
    <section className={styles.eventsSection}><div className={styles.eventsLead}><SectionHeading eyebrow="Cobertura de eventos" title="MOMENTO, HISTORIA y CINEMA requieren cotización." description="No publicamos una tarifa ni entregables hasta confirmar que siguen vigentes." /></div><div className={styles.eventPackages}>{publicSite.eventPackages.map((pack)=><article key={pack.slug}><span>Cobertura</span><h3>{pack.name}</h3><p>{pack.summary}</p><WhatsAppLink placement={`event_${pack.slug}`} eventName={`click_whatsapp_event_${pack.slug}`} phone={publicSite.brand.whatsapp} message={pack.message}>Solicitar información</WhatsAppLink></article>)}</div></section>
  </MarketingShell>;
}
