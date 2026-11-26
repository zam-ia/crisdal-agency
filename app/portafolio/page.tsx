import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "../lib/config";
import { safePublicPortfolio } from "../lib/commercial/portfolio-repository";
import { toPublicPortfolioCard } from "../lib/commercial/portfolio-public-card";
import { EmptyPortfolio, MarketingShell } from "../ui/marketing/marketing-shell";
import { PortfolioExplorer } from "./portfolio-explorer";
import { ProjectShare } from "./project-share";
import styles from "./portfolio.module.css";

const description = "Explora trabajos de fotografía y video para bodas, quinceaños, eventos corporativos y marcas de Crisdal Agency.";
export const metadata: Metadata = { title: "Portafolio audiovisual | Crisdal Agency", description, alternates: { canonical: "/portafolio" }, openGraph: { title: "Portafolio | Crisdal Agency", description, url: "/portafolio", type: "website" } };
export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const projects = (await safePublicPortfolio()).map(toPublicPortfolioCard);
  return <MarketingShell>
    <section className={styles.hero}><p>CRISDAL AGENCY</p><h1>Portafolio audiovisual</h1><span>Fotografía y video de bodas, quinceaños, eventos corporativos y marcas.</span></section>
    <section className={styles.archive} aria-label="Trabajos de Crisdal">{projects.length ? <PortfolioExplorer projects={projects} /> : <EmptyPortfolio />}</section>
    <section className={styles.nextStep} aria-labelledby="portfolio-next"><div><p>¿Estás organizando un evento?</p><h2 id="portfolio-next">Hablemos de tu cobertura.</h2><div className={styles.journeyLinks}><Link href="/consultar-fecha">Consultar mi fecha</Link><Link href="/paquetes">Ver paquetes</Link><Link href="/">Conocer Crisdal</Link></div></div><ProjectShare collection title="Portafolio | Crisdal Agency" url={new URL("/portafolio", SITE_URL).href} /></section>
  </MarketingShell>;
}
