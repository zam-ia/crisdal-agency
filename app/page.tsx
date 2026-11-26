/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "./lib/config";
import { toPublicPortfolioCard } from "./lib/commercial/portfolio-public-card";
import { CoverageSection } from "./ui/marketing/coverage-section";
import { PortfolioPreview } from "./ui/marketing/portfolio-preview";
import focus from "./ui/marketing/home-focus.module.css";
import { safePublicPortfolio } from "./lib/commercial/portfolio-repository";
import { publicFaq, publicSite } from "./lib/public-site-content";
import { MarketingShell, SectionHeading, marketingStyles as styles } from "./ui/marketing/marketing-shell";
import { WhatsAppLink } from "./ui/whatsapp-link";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Fotografía y video para eventos en Huancayo | Crisdal Agency", description: "Fotografía y video profesional para bodas, quinceaños, celebraciones y eventos corporativos. Consulta disponibilidad con Crisdal Agency.", alternates: { canonical: "/" }, openGraph: { title: "Crisdal Agency | Fotografía y video para eventos", description: "Hay momentos que merecen volver a vivirse.", url: SITE_URL, type: "website", locale: "es_PE" } };
const jsonLd = { "@context": "https://schema.org", "@type": "ProfessionalService", name: "Crisdal Agency", url: SITE_URL, telephone: `+${publicSite.brand.whatsapp}`, knowsAbout: ["Fotografía de bodas", "Video de eventos", "Quinceaños", "Eventos corporativos", "Producción audiovisual"] };
function isEventProject(category: string) { return /boda|quince|evento|bautizo|pedida|sesion|celebracion|behind/i.test(category.normalize("NFD").replace(/[\u0300-\u036f]/g, "")); }

export default async function Home() {
  const projects = await safePublicPortfolio();
  const events = projects.filter((project) => isEventProject(project.categorySlug));
  const featured = events.find((project) => project.featured && project.media.some((item) => item.kind === "image")) || events.find((project) => project.media.some((item) => item.kind === "image"));
  const featuredCover = featured && (featured.media.find((item) => item.id === featured.coverAssetId && item.kind === "image") || featured.media.find((item) => item.kind === "image"));
  return <MarketingShell>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <section className={`${styles.homeHero} ${focus.hero}`} data-has-cover={Boolean(featuredCover)} aria-labelledby="home-title">
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>CRISDAL AGENCY · HUANCAYO</p>
        <h1 id="home-title">Fotografía y video <em>para tu evento.</em></h1>
        <p>Documentamos bodas, quinceaños y eventos corporativos en Huancayo.</p>
        <div className={styles.heroActions}><Link href="/consultar-fecha" className={styles.primaryButton}>Consultar mi fecha</Link><Link href="/portafolio" className={styles.secondaryButton}>Ver portafolio</Link></div>
        <p className={focus.heroReassurance}>Consulta con anticipación para confirmar disponibilidad. Consultar no reserva la fecha.</p>
      </div>
      {featured && featuredCover ? <div className={styles.heroVisual}><Link href={`/portafolio/${featured.slug}`} className={styles.heroFrame}><img src={featuredCover.url} alt={featuredCover.alt} fetchPriority="high" /><span className={styles.realWorkBadge}>{featured.categoryName} · Ver trabajo</span></Link></div> : null}
    </section>
    <PortfolioPreview projects={events.slice(0, 3).map(toPublicPortfolioCard)} />
    <CoverageSection />
    <section className={styles.lightSection}><SectionHeading eyebrow="Cómo contratar" title="De la consulta a tu evento." /><ol className={styles.processGrid}>{[{n:"01",t:"Cuéntanos",p:"Tipo de evento, fecha aproximada, lugar y lo que deseas conservar."},{n:"02",t:"Verificamos",p:"Revisamos disponibilidad, logística y el equipo necesario."},{n:"03",t:"Acordamos",p:"Definimos cobertura, entregables, precio y condiciones por escrito."},{n:"04",t:"Confirmamos",p:"Solo una confirmación explícita convierte la consulta en reserva."}].map((step)=><li key={step.n}><span>{step.n}</span><h3>{step.t}</h3><p>{step.p}</p></li>)}</ol></section>
    <section className={styles.faqSection}><SectionHeading eyebrow="Preguntas frecuentes" title="Resolvemos tus dudas." /><div className={styles.faqList}>{publicFaq.slice().sort((a)=>a.question.includes("reserva")?-1:1).map((item)=><details key={item.question}><summary>{item.question}<span aria-hidden>+</span></summary><p>{item.answer}</p></details>)}</div></section>
    <section className={styles.finalCta}><p className={styles.eyebrow}>Consulta tu fecha</p><h2>¿Ya tienes fecha para tu evento?</h2><div className={styles.heroActions}><Link className={styles.darkButton} href="/consultar-fecha">Consultar mi fecha</Link><WhatsAppLink placement="public_final" eventName="click_whatsapp_events_final" phone={publicSite.brand.whatsapp} message={publicSite.messages.eventAvailability} className={styles.lightLink}>Prefiero WhatsApp</WhatsAppLink></div></section>
    <section className={styles.secondaryBusiness}><div><p className={styles.eyebrow}>También para negocios</p><h2>Contenido audiovisual con dirección, mensaje y uso definido.</h2><p>Reels, fotografía comercial y producciones audiovisuales para marcas.</p></div><Link href="/contenido" className={styles.secondaryButton}>Explorar contenido para negocios</Link></section>
  </MarketingShell>;
}
