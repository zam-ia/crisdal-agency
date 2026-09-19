import type { Metadata } from "next";
import Image from "next/image";
import { cache } from "react";
import { SITE_URL } from "./lib/config";
import { getSiteContent } from "./lib/site-content";
import { MobileDock } from "./ui/mobile-dock";
import { AnimatedSteps } from "./ui/animated-steps";
import { PageMotion } from "./ui/page-motion";
import { RevealText } from "./ui/reveal-text";
import { SiteTracking } from "./ui/site-tracking";
import { Icon } from "./ui/symbol";
import { TrackedFaq } from "./ui/tracked-faq";
import { VslPlayer } from "./ui/vsl-player";
import { WhatsAppLink } from "./ui/whatsapp-link";

export const dynamic = "force-dynamic";
const getContent = cache(getSiteContent);

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  return {
    title: content.seo.title,
    description: content.seo.description,
    alternates: { canonical: "/" },
    openGraph: {
      title: content.seo.title,
      description: content.seo.description,
      url: SITE_URL,
      type: "website",
      locale: "es_PE",
      images: content.seo.ogImageUrl ? [{ url: content.seo.ogImageUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: content.seo.title,
      description: content.seo.description,
      images: content.seo.ogImageUrl ? [content.seo.ogImageUrl] : [],
    },
  };
}

const planPlacements = ["plan_420", "plan_820", "plan_1500"] as const;
const routeIcons = ["target", "video", "chart", "whatsapp"] as const;

export default async function Home() {
  const content = await getContent();

  return (
    <>
      <SiteTracking />
      <PageMotion />
      <a className="skip-link" href="#contenido">Saltar al contenido</a>

      <header className="site-header">
        <div className="shell header-inner">
          <a className="brand" href="#inicio" aria-label="Crisdal Agency, ir al inicio">
            <Image src={content.brand.logoUrl} width={44} height={52} alt="" className="brand-logo" priority />
          </a>
          <nav className="landing-nav" aria-label="Navegación principal">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#resultados">Resultados</a>
            <a href="#planes">Planes</a>
            <a href="#faq">FAQ</a>
          </nav>
          <WhatsAppLink
            placement="header"
            eventName="click_whatsapp_header"
            phone={content.brand.whatsappNumber}
            message={content.finalCta.whatsappMessage}
            className="header-cta"
          >
            Hablar con nosotros <Icon name="arrow" />
          </WhatsAppLink>
        </div>
      </header>

      <main id="contenido">
        <section className="hero shell" id="inicio" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span />{content.hero.eyebrow}</p>
            <RevealText title={content.hero.title} accent={content.hero.accent} />
            <p className="hero-description">{content.hero.description}</p>
            <div className="hero-action">
              <div className="hero-buttons">
                <WhatsAppLink
                  placement="hero"
                  eventName="click_whatsapp_hero"
                  phone={content.brand.whatsappNumber}
                  message={content.finalCta.whatsappMessage}
                  className="button button-gold"
                >
                  <Icon name="whatsapp" /> {content.hero.cta} <Icon name="arrow" />
                </WhatsAppLink>
              </div>
              <p>{content.hero.microcopy}</p>
            </div>
            <div className="hero-proof"><Icon name="check" /><span>{content.hero.proof}</span></div>
          </div>

          <div className="hero-media" id="vsl">
            <div className="vsl-heading">
              <p className="eyebrow">{content.vsl.eyebrow}</p>
              <h2>{content.vsl.title}</h2>
              <p>{content.vsl.description}</p>
            </div>
            <VslPlayer url={content.vsl.url} posterUrl={content.vsl.posterUrl} posterAlt={content.vsl.posterAlt} captionsUrl={content.vsl.captionsUrl} />
          </div>
        </section>

        <div className="trust-strip" aria-label="Capacidades conectadas">
          <div className="shell trust-items">
            <span>Estrategia</span><i>•</i><span>Producción</span><i>•</i><span>Meta Ads</span><i>•</i><span>WhatsApp</span>
            <strong>Todo conectado en una sola ruta.</strong>
          </div>
        </div>

        <section className="section shell problem" id="problema" aria-labelledby="pain-title">
          <div className="section-heading section-heading-split" data-reveal>
            <div><p className="eyebrow">{content.pain.eyebrow}</p><h2 id="pain-title">{content.pain.title}</h2></div>
            <p>{content.pain.intro}</p>
          </div>
          <div className="symptom-grid" data-reveal>
            {content.pain.symptoms.map((symptom, index) => (
              <article key={symptom}><span>{String(index + 1).padStart(2, "0")}</span><p>{symptom}</p></article>
            ))}
          </div>
          <div className="system-contrast" aria-label="Del desorden a una ruta conectada" data-reveal>
            <div><span>Contenido</span><b>×</b><span>Ads</span><b>×</b><span>Perfil</span><b>×</b><span>WhatsApp</span><small>DESORDEN</small></div>
            <i aria-hidden="true">↓</i>
            <div className="system-connected"><span>Contenido</span><b>→</b><span>Ads</span><b>→</b><span>Perfil</span><b>→</b><span>WhatsApp</span><small>CONVERSACIÓN</small></div>
          </div>
          <p className="section-closing">{content.pain.closing}</p>
        </section>

        <section className="section route-section" aria-labelledby="route-title">
          <div className="shell route-layout">
            <div className="route-intro" data-reveal>
              <p className="eyebrow">{content.paradigm.eyebrow}</p>
              <h2 id="route-title">{content.paradigm.title}</h2>
              <p>{content.paradigm.description}</p>
              <blockquote>“No vendemos videos. Construimos la ruta que convierte atención en conversaciones.”</blockquote>
            </div>
            <div className="route-flow" data-reveal>
              {content.paradigm.steps.map((step, index) => (
                <article key={step.title}>
                  <span className="route-step-marker"><Icon name={routeIcons[index] || "arrow"} /><b>0{index + 1}</b></span>
                  <div><h3>{step.title}</h3><p>{step.text}</p></div>
                </article>
              ))}
              <div className="route-outcome"><span>RESULTADO BUSCADO</span><strong>Oportunidad comercial</strong></div>
            </div>
          </div>
        </section>

        <section className="section mechanism-section" id="como-funciona" aria-labelledby="mechanism-title">
          <div className="shell">
            <div className="section-heading centered-heading" data-reveal>
              <p className="eyebrow">{content.mechanism.eyebrow}</p>
              <h2 id="mechanism-title">{content.mechanism.title}</h2>
              <p>{content.mechanism.description}</p>
            </div>
            <AnimatedSteps steps={content.mechanism.steps} />
          </div>
        </section>

        <section className="section shell evidence-section" id="resultados" aria-labelledby="cases-title">
          <div className="section-heading section-heading-split" data-reveal>
            <div><p className="eyebrow">{content.cases.eyebrow}</p><h2 id="cases-title">{content.cases.title}</h2></div>
            <p>{content.cases.intro}</p>
          </div>
          {content.cases.enabled && content.cases.items.length ? (
            <div className="case-grid">
              {content.cases.items.map((item) => (
                <article key={item.title}>
                  <h3>{item.title}</h3>
                  <dl>
                    <div><dt>Antes</dt><dd>{item.before}</dd></div>
                    <div><dt>Qué hicimos</dt><dd>{item.intervention}</dd></div>
                    <div><dt>Después</dt><dd>{item.result}</dd></div>
                    <div><dt>Evidencia</dt><dd>{item.proof}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <div className="proof-editorial" data-reveal>
              <div className="proof-photo">
                <Image src={content.authority.image.url} alt={content.authority.image.alt} width={900} height={1080} sizes="(max-width: 760px) 92vw, 46vw" />
                <span>PRODUCCIÓN REAL</span>
              </div>
              <div className="proof-copy">
                <p className="eyebrow">TRABAJO, CONTEXTO Y AUTORIZACIÓN</p>
                <h3>{content.authority.title}</h3>
                <p>{content.authority.description}</p>
                <div className="evidence-note"><Icon name="shield" /><span>{content.authority.note}</span></div>
              </div>
            </div>
          )}
        </section>

        <section className="section plans-section" id="planes" aria-labelledby="plans-title">
          <div className="shell">
            <div className="plans-lead" data-reveal>
              <div className="section-heading">
                <p className="eyebrow">{content.plans.eyebrow}</p>
                <h2 id="plans-title">{content.plans.title}</h2>
                <p>{content.plans.intro}</p>
              </div>
              <div className="benefit-mini-grid" aria-label={content.benefits.title}>
                {content.benefits.items.slice(0, 4).map((benefit, index) => <p key={benefit}><span>0{index + 1}</span>{benefit}</p>)}
              </div>
            </div>
            <div className="plans-grid" data-reveal>
              {content.plans.items.map((plan, index) => (
                <article className={`plan-card${plan.highlighted ? " plan-featured" : ""}`} key={plan.slug}>
                  {plan.badge ? <span className="plan-badge">{plan.badge}</span> : null}
                  <div className="plan-header"><span>0{index + 1}</span><h3>{plan.name}</h3></div>
                  <div className="plan-price"><strong>{plan.price}</strong><span>{plan.period}</span></div>
                  <p className="plan-audience">{plan.audience}</p>
                  <p className="plan-description">{plan.description}</p>
                  <ul>{plan.features.map((feature) => <li key={feature}><Icon name="check" />{feature}</li>)}</ul>
                  <p className="plan-disclaimer">{plan.disclaimer}</p>
                  <WhatsAppLink placement={planPlacements[index]} eventName={`click_whatsapp_${planPlacements[index]}`} phone={content.brand.whatsappNumber} message={plan.whatsappMessage} className={`button ${plan.highlighted ? "button-gold" : "button-outline"}`}>
                    {plan.cta} <Icon name="arrow" />
                  </WhatsAppLink>
                </article>
              ))}
            </div>
            <p className="plans-disclaimer">La inversión destinada a Meta Ads se contrata por separado y no está incluida en el precio del servicio.</p>
          </div>
        </section>

        <section className="section faq-section" id="faq" aria-labelledby="faq-title">
          <div className="shell faq-layout" data-reveal>
            <div><p className="eyebrow">{content.faq.eyebrow}</p><h2 id="faq-title">{content.faq.title}</h2><p className="faq-intro">{content.faq.intro}</p></div>
            <div className="faqs">{content.faq.items.map((item, index) => <TrackedFaq key={item.question} question={item.question} answer={item.answer} index={index} />)}</div>
          </div>
        </section>

        <section className="closing-section" aria-labelledby="closing-title">
          <div className="shell closing-content" data-reveal>
            <p className="eyebrow">{content.finalCta.eyebrow}</p>
            <h2 id="closing-title">{content.finalCta.title}</h2>
            <p>{content.finalCta.description}</p>
            <WhatsAppLink placement="final" eventName="click_whatsapp_final" phone={content.brand.whatsappNumber} message={content.finalCta.whatsappMessage} className="button button-gold">
              <Icon name="whatsapp" /> {content.finalCta.cta} <Icon name="arrow" />
            </WhatsAppLink>
            <small>Conversación directa. Sin formularios interminables.</small>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell footer-layout">
          <div className="brand footer-brand">
            <Image src={content.brand.logoUrl} width={36} height={42} alt="" className="brand-logo" />
            <span>CRISDAL<small>AGENCY</small></span>
          </div>
          <p>{content.footer.tagline}<span>{content.footer.legal}</span></p>
          <details className="privacy"><summary>Privacidad y medición</summary><p>{content.footer.privacy}</p></details>
        </div>
      </footer>
      <MobileDock content={content} />
    </>
  );
}
