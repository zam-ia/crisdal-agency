import type { Metadata } from "next";
import Image from "next/image";
import { cache } from "react";
import { SITE_URL } from "./lib/config";
import { getSiteContent } from "./lib/site-content";
import { MobileDock } from "./ui/mobile-dock";
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

export default async function Home() {
  const content = await getContent();

  return (
    <>
      <SiteTracking />
      <a className="skip-link" href="#contenido">Saltar al contenido</a>

      <header className="site-header">
        <div className="shell header-inner">
          <a className="brand" href="#inicio" aria-label="Crisdal Agency, ir al inicio">
            <Image src={content.brand.logoUrl} width={44} height={52} alt="" className="brand-logo" priority />
            <span>CRISDAL<small>AGENCY</small></span>
          </a>
          <span className="header-note"><span className="status-dot" />{content.brand.headerLabel}</span>
          <a className="header-plan-link" href="#planes">Planes</a>
          <WhatsAppLink
            placement="header"
            eventName="click_whatsapp_header"
            phone={content.brand.whatsappNumber}
            message={content.finalCta.whatsappMessage}
            className="header-cta"
          >
            Hablar por WhatsApp <Icon name="arrow" />
          </WhatsAppLink>
        </div>
      </header>

      <main id="contenido">
        <section className="hero shell" id="inicio" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span />{content.hero.eyebrow}</p>
            <h1 id="hero-title">{content.hero.title}<em>{content.hero.accent}</em></h1>
            <p className="hero-description">{content.hero.description}</p>
            <div className="hero-proof"><Icon name="check" /><span>{content.hero.proof}</span></div>
          </div>

          <div className="hero-media">
            <div className="vsl-heading">
              <p className="eyebrow">{content.vsl.eyebrow}</p>
              <h2>{content.vsl.title}</h2>
              <p>{content.vsl.description}</p>
            </div>
            <VslPlayer url={content.vsl.url} posterUrl={content.vsl.posterUrl} posterAlt={content.vsl.posterAlt} captionsUrl={content.vsl.captionsUrl} />
          </div>

          <div className="hero-action">
            <WhatsAppLink
              placement="hero"
              eventName="click_whatsapp_hero"
              phone={content.brand.whatsappNumber}
              message={content.finalCta.whatsappMessage}
              className="button button-gold"
            >
              <Icon name="whatsapp" /> {content.hero.cta} <Icon name="arrow" />
            </WhatsAppLink>
            <p>{content.hero.microcopy}</p>
          </div>
        </section>

        <div className="trust-strip" aria-label="Ruta de captación">
          <div className="shell trust-items">
            <span>Contenido que atrae</span><i>→</i><span>Meta Ads que distribuye</span><i>→</i><span>WhatsApp que recibe</span>
          </div>
        </div>

        <section className="section shell problem" aria-labelledby="pain-title">
          <div className="section-heading section-heading-split">
            <div><p className="eyebrow">{content.pain.eyebrow}</p><h2 id="pain-title">{content.pain.title}</h2></div>
            <p>{content.pain.intro}</p>
          </div>
          <div className="symptom-grid">
            {content.pain.symptoms.map((symptom, index) => (
              <article key={symptom}><span>{String(index + 1).padStart(2, "0")}</span><p>{symptom}</p></article>
            ))}
          </div>
          <p className="section-closing">{content.pain.closing}</p>
        </section>

        <section className="section paradigm-section" aria-labelledby="paradigm-title">
          <div className="shell">
            <div className="section-heading centered-heading">
              <p className="eyebrow">{content.paradigm.eyebrow}</p>
              <h2 id="paradigm-title">{content.paradigm.title}</h2>
              <p>{content.paradigm.description}</p>
            </div>
            <div className="route-grid">
              {content.paradigm.steps.map((step, index) => (
                <article key={step.title}>
                  <span className="route-number">0{index + 1}</span>
                  <div><h3>{step.title}</h3><p>{step.text}</p></div>
                  {index < content.paradigm.steps.length - 1 ? <b aria-hidden="true">→</b> : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section shell authority" aria-labelledby="authority-title">
          <div className="editorial-image">
            <Image src={content.authority.image.url} alt={content.authority.image.alt} width={900} height={1080} sizes="(max-width: 760px) 92vw, 44vw" />
            <span>CRISDAL / AGENCY</span>
          </div>
          <div className="editorial-copy">
            <p className="eyebrow">{content.authority.eyebrow}</p>
            <h2 id="authority-title">{content.authority.title}</h2>
            <p>{content.authority.description}</p>
            <p className="evidence-note"><Icon name="shield" />{content.authority.note}</p>
          </div>
        </section>

        <section className="section origin-section" aria-labelledby="origin-title">
          <div className="shell origin-layout">
            <div className="origin-copy">
              <p className="eyebrow">{content.origin.eyebrow}</p>
              <h2 id="origin-title">{content.origin.title}</h2>
              <p>{content.origin.description}</p>
            </div>
            <div className="origin-image">
              <Image src={content.origin.image.url} alt={content.origin.image.alt} width={1080} height={1350} sizes="(max-width: 760px) 78vw, 30vw" />
            </div>
          </div>
        </section>

        {content.cases.enabled && content.cases.items.length ? (
          <section className="section shell cases" aria-labelledby="cases-title">
            <div className="section-heading centered-heading">
              <p className="eyebrow">{content.cases.eyebrow}</p>
              <h2 id="cases-title">{content.cases.title}</h2>
              <p>{content.cases.intro}</p>
            </div>
            <div className="case-grid">
              {content.cases.items.map((item) => (
                <article key={item.title}>
                  <h3>{item.title}</h3>
                  <dl>
                    <div><dt>Antes</dt><dd>{item.before}</dd></div>
                    <div><dt>Intervención</dt><dd>{item.intervention}</dd></div>
                    <div><dt>Resultado</dt><dd>{item.result}</dd></div>
                    <div><dt>Prueba</dt><dd>{item.proof}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="section mechanism-section" aria-labelledby="mechanism-title">
          <div className="shell">
            <div className="section-heading section-heading-split">
              <div><p className="eyebrow">{content.mechanism.eyebrow}</p><h2 id="mechanism-title">{content.mechanism.title}</h2></div>
              <p>{content.mechanism.description}</p>
            </div>
            <ol className="mechanism-list">
              {content.mechanism.steps.map((step, index) => (
                <li key={step.title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{step.title}</h3><p>{step.text}</p></li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section shell benefits" aria-labelledby="benefits-title">
          <div className="benefits-title"><p className="eyebrow">{content.benefits.eyebrow}</p><h2 id="benefits-title">{content.benefits.title}</h2></div>
          <div className="benefit-list">
            {content.benefits.items.map((benefit, index) => (
              <article key={benefit}><span>0{index + 1}</span><p>{benefit}</p></article>
            ))}
          </div>
        </section>

        <section className="section plans-section" id="planes" aria-labelledby="plans-title">
          <div className="shell">
            <div className="section-heading centered-heading">
              <p className="eyebrow">{content.plans.eyebrow}</p>
              <h2 id="plans-title">{content.plans.title}</h2>
              <p>{content.plans.intro}</p>
            </div>
            <div className="plans-grid">
              {content.plans.items.map((plan, index) => (
                <article className={`plan-card${plan.highlighted ? " plan-featured" : ""}`} key={plan.slug}>
                  {plan.badge ? <span className="plan-badge">{plan.badge}</span> : null}
                  <div className="plan-header"><span>0{index + 1}</span><h3>{plan.name}</h3></div>
                  <p className="plan-audience">{plan.audience}</p>
                  <div className="plan-price"><strong>{plan.price}</strong><span>{plan.period}</span></div>
                  <p className="plan-description">{plan.description}</p>
                  <ul>{plan.features.map((feature) => <li key={feature}><Icon name="check" />{feature}</li>)}</ul>
                  <p className="plan-disclaimer">{plan.disclaimer}</p>
                  <WhatsAppLink
                    placement={planPlacements[index]}
                    eventName={`click_whatsapp_${planPlacements[index]}`}
                    phone={content.brand.whatsappNumber}
                    message={plan.whatsappMessage}
                    className={`button ${plan.highlighted ? "button-gold" : "button-outline"}`}
                  >
                    {plan.cta} <Icon name="arrow" />
                  </WhatsAppLink>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section shell process" aria-labelledby="process-title">
          <div className="section-heading section-heading-split">
            <div><p className="eyebrow">{content.process.eyebrow}</p><h2 id="process-title">{content.process.title}</h2></div>
            <p>{content.process.intro}</p>
          </div>
          <ol className="process-grid">
            {content.process.steps.map((step, index) => (
              <li key={step.title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{step.title}</h3><p>{step.text}</p></li>
            ))}
          </ol>
        </section>

        <section className="section faq-section" aria-labelledby="faq-title">
          <div className="shell faq-layout">
            <div><p className="eyebrow">{content.faq.eyebrow}</p><h2 id="faq-title">{content.faq.title}</h2><p className="faq-intro">{content.faq.intro}</p></div>
            <div className="faqs">{content.faq.items.map((item, index) => <TrackedFaq key={item.question} question={item.question} answer={item.answer} index={index} />)}</div>
          </div>
        </section>

        <section className="closing-section" aria-labelledby="closing-title">
          <div className="shell closing-content">
            <p className="eyebrow">{content.finalCta.eyebrow}</p>
            <h2 id="closing-title">{content.finalCta.title}</h2>
            <p>{content.finalCta.description}</p>
            <WhatsAppLink
              placement="final"
              eventName="click_whatsapp_final"
              phone={content.brand.whatsappNumber}
              message={content.finalCta.whatsappMessage}
              className="button button-gold"
            >
              <Icon name="whatsapp" /> {content.finalCta.cta} <Icon name="arrow" />
            </WhatsAppLink>
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
