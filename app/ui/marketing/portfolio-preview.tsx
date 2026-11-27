/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type {PublicPortfolioCard} from "../../lib/commercial/portfolio-public-card";
import {publicSite} from "../../lib/public-site-content";
import {WhatsAppLink} from "../whatsapp-link";
import {SectionHeading,marketingStyles as styles} from "./marketing-shell";
import focus from "./home-focus.module.css";

export function PortfolioPreview({projects}:{projects:readonly PublicPortfolioCard[]}){
 return <section className={`${styles.portfolioSection} ${focus.portfolio}`} aria-label="Portafolio de eventos">
  <SectionHeading eyebrow="Portafolio de eventos" title="Así se ve nuestro trabajo." description={projects.length?"Explora historias reales de los eventos que hemos documentado.":undefined}/>
  {projects.length?<><div className={focus.samples}>{projects.map(project=><Link href={`/portafolio/${project.slug}`} className={focus.sample} key={project.slug}>
    <div className={focus.sampleVisual}>{project.image?<img src={project.image} alt="" loading="lazy" decoding="async"/>:<span>{project.hasSocial?"Publicación social":"Ver detalles del trabajo"}</span>}</div>
    <div className={focus.sampleCopy}><span>{project.categoryName}{project.hasVideo?" · Video":project.hasSocial?" · Redes sociales":""}</span><h3>{project.title}</h3><p>{project.serviceType}</p><span className={focus.sampleAction}>Ver trabajo <span aria-hidden="true">↗</span></span></div>
   </Link>)}</div><div className={focus.portfolioActions}><Link href="/portafolio" className={styles.secondaryButton}>Ver portafolio completo</Link></div></>:<div className={focus.emptyPreview}>
   <p>Estamos preparando nuestra selección de trabajos. Cuéntanos cómo será tu evento para solicitar referencias relacionadas.</p>
   <p className={focus.eventTypes}>Bodas · Quinceaños · Eventos corporativos · Celebraciones</p>
   <div className={focus.portfolioActions}><WhatsAppLink className={styles.primaryButton} placement="portfolio_empty" eventName="click_whatsapp_portfolio" phone={publicSite.brand.whatsapp} message={publicSite.messages.events} redirectAfterClick={false}>Solicitar referencias</WhatsAppLink><Link href="/portafolio" className={styles.secondaryButton}>Ver portafolio</Link></div>
  </div>}
 </section>
}
