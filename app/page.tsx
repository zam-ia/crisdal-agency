import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE_URL } from "./lib/config";
import {
  contentFormats,
  productionSteps,
  publicFaq,
  publicSite,
} from "./lib/public-site-content";
import {
  EmptyPortfolio,
  MarketingShell,
  SectionHeading,
  marketingStyles as styles,
} from "./ui/marketing/marketing-shell";
import { WhatsAppLink } from "./ui/whatsapp-link";

export const metadata: Metadata = {
  title: "Crisdal Agency | Creación de contenido y producción audiovisual",
  description:
    "Reels, fotografía comercial, producción audiovisual y cobertura de eventos para marcas, negocios y personas.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Crisdal Agency | Producción audiovisual",
    description:
      "Contenido visual profesional, fotografía y video para negocios y eventos.",
    url: SITE_URL,
    type: "website",
    locale: "es_PE",
    images: [{ url: "/brand/asesora-impulso.webp", width: 1000, height: 1250 }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Crisdal Agency",
  url: SITE_URL,
  image: `${SITE_URL}/brand/asesora-impulso.webp`,
  telephone: `+${publicSite.brand.whatsapp}`,
  areaServed: "Perú",
  address: { "@type": "PostalAddress", addressLocality: "Huancayo", addressCountry: "PE" },
  knowsAbout: ["Producción audiovisual", "Creación de contenido", "Fotografía comercial", "Video profesional"],
};

export default function Home() {
  return (
    <MarketingShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <section className={styles.homeHero} aria-labelledby="home-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Creación de contenido · Fotografía · Video</p>
          <h1 id="home-title">Tu negocio tiene algo que mostrar. <em>Hagamos que se vea como debería.</em></h1>
          <p>
            Creamos contenido visual profesional para marcas, negocios y personas. Desde reels y
            fotografía comercial hasta producciones audiovisuales y cobertura de eventos.
          </p>
          <div className={styles.heroActions}>
            <WhatsAppLink placement="content_hero" eventName="click_whatsapp_content_hero" phone={publicSite.brand.whatsapp} message={publicSite.messages.content} className={styles.primaryButton}>
              Quiero contenido para mi negocio
            </WhatsAppLink>
            <WhatsAppLink placement="events_hero" eventName="click_whatsapp_events_hero" phone={publicSite.brand.whatsapp} message={publicSite.messages.events} className={styles.secondaryButton}>
              Quiero cotizar mi evento
            </WhatsAppLink>
          </div>
          <div className={styles.heroNote}>
            <span>Contenido para negocios</span><i />
            <span>Fotografía profesional</span><i />
            <span>Producción audiovisual</span>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroFrame}>
            <Image src="/brand/asesora-impulso.webp" alt="Integrante del equipo de Crisdal Agency" fill priority sizes="(max-width: 800px) 94vw, 44vw" />
          </div>
          <p><span>Dirección creativa</span> Producción con intención, no piezas aisladas.</p>
        </div>
      </section>

      <section className={styles.serviceSelector} aria-labelledby="choose-title">
        <div className={styles.selectorIntro}>
          <p className={styles.eyebrow}>Dos líneas, una misma exigencia visual</p>
          <h2 id="choose-title">¿Qué necesitas producir?</h2>
        </div>
        <Link href="/contenido" className={styles.selectorCard}>
          <span>70%</span><small>Para marcas y negocios</small>
          <h3>Contenido que muestra mejor lo que vendes.</h3>
          <p>Reels, fotografía comercial y campañas audiovisuales.</p>
        </Link>
        <Link href="/eventos" className={`${styles.selectorCard} ${styles.selectorEvent}`}>
          <span>30%</span><small>Para momentos importantes</small>
          <h3>Fotografía y video para conservar la historia.</h3>
          <p>Cobertura profesional con condiciones y fechas confirmadas.</p>
        </Link>
      </section>

      <section className={styles.darkSection}>
        <div className={styles.splitFeature}>
          <div>
            <SectionHeading eyebrow="Producción para negocios" title="Una imagen profesional antes de pedir atención." description="Diseñamos cada producción alrededor de una necesidad concreta: presentar, explicar, vender o construir confianza." />
            <ul className={styles.statementList}>
              <li><span>01</span> Mensaje y dirección visual antes de grabar.</li>
              <li><span>02</span> Producción adaptada al canal y al objetivo.</li>
              <li><span>03</span> Entregables y condiciones acordados por escrito.</li>
            </ul>
            <Link className={styles.textLink} href="/contenido">Explorar contenido para negocios</Link>
          </div>
          <div className={styles.editorialImage}>
            <Image src="/brand/plan-380.webp" alt="Pieza visual producida para la presentación comercial de Crisdal Agency" fill sizes="(max-width: 800px) 92vw, 42vw" />
            <span>Material de presentación Crisdal</span>
          </div>
        </div>
      </section>

      <section className={styles.lightSection}>
        <SectionHeading eyebrow="Proceso de producción" title="De la idea a una pieza que sí tiene un lugar." />
        <ol className={styles.processGrid}>
          {productionSteps.map((step) => (
            <li key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.text}</p></li>
          ))}
        </ol>
      </section>

      <section className={styles.formatsSection}>
        <SectionHeading eyebrow="Formatos audiovisuales" title="El formato correcto para lo que necesitas comunicar." description="No empezamos por la cantidad. Empezamos por el uso, el contexto y la intención de cada activo." />
        <div className={styles.formatGrid}>
          {contentFormats.map((format) => (
            <article key={format.title}><span>Formato audiovisual</span><h3>{format.title}</h3><p>{format.text}</p></article>
          ))}
        </div>
      </section>

      <section className={styles.plansSection} id="planes">
        <SectionHeading eyebrow="Planes de contenido" title="Un punto de partida. El alcance se confirma contigo." description="Publicamos los precios de referencia aprobados. Los entregables y condiciones se validan antes de contratar." />
        <div className={styles.planGrid}>
          {publicSite.contentPlans.map((plan) => (
            <article className={plan.recommended ? styles.featuredPlan : styles.planCard} key={plan.slug}>
              {plan.recommended ? <strong className={styles.planBadge}>Recomendado</strong> : null}
              <span>Punto de partida</span><h3>{plan.name}</h3><p className={styles.price}>{plan.price}</p>
              <p>{plan.summary}</p><small>Alcance y condiciones sujetos a confirmación.</small>
              <WhatsAppLink placement={`plan_${plan.slug}`} eventName={`click_whatsapp_plan_${plan.slug}`} phone={publicSite.brand.whatsapp} message={plan.message} className={plan.recommended ? styles.primaryButton : styles.secondaryButton}>
                Consultar este plan
              </WhatsAppLink>
            </article>
          ))}
        </div>
        <Link className={styles.textLinkDark} href="/planes">Comparar planes y condiciones</Link>
      </section>

      <section className={styles.photoFeature}>
        <div className={styles.photoCopy}>
          <SectionHeading eyebrow="Fotografía profesional" title="Producto, espacio y equipo con una mirada coherente." description="La fotografía comercial ayuda a que la calidad que ya existe en tu negocio también se perciba en pantalla." />
          <WhatsAppLink placement="photography" eventName="click_whatsapp_photography" phone={publicSite.brand.whatsapp} message={publicSite.messages.photography} className={styles.secondaryButton}>Cotizar fotografía comercial</WhatsAppLink>
        </div>
        <div className={styles.photoComposition} aria-hidden><span>4:5</span><span>16:9</span><span>9:16</span></div>
      </section>

      <section className={styles.portfolioSection}>
        <SectionHeading eyebrow="Portafolio" title="Trabajo real, contexto real y publicación autorizada." />
        <EmptyPortfolio />
      </section>

      <section className={styles.eventsSection}>
        <div className={styles.eventsLead}>
          <p className={styles.eyebrow}>Cobertura de eventos</p>
          <h2>Hay momentos que no se repiten. La producción tampoco debería improvisarse.</h2>
          <p>Fotografía y video profesional para eventos, con disponibilidad, equipo y entregables confirmados antes de reservar.</p>
          <WhatsAppLink placement="events_section" eventName="click_whatsapp_events_section" phone={publicSite.brand.whatsapp} message={publicSite.messages.events} className={styles.primaryButton}>Consultar disponibilidad</WhatsAppLink>
        </div>
        <div className={styles.eventPackages}>
          {publicSite.eventPackages.map((pack) => (
            <article key={pack.slug}><span>Cobertura</span><h3>{pack.name}</h3><p>{pack.summary}</p>
              <WhatsAppLink placement={`event_${pack.slug}`} eventName={`click_whatsapp_event_${pack.slug}`} phone={publicSite.brand.whatsapp} message={pack.message}>Consultar paquete</WhatsAppLink>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.methodSection}>
        <SectionHeading eyebrow="Metodología" title="Una producción clara desde la primera conversación." />
        <div className={styles.methodStrip}>
          <p><span>Brief</span> Entendemos la necesidad y el uso final.</p>
          <p><span>Propuesta</span> Acordamos alcance, fecha y condiciones.</p>
          <p><span>Producción</span> Ejecutamos con dirección y cuidado técnico.</p>
          <p><span>Entrega</span> Compartimos lo contratado y cerramos el proyecto.</p>
        </div>
      </section>

      <section className={styles.faqSection}>
        <SectionHeading eyebrow="Preguntas frecuentes" title="Claridad antes de producir." />
        <div className={styles.faqList}>
          {publicFaq.map((item) => (
            <details key={item.question}><summary>{item.question}<span aria-hidden>+</span></summary><p>{item.answer}</p></details>
          ))}
        </div>
      </section>

      <section className={styles.finalCta}>
        <p className={styles.eyebrow}>Tu próxima producción</p>
        <h2>Muéstranos qué quieres comunicar. Nosotros te ayudamos a convertirlo en imagen.</h2>
        <div className={styles.heroActions}>
          <WhatsAppLink placement="public_final" eventName="click_whatsapp_public_final" phone={publicSite.brand.whatsapp} message={publicSite.messages.general} className={styles.darkButton}>Hablar con Crisdal</WhatsAppLink>
          <Link className={styles.lightLink} href="/contacto">Elegir una consulta</Link>
        </div>
      </section>
    </MarketingShell>
  );
}
