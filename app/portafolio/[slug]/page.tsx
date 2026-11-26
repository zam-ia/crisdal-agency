/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { safePublicPortfolio, safePublicPortfolioProject } from "../../lib/commercial/portfolio-repository";
import { MarketingShell } from "../../ui/marketing/marketing-shell";
import { ProjectShare } from "../project-share";
import styles from "../portfolio.module.css";

function embedUrl(value: string) {
  try { const url = new URL(value); if (url.hostname.includes("youtu")) { const id = url.hostname === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v"); return id ? `https://www.youtube-nocookie.com/embed/${id}` : null; } if (url.hostname.includes("vimeo")) { const id = url.pathname.split("/").filter(Boolean).at(-1); return id ? `https://player.vimeo.com/video/${id}` : null; } return null; } catch { return null; }
}

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
    <div className={styles.projectStory}><div><p>Una historia que merecía ser contada.</p><h2>{project.objective || "Una producción diseñada alrededor de un objetivo real."}</h2></div><p>{project.description}</p></div>
    <section className={styles.mediaGrid} aria-label="Galería del proyecto">{project.media.filter((item) => item.id !== cover?.id).map((media) => {
      if (media.kind === "image") return <img key={media.id} src={media.url} alt={media.alt} loading="lazy" decoding="async" data-orientation={media.orientation} />;
      const embed = embedUrl(media.url); return embed ? <iframe key={media.id} src={embed} title={media.alt} loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowFullScreen /> : <a key={media.id} href={media.url} target="_blank" rel="noopener noreferrer">Abrir video en el proveedor aprobado</a>;
    })}</section>
    <ProjectShare title={project.title} path={`/portafolio/${project.slug}`} />
    {related.length ? <aside className={styles.related}><h2>Proyectos relacionados</h2>{related.map((item) => <Link href={`/portafolio/${item.slug}`} key={item.id}>{item.title}</Link>)}</aside> : null}
  </article></MarketingShell>;
}
