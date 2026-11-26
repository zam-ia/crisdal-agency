import type { Metadata } from "next";
import Link from "next/link";
import { contentFormats, productionSteps, publicSite } from "../lib/public-site-content";
import { MarketingShell, PageHero, SectionHeading, marketingStyles as styles } from "../ui/marketing/marketing-shell";
import { WhatsAppLink } from "../ui/whatsapp-link";

export const metadata: Metadata = {
  title: "Contenido para negocios | Crisdal Agency",
  description: "Reels, fotografía comercial y producción audiovisual para mostrar mejor lo que vende tu negocio.",
  alternates: { canonical: "/contenido" },
};

export default function ContentPage() {
  return <MarketingShell>
    <PageHero eyebrow="Contenido para negocios" title="Tu marca no necesita publicar por publicar. Necesita verse con intención." description="Producimos reels, fotografía y activos audiovisuales alrededor de un mensaje, un uso y un objetivo concreto.">
      <WhatsAppLink placement="content_page" eventName="click_whatsapp_content_page" phone={publicSite.brand.whatsapp} message={publicSite.messages.content} className={styles.primaryButton}>Conversar sobre mi negocio</WhatsAppLink>
    </PageHero>
    <section className={styles.formatsSection}><SectionHeading eyebrow="Capacidades" title="Una producción pensada para el canal y el momento de tu negocio." />
      <div className={styles.formatGrid}>{contentFormats.slice(0, 3).map((item)=><article key={item.title}><span>Formato audiovisual</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
    </section>
    <section className={styles.lightSection}><SectionHeading eyebrow="Cómo trabajamos" title="Primero el objetivo. Después la cámara." />
      <ol className={styles.processGrid}>{productionSteps.map(step=><li key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
    </section>
    <section className={styles.plansSection} id="planes"><SectionHeading eyebrow="Planes" title="Tres puntos de partida para conversar." description="El precio es referencial y el alcance se confirma antes de contratar." />
      <div className={styles.planGrid}>{publicSite.contentPlans.map((plan)=><article className={plan.recommended?styles.featuredPlan:styles.planCard} key={plan.slug}>{plan.recommended?<strong className={styles.planBadge}>Recomendado</strong>:null}<span>Punto de partida</span><h3>{plan.name}</h3><p className={styles.price}>{plan.price}</p><p>{plan.summary}</p><small>Entregables y condiciones sujetos a confirmación.</small><WhatsAppLink placement={`plan_${plan.slug}`} eventName={`click_whatsapp_plan_${plan.slug}`} phone={publicSite.brand.whatsapp} message={plan.message} className={plan.recommended?styles.primaryButton:styles.secondaryButton}>Consultar alcance</WhatsAppLink></article>)}</div>
      <Link href="/planes" className={styles.textLinkDark}>Ver comparación comercial</Link>
    </section>
  </MarketingShell>;
}
