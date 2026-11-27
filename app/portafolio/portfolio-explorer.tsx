"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useMemo, useState } from "react";
import type { PublicPortfolioCard } from "../lib/commercial/portfolio-public-card";
import styles from "./portfolio.module.css";
import filterStyles from "./portfolio-filters.module.css";

const isEvent = (slug: string) => /boda|quince|evento|bautizo|pedida|sesion|celebracion/.test(slug);

export function PortfolioExplorer({ projects }: { projects: PublicPortfolioCard[] }) {
  const [category, setCategory] = useState("all");
  const [mediaType, setMediaType] = useState<"all"|"image"|"video">("all");
  const ordered = useMemo(() => [...projects].sort((a,b) => Number(isEvent(b.categorySlug))-Number(isEvent(a.categorySlug)) || Number(b.featured)-Number(a.featured)), [projects]);
  const categories = useMemo(() => Array.from(new Map(ordered.map((project) => [project.categorySlug, project.categoryName])).entries()), [ordered]);
  const inCategory = ordered.filter((project) => category === "all" || project.categorySlug === category);
  const visible = inCategory.filter((project) => mediaType === "all" || (mediaType === "image" ? project.hasPhoto : project.hasVideo));
  const categoriesVisible = categories.length > 1;
  const showFormats = inCategory.some((p) => p.hasPhoto) && inCategory.some((p) => p.hasVideo) && inCategory.some((p) => !p.hasPhoto || !p.hasVideo);
  return <>
    {categoriesVisible || showFormats ? <div className={filterStyles.groups}>
      {categoriesVisible ? <div className={styles.filters} role="group" aria-label="Tipo de trabajo">
        <button type="button" aria-pressed={category === "all"} onClick={() => { setCategory("all"); setMediaType("all"); }}>Todos</button>
        {categories.map(([slug, name]) => <button type="button" aria-pressed={category === slug} onClick={() => { setCategory(slug); setMediaType("all"); }} key={slug}>{name}</button>)}
      </div> : null}
      {showFormats ? <details className={styles.formatFilters}><summary>Filtrar por formato{mediaType === "all" ? "" : mediaType === "image" ? ": fotografía" : ": video"}</summary>
        <div className={styles.filters} role="group" aria-label="Formato"><button type="button" aria-pressed={mediaType === "all"} onClick={() => setMediaType("all")}>Todos</button><button type="button" aria-pressed={mediaType === "image"} onClick={() => setMediaType("image")}>Fotografía</button><button type="button" aria-pressed={mediaType === "video"} onClick={() => setMediaType("video")}>Video</button></div>
      </details> : null}
    </div> : null}
    <p className={styles.resultCount} role="status">{visible.length} {visible.length === 1 ? "trabajo" : "trabajos"}</p>
    <div className={styles.grid}>
      {visible.map((project, index) => <Link href={`/portafolio/${project.slug}`} className={styles.card} key={project.slug}>
        <div className={styles.cardVisual}>{project.image ? <img src={project.image} alt="" loading={index === 0 ? "eager" : "lazy"} decoding="async" /> : <span className={styles.noCover}>{project.hasSocial ? "Publicación social" : "Ver detalles del trabajo"}</span>}{project.hasVideo || project.hasSocial ? <span className={styles.videoTag}>{project.hasVideo ? "Video" : "Publicación social"}</span> : null}</div>
        <div className={styles.cardCopy}><span>{project.categoryName}</span><h2>{project.title}</h2><p>{project.serviceType}{project.year ? ` · ${project.year}` : ""}</p><span className={styles.openCase} aria-hidden="true">Ver trabajo ↗</span></div>
      </Link>)}
      {!visible.length ? <div className={styles.empty}><h2>No hay trabajos para este filtro.</h2><button type="button" onClick={() => { setCategory("all"); setMediaType("all"); }}>Ver todos</button></div> : null}
    </div>
  </>;
}
