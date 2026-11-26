/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { safePublicPortfolio, safePublicPortfolioProject } from "../../lib/commercial/portfolio-repository";
import { SITE_URL } from "../../lib/config";
import { portfolioCover, portfolioDetailMedia } from "../../lib/commercial/portfolio-public-card";
import {inquiryHref,eventTypeForCategory} from "../../lib/availability/inquiry-context";
import { MarketingShell } from "../../ui/marketing/marketing-shell";
import { ProjectShare } from "../project-share";
import { PortfolioGallery } from "../portfolio-gallery";
import styles from "../portfolio.module.css";

function narrative(category:string){const normalized=category.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();if(/boda|quince|celebr|bautizo|pedida/.test(normalized))return"Una historia para volver a sentirla.";if(/corporativo|empresa/.test(normalized))return"Cobertura profesional, claridad visual y cada momento importante en contexto.";return"Una producción construida alrededor de una historia real.";}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const project = await safePublicPortfolioProject(slug);
  if(!project)return {title:"Proyecto no disponible | Crisdal Agency",robots:{index:false,follow:false}};
  const cover=portfolioCover(project),image=cover?.kind==="image"?cover.url:cover?.posterUrl;
  const title=project.title+" | Portafolio Crisdal",description=project.description.slice(0,155);
  const url="/portafolio/"+project.slug;
  return {title,description,alternates:{canonical:url},openGraph:{title,description,url,type:"website",locale:"es_PE",images:image&&image.startsWith("https://")&&!image.includes("/sign/")?[{url:image,alt:cover?.alt||project.title}]:[{url:"/brand/os-icon-512.png",alt:"Crisdal Agency"}]}};

}

export default async function PortfolioProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const project = await safePublicPortfolioProject(slug); if (!project) notFound();
  const related = (await safePublicPortfolio()).filter((item) => item.id !== project.id && item.categoryId === project.categoryId).slice(0, 3);
  const cover = portfolioCover(project);
  const gallery = portfolioDetailMedia(project);
  return <MarketingShell><article className={styles.projectPage}>
    <header className={styles.projectHeader}><Link className={styles.backLink} href="/portafolio">← Ver todo el portafolio</Link><p>{project.categoryName}</p><h1>{project.title}</h1><span>{project.serviceType}{project.year ? ` · ${project.year}` : ""}</span></header>
    {cover?.kind === "image" ? <img className={styles.projectCover} src={cover.url} alt={cover.alt} /> : null}
    {gallery.length ? <PortfolioGallery media={gallery} /> : null}
    <div className={styles.projectStory}><div><h2>{project.objective || narrative(project.categorySlug)}</h2></div><p>{project.description}</p></div>
    <div className={styles.nextStep}><div><h2>¿Buscas una cobertura así?</h2><div className={styles.journeyLinks}><Link href={inquiryHref({eventType:eventTypeForCategory(project.categorySlug),project:project.title})}>Consultar mi fecha</Link><Link href="/portafolio">Ver más trabajos</Link></div></div><ProjectShare title={project.title} url={new URL(`/portafolio/${project.slug}`, SITE_URL).href} /></div>
    {related.length ? <aside className={styles.related}><h2>Proyectos relacionados</h2>{related.map((item) => <Link href={`/portafolio/${item.slug}`} key={item.id}>{item.title}</Link>)}</aside> : null}
  </article></MarketingShell>;
}
