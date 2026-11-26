"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import type { PortfolioMedia } from "../lib/commercial/portfolio";
import { ExternalVideoCard } from "./external-video-card";
import styles from "./portfolio-interactive.module.css";

export function PortfolioGallery({ media }: { media: PortfolioMedia[] }) {
  const images = media.filter((item) => item.kind === "image");
  const [active, setActive] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const current = active === null ? null : images[active];
  const dismiss = () => setActive(null);
  const step = useCallback((offset: number) => setActive((index) => index === null ? null : (index + offset + images.length) % images.length), [images.length]);
  function show(item: PortfolioMedia) {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setActive(images.findIndex((image) => image.id === item.id));
  }
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (active !== null && !dialog.open) dialog.showModal();
    if (active === null && dialog.open) dialog.close();
  }, [active]);
  useEffect(() => {
    if (active === null) return;
    const navigate = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); step(1); }
    };
    window.addEventListener("keydown", navigate);
    return () => window.removeEventListener("keydown", navigate);
  }, [active, step]);
  return <><section className={styles.gallery} aria-label="Galería del proyecto">{media.map((item) => item.kind === "image" ? <button type="button" onClick={() => show(item)} key={item.id} data-orientation={item.orientation}><img src={item.url} alt={item.alt} loading="lazy" decoding="async"/><span>Ampliar fotografía</span></button> : <ExternalVideoCard media={item} key={item.id}/>)}</section><dialog ref={dialogRef} className={styles.lightbox} aria-label="Fotografía ampliada" onCancel={dismiss} onClose={() => { setActive(null); previousFocus.current?.focus(); }}>{current ? <div className={styles.lightboxInterior}><header><span>{active! + 1} / {images.length}</span><button type="button" onClick={dismiss}>Cerrar ×</button></header><img src={current.url} alt={current.alt}/><nav aria-label="Navegar fotografías"><button type="button" onClick={() => step(-1)}>← Anterior</button><button type="button" onClick={() => step(1)}>Siguiente →</button></nav></div> : null}</dialog></>;
}
