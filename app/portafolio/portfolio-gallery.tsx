"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import type { PortfolioMedia } from "../lib/commercial/portfolio";
import { ExternalVideoCard } from "./external-video-card";
import styles from "./portfolio-interactive.module.css";

export function PortfolioGallery({ media }: { media: PortfolioMedia[] }) {
  const [active, setActive] = useState<PortfolioMedia | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (!active) return; closeRef.current?.focus(); const close = (event: KeyboardEvent) => { if (event.key === "Escape") setActive(null); }; document.addEventListener("keydown", close); return () => document.removeEventListener("keydown", close); }, [active]);
  return <><section className={styles.gallery} aria-label="Galería del proyecto">{media.map((item) => item.kind === "image" ? <button type="button" onClick={() => setActive(item)} key={item.id} data-orientation={item.orientation}><img src={item.url} alt={item.alt} loading="lazy" decoding="async"/><span>Ampliar fotografía</span></button> : <ExternalVideoCard media={item} key={item.id}/>)}</section>{active ? <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label="Fotografía ampliada"><button ref={closeRef} type="button" onClick={() => setActive(null)}>Cerrar</button><img src={active.url} alt={active.alt}/></div> : null}</>;
}
