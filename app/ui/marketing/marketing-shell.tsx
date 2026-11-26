import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { publicSite } from "../../lib/public-site-content";
import { SiteTracking } from "../site-tracking";
import { WhatsAppLink } from "../whatsapp-link";
import styles from "./marketing.module.css";

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
              src="/brand/crisdal-symbol.svg"
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
          <WhatsAppLink
            placement="public_header"
            eventName="click_whatsapp_public_header"
            phone={publicSite.brand.whatsapp}
            message={publicSite.messages.general}
            className={styles.headerCta}
          >
            Hablemos
          </WhatsAppLink>
        </div>
        <details className={styles.mobileMenu}><summary>Menú</summary><nav aria-label="Navegación comercial móvil">{navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}<Link href="/contenido">Contenido para negocios</Link><Link href="/planes">Planes</Link></nav></details>
      </header>
      <main id="main-content">{children}</main>
      <footer className={styles.footer}>
        <div>
          <Link className={styles.footerBrand} href="/">Crisdal Agency</Link>
          <p>Creación de contenido y producción audiovisual desde Huancayo, Perú.</p>
        </div>
        <nav aria-label="Navegación del pie">
          {navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
          <Link href="/contenido">Contenido para negocios</Link>
          <Link href="/planes">Planes y condiciones</Link>
          <Link href="/ruta-crisdal">Ruta Crisdal</Link>
        </nav>
        <small>© 2026 Crisdal Agency. Los alcances y fechas se confirman antes de contratar.</small>
      </footer>
      <WhatsAppLink
        placement="sticky"
        eventName="click_whatsapp_floating_public"
        phone={publicSite.brand.whatsapp}
        message={publicSite.messages.general}
        className={styles.floatingWhatsApp}
      >
        <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.1 11.8a8 8 0 0 1-11.5 7.1L4 20l1.25-4.3A8 8 0 1 1 20.1 11.8Z" />
          <path d="M9 8.1c-.3-.6-.5-.6-.8-.6-.35 0-.8.5-1 1.2-.35 1.7 1.75 4.4 4.25 5.8 1.9 1.1 3.25 1 3.8.55.3-.25.65-.9.65-1.3l-2.2-1.1-.95 1a6.65 6.65 0 0 1-2.9-3l.95-.95Z" />
        </svg>
        <span>WhatsApp</span>
      </WhatsAppLink>
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
        <p className={styles.eyebrow}>Archivo en preparación</p>
        <h2 id="portfolio-empty-title">Solo publicaremos trabajos con autorización.</h2>
        <p>
          La estructura del portafolio ya está preparada para fotografías y videos reales.
          Mientras seleccionamos el material autorizado, puedes conversar directamente con el equipo.
        </p>
      </div>
      <WhatsAppLink
        placement="portfolio_empty"
        eventName="click_whatsapp_portfolio"
        phone={publicSite.brand.whatsapp}
        message={publicSite.messages.general}
        className={styles.secondaryButton}
      >
        Consultar por trabajos relacionados
      </WhatsAppLink>
    </section>
  );
}

export { styles as marketingStyles };
