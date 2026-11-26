/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { safePublicPortfolio, safePublicPortfolioProject } from "../../lib/commercial/portfolio-repository";
import { MarketingShell } from "../../ui/marketing/marketing-shell";
import { ProjectShare } from "../project-share";
import { PortfolioGallery } from "../portfolio-gallery";
import styles from "../portfolio.module.css";

function narrative(category:string){const normalized=category.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();if(/boda|quince|celebr|bautizo|pedida/.test(normalized))return"Una historia para volver a sentirla.";if(/corporativo|empresa/.test(normalized))return"Cobertura profesional, claridad visual y cada momento importante en contexto.";return"Una producción construida alrededor de una historia real.";}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const project = await safePublicPortfolioProject(slug);
  return project ? { title: `${project.title} | Portafolio Crisdal`, description: project.description.slice(0, 155), alternates: { canonical: `/portafolio/${slug}` } } : { title: "Proyecto no disponible | Crisdal Agency", robots: { index: false, follow: false } };
}

export default async function PortfolioProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const project = await safePublicPortfolioProject(slug); if (!project) notFound();
  const related = (await safePublicPortfolio()).filter((item) => item.id !== project.id && item.categoryId === project.categoryId).slice(0, 3);
  const cover = project.media.find((item) => item.id === project.coverAssetId) || project.media[0];
  return <MarketingShell><article className={styles.projectPage}>
    <header className={styles.projectHeader}><p>{project.categoryName}</p><h1>{project.title}</h1><span>{project.serviceType}{project.year ? ` · ${project.year}` : ""}</span></header>
    {cover?.kind === "image" ? <img className={styles.projectCover} src={cover.url} alt={cover.alt} /> : null}
    <div className={styles.projectStory}><div><p>{narrative(project.categorySlug)}</p><h2>{project.objective || narrative(project.categorySlug)}</h2></div><p>{project.description}</p></div>
    <PortfolioGallery media={project.media.filter((item) => item.id !== cover?.id)} />
    <ProjectShare title={project.title} path={`/portafolio/${project.slug}`} />
    {related.length ? <aside className={styles.related}><h2>Proyectos relacionados</h2>{related.map((item) => <Link href={`/portafolio/${item.slug}`} key={item.id}>{item.title}</Link>)}</aside> : null}
  </article></MarketingShell>;
}
