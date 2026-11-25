import type { Metadata } from "next";
import { EmptyPortfolio, MarketingShell, PageHero, marketingStyles as styles } from "../ui/marketing/marketing-shell";

export const metadata: Metadata = {
  title: "Portafolio audiovisual | Crisdal Agency",
  description: "Portafolio de fotografía, reels, producto, eventos y producción corporativa de Crisdal Agency.",
  alternates: { canonical: "/portafolio" },
};

const filters = ["Todos", "Reels", "Fotografía", "Producto", "Eventos", "Corporativo"];

export default function PortfolioPage() {
  return <MarketingShell>
    <PageHero eyebrow="Portafolio" title="Producciones reales, publicadas con contexto y autorización." description="Esta página está preparada para mostrar proyectos por formato y categoría sin convertir material de presentación en casos de éxito." />
    <section className={styles.portfolioSection}>
      <div className={styles.filterRow} aria-label="Categorías de portafolio">{filters.map((filter,index)=><span aria-current={index===0?"true":undefined} key={filter}>{filter}</span>)}</div>
      <EmptyPortfolio />
    </section>
  </MarketingShell>;
}
