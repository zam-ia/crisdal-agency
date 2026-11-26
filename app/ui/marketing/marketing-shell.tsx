import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { publicSite } from "../../lib/public-site-content";
import { SiteTracking } from "../site-tracking";
import { WhatsAppLink } from "../whatsapp-link";
import styles from "./marketing.module.css";
import { DisclosureNav } from "../disclosure-nav";
import { FloatingContact } from "./floating-contact";

const navigation = [
  { href: "/eventos", label: "Eventos" },
  { href: "/portafolio", label: "Portafolio" },
  { href: "/paquetes", label: "Paquetes" },
  { href: "/consultar-fecha", label: "Consultar fecha" },
  { href: "/contacto", label: "Contacto" },
];

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.site}>
      <SiteTracking />
      <a className={styles.skipLink} href="#main-content">
        Saltar al contenido
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.logo} href="/" aria-label="Crisdal Agency, inicio">
            <Image
              src="/brand/crisdal-icon.png"
              width={42}
              height={40}
              alt=""
              priority
            />
            <span>Crisdal<small>Agency</small></span>
          </Link>
          <nav className={styles.desktopNav} aria-label="Navegación comercial">
            {navigation.map((item) => (
              <Link href={item.href} key={item.href}>{item.label}</Link>
            ))}
          </nav>
          <DisclosureNav className={styles.mobileMenu} label="Menú" navLabel="Navegación comercial móvil">{navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}<Link href="/contenido">Contenido para negocios</Link><Link href="/planes">Planes</Link></DisclosureNav>
          <WhatsAppLink
            placement="public_header"
            eventName="click_whatsapp_public_header"
            phone={publicSite.brand.whatsapp}
            message={publicSite.messages.general}
            className={styles.headerCta}
            redirectAfterClick={false}
          >
            Hablemos
          </WhatsAppLink>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
      <footer className={styles.footer}>
        <div>
          <Link className={styles.footerBrand} href="/">Crisdal Agency</Link>
          <p>Fotografía y video de eventos. Producción audiovisual desde Huancayo, Perú.</p>
        </div>
        <nav aria-label="Navegación del pie">
          {navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
          <Link href="/contenido">Contenido para negocios</Link>
          <Link href="/planes">Planes y condiciones</Link>
          <Link href="/ruta-crisdal">Ruta Crisdal</Link>
        </nav>
        <small>© 2026 Crisdal Agency. Los alcances y fechas se confirman antes de contratar.</small>
      </footer>
      <FloatingContact>
      <WhatsAppLink
        placement="sticky"
        eventName="click_whatsapp_floating_public"
        phone={publicSite.brand.whatsapp}
        message={publicSite.messages.general}
        className={styles.floatingWhatsApp}
        redirectAfterClick={false}
      >
        <Image src="/brand/whatsapp-official.png" alt="" width={30} height={30} aria-hidden="true" />
        <span>WhatsApp</span>
      </WhatsAppLink>
      </FloatingContact>
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className={styles.pageHero}>
      <div className={styles.pageHeroCopy}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
        {children ? <div className={styles.heroActions}>{children}</div> : null}
      </div>
      <div className={styles.pageHeroMark} aria-hidden>
        <span>CR</span><i />
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header className={styles.sectionHeading}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </header>
  );
}

export function EmptyPortfolio() {
  return (
    <section className={styles.portfolioEmpty} aria-labelledby="portfolio-empty-title">
      <div>
        <p className={styles.eyebrow}>Portafolio de Crisdal</p>
        <h2 id="portfolio-empty-title">Encuentra una referencia para tu evento.</h2>
        <p>
          Estamos preparando esta selección. Cuéntanos qué tipo de evento tienes en mente y conversemos sobre el estilo de cobertura.
        </p>
      </div>
      <WhatsAppLink
        placement="portfolio_empty"
        eventName="click_whatsapp_portfolio"
        phone={publicSite.brand.whatsapp}
        message={publicSite.messages.general}
        className={styles.secondaryButton}
      >
        Solicitar referencias
      </WhatsAppLink>
    </section>
  );
}

export { styles as marketingStyles };
