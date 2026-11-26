"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useMemo, useState } from "react";
import type { PortfolioProject } from "../lib/commercial/portfolio";
import styles from "./portfolio.module.css";

function cover(project: PortfolioProject) { return project.media.find((item) => item.id === project.coverAssetId) || project.media[0]; }

export function PortfolioExplorer({ projects }: { projects: PortfolioProject[] }) {
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => Array.from(new Map(projects.map((project) => [project.categorySlug, project.categoryName])).entries()), [projects]);
  const visible = category === "all" ? projects : projects.filter((project) => project.categorySlug === category);
  return <>
    <div className={styles.filters} aria-label="Filtrar proyectos por categoría">
      <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")}>Todos</button>
      {categories.map(([slug, name]) => <button type="button" aria-pressed={category === slug} onClick={() => setCategory(slug)} key={slug}>{name}</button>)}
    </div>
    <section className={styles.grid} aria-live="polite">
      {visible.map((project, index) => { const asset = cover(project); return <Link href={`/portafolio/${project.slug}`} className={styles.card} data-featured={project.featured || index === 0} key={project.id}>
        {asset ? <img src={asset.kind === "image" ? asset.url : asset.posterUrl || "/brand/plan-380.webp"} alt={asset.alt} loading={index < 2 ? "eager" : "lazy"} decoding="async" /> : null}
        <div><span>{project.categoryName}</span><h2>{project.title}</h2><p>{project.serviceType}{project.year ? ` · ${project.year}` : ""}</p></div>
      </Link>; })}
      {!visible.length ? <div className={styles.empty}><h2>No hay proyectos publicados en esta categoría.</h2><p>Solo mostramos trabajos reales con autorización verificada.</p></div> : null}
    </section>
  </>;
}
