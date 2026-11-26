import type { Metadata } from "next";
import { safePublicPortfolio } from "../lib/commercial/portfolio-repository";
import { EmptyPortfolio, MarketingShell } from "../ui/marketing/marketing-shell";
import { PortfolioExplorer } from "./portfolio-explorer";
import styles from "./portfolio.module.css";

export const metadata: Metadata = { title: "Portafolio audiovisual | Crisdal Agency", description: "Proyectos reales de fotografía y producción audiovisual publicados con autorización.", alternates: { canonical: "/portafolio" } };
export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const projects = await safePublicPortfolio();
  return <MarketingShell>
    <section className={styles.hero}><p>Portafolio audiovisual</p><h1>Historias reales, producidas con intención.</h1><span>Fotografía y video organizados por proyecto, contexto y servicio. Solo publicamos material autorizado.</span></section>
    <section className={styles.archive}>{projects.length ? <PortfolioExplorer projects={projects} /> : <EmptyPortfolio />}</section>
  </MarketingShell>;
}
