import type { Metadata } from "next";
import Link from "next/link";
import { safePublicPackages } from "../lib/commercial/package-repository";
import { publicSite } from "../lib/public-site-content";
import { MarketingShell } from "../ui/marketing/marketing-shell";
import { WhatsAppLink } from "../ui/whatsapp-link";
import { PackageCatalog } from "./package-catalog";
import styles from "./packages.module.css";
import stateStyles from "./package-state.module.css";
import { PromotionSlot } from "../ui/marketing/promotion-slot";
import { CoverageSection } from "../ui/marketing/coverage-section";

export const metadata: Metadata = { title: "Paquetes audiovisuales | Crisdal Agency", description: "Explora opciones de fotografía y video para eventos y producción de contenido para negocios.", alternates: { canonical: "/paquetes" } };
export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  const state = await safePublicPackages();
  return <MarketingShell>
    <section className={styles.hero}>
      <p>CRISDAL AGENCY</p><h1>Paquetes de foto y video</h1>
      <span>Compara las coberturas y consulta cuál encaja con tu evento. La fecha solo se confirma al reservar.</span>
    </section>
    <PromotionSlot page="packages" />
    {state.status === "ready" ? <PackageCatalog packages={state.packages} /> :
      <><CoverageSection showCatalogLink={false} /><section className={stateStyles.state} aria-labelledby="packages-fallback">
        <p>Cobertura a medida</p>
        <h2 id="packages-fallback">Cuéntanos cómo será tu evento.</h2>
        <span>Indícanos la fecha y el lugar para orientarte sobre cobertura y disponibilidad.</span>
        <div className={stateStyles.actions}>
          <WhatsAppLink placement="public_packages_fallback" phone={publicSite.brand.whatsapp} message={publicSite.messages.eventAvailability} redirectAfterClick={false}>Consultar por WhatsApp</WhatsAppLink>
          <Link href="/portafolio">Ver portafolio</Link>
        </div>
      </section></>}
  </MarketingShell>;
}
