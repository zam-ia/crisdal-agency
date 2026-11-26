import Link from "next/link";
import {publicSite} from "../../lib/public-site-content";
import {WhatsAppLink} from "../whatsapp-link";
import styles from "./coverage-section.module.css";

export function CoverageSection({showCatalogLink=true}:{showCatalogLink?:boolean}){
 return <section id="coberturas" className={styles.section} aria-labelledby="coverage-title">
  <header className={styles.intro}>
   <div><p className={styles.eyebrow}>Fotografía y video</p><h2 id="coverage-title">Una cobertura para cada historia.</h2></div>
   <p>Explora nuestras tres propuestas. Definimos contigo la duración, el equipo y los entregables según tu evento.</p>
  </header>
  <div className={styles.cards}>
   {publicSite.eventPackages.map((pack,index)=><article key={pack.slug} className={styles.card}>
    <div className={styles.cardTop}><span className={styles.label}>Cobertura</span><span className={styles.number} aria-hidden="true">{String(index+1).padStart(2,"0")}</span></div>
    <h3>{pack.name}</h3>
    <p>{pack.summary}</p>
    <WhatsAppLink className={styles.action} placement={`event_${pack.slug}`} eventName={`click_whatsapp_event_${pack.slug}`} phone={publicSite.brand.whatsapp} message={pack.message}>Consultar paquete <span aria-hidden="true">↗</span></WhatsAppLink>
   </article>)}
  </div>
  <div className={styles.bottom}><p>La disponibilidad y las condiciones se confirman antes de reservar.</p>{showCatalogLink?<Link href="/paquetes">Explorar paquetes <span aria-hidden="true">→</span></Link>:<Link href="/consultar-fecha">Consultar mi fecha <span aria-hidden="true">→</span></Link>}</div>
 </section>
}
