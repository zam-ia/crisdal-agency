"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useMemo, useState } from "react";
import type { PortfolioProject } from "../lib/commercial/portfolio";
import styles from "./portfolio.module.css";
import filterStyles from "./portfolio-filters.module.css";

function cover(project: PortfolioProject) { return project.media.find((item) => item.id === project.coverAssetId) || project.media[0]; }

export function PortfolioExplorer({ projects }: { projects: PortfolioProject[] }) {
  const [category, setCategory] = useState("all");
  const [mediaType, setMediaType] = useState<"all"|"image"|"video">("all");
  const ordered = useMemo(() => [...projects].sort((a,b) => Number(!/boda|quince|evento|bautizo|pedida|sesion|celebracion|behind/i.test(a.categorySlug))-Number(!/boda|quince|evento|bautizo|pedida|sesion|celebracion|behind/i.test(b.categorySlug)) || Number(b.featured)-Number(a.featured)), [projects]);
  const categories = useMemo(() => Array.from(new Map(ordered.map((project) => [project.categorySlug, project.categoryName])).entries()), [ordered]);
  const visible = ordered.filter((project) => (category === "all" || project.categorySlug === category) && (mediaType === "all" || project.media.some((item)=>item.kind===mediaType)));
  return <>
    <div className={filterStyles.groups}>
    <div className={styles.filters} aria-label="Filtrar proyectos por categoría">
      <span className={filterStyles.label}>Categoría</span><button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")}>Todas</button>
      {categories.map(([slug, name]) => <button type="button" aria-pressed={category === slug} onClick={() => setCategory(slug)} key={slug}>{name}</button>)}
    </div>
    <div className={styles.filters} aria-label="Filtrar proyectos por formato"><span className={filterStyles.label}>Formato</span><button type="button" aria-pressed={mediaType === "all"} onClick={() => setMediaType("all")}>Todos</button><button type="button" aria-pressed={mediaType === "image"} onClick={() => setMediaType("image")}>Fotografía</button><button type="button" aria-pressed={mediaType === "video"} onClick={() => setMediaType("video")}>Video</button></div></div>
    <section className={styles.grid} aria-live="polite">
      {visible.map((project, index) => { const asset = cover(project); return <Link href={`/portafolio/${project.slug}`} className={styles.card} data-featured={project.featured || index === 0} key={project.id}>
        {asset ? <img src={asset.kind === "image" ? asset.url : asset.posterUrl || "/brand/plan-380.webp"} alt={asset.alt} loading={index < 2 ? "eager" : "lazy"} decoding="async" data-orientation={asset.orientation} /> : null}
        <div><span>{project.categoryName}</span><h2>{project.title}</h2><p>{project.serviceType}{project.year ? ` · ${project.year}` : ""}</p></div>
      </Link>; })}
      {!visible.length ? <div className={styles.empty}><h2>No hay proyectos publicados para este filtro.</h2><p>Prueba otra categoría o formato. Solo mostramos trabajos reales con autorización verificada.</p></div> : null}
    </section>
  </>;
}
