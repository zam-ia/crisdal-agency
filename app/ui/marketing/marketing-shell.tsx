import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { publicSite } from "../../lib/public-site-content";
import { SiteTracking } from "../site-tracking";
import { WhatsAppLink } from "../whatsapp-link";
import styles from "./marketing.module.css";

const navigation = [
  { href: "/contenido", label: "Contenido" },
  { href: "/eventos", label: "Eventos" },
  { href: "/portafolio", label: "Portafolio" },
  { href: "/paquetes", label: "Paquetes" },
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
              src="/brand/crisdal-imagotipo.png"
              width={46}
              height={54}
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
        <nav className={styles.mobileNav} aria-label="Navegación comercial móvil">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
          <Link href="/contacto">Contacto</Link>
        </nav>
      </header>
      <main id="main-content">{children}</main>
      <footer className={styles.footer}>
        <div>
          <Link className={styles.footerBrand} href="/">Crisdal Agency</Link>
          <p>Creación de contenido y producción audiovisual desde Huancayo, Perú.</p>
        </div>
        <nav aria-label="Navegación del pie">
          {navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
          <Link href="/contacto">Contacto</Link>
          <Link href="/planes">Planes y condiciones</Link>
          <Link href="/ruta-crisdal">Ruta Crisdal</Link>
        </nav>
        <small>© 2026 Crisdal Agency. Los alcances y fechas se confirman antes de contratar.</small>
      </footer>
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
