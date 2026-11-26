"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { safeGalleryItems, type CinematicGalleryItem } from "../../lib/cinematic/gallery";
import styles from "./cinematic.module.css";

export function CinematicGallery({ items, eyebrow = "TRABAJOS SELECCIONADOS", title = "Historias que se quedan.", description = "Fotografía y video de momentos reales, publicados con autorización." }: { items: readonly CinematicGalleryItem[]; eyebrow?: string; title?: string; description?: string }) {
  const entries = useMemo(() => safeGalleryItems(items), [items]);
  const [active, setActive] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const current = active === null ? null : entries[active];

  function show(index: number) {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setActive(index);
  }
  function dismiss() { setActive(null); }
  const step = useCallback((offset: number) => setActive((index) => index === null ? null : (index + offset + entries.length) % entries.length), [entries.length]);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (active !== null && !node.open) node.showModal();
    if (active === null && node.open) { node.close(); previousFocus.current?.focus(); }
  }, [active]);
  useEffect(() => {
    if (active === null) return;
    const handle = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); step(1); }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [active, step]);

  return <section className={styles.gallery} aria-labelledby="cinematic-gallery-heading">
    <header className={styles.galleryHeading}><span>{eyebrow}</span><h2 id="cinematic-gallery-heading">{title}</h2><p>{description}</p></header>
    {entries.length ? <div className={styles.grid}>
      {entries.map((item, index) => <article className={styles.tile} key={item.id} data-aspect={item.aspect} data-hero={index === 0}>
        <img src={item.src} alt={item.alt} width={1200} height={1500} loading={index < 2 ? "eager" : "lazy"} decoding="async" />
        <div className={styles.tileVeil} aria-hidden="true" />
        <div className={styles.tileCopy}><span>{item.subtitle || (item.category === "events" ? "FOTOGRAFÍA & VIDEO DE EVENTOS" : "PRODUCCIÓN AUDIOVISUAL")}</span><h3>{item.title}</h3><div className={styles.tileActions}><button type="button" className={styles.glassAction} onClick={() => show(index)} aria-label={`Ampliar fotografía: ${item.title}`}>Ampliar <span aria-hidden>↗</span></button><Link href={item.href} className={styles.viewProject}>Ver historia <span aria-hidden>→</span></Link></div></div>
      </article>)}
    </div> : <div className={styles.empty}><h3>Pronto compartiremos nuestras historias.</h3><p>Solo publicamos material audiovisual auténtico y autorizado.</p></div>}
    <dialog ref={dialog} className={styles.lightbox} aria-label="Vista ampliada de portafolio" onClose={() => { dismiss(); previousFocus.current?.focus(); }}>
      {current ? <div className={styles.lightboxInterior}>
        <div className={styles.lightboxTop}><span>{active! + 1} / {entries.length} · {current.title}</span><button type="button" onClick={dismiss} aria-label="Cerrar imagen ampliada">Cerrar ×</button></div>
        <img src={current.src} alt={current.alt} loading="eager" />
        <div className={styles.lightboxBottom}><button type="button" onClick={()=>step(-1)} aria-label="Imagen anterior">← Anterior</button><Link href={current.href} onClick={dismiss}>Ver proyecto</Link><button type="button" onClick={()=>step(1)} aria-label="Imagen siguiente">Siguiente →</button></div>
      </div> : null}
    </dialog>
  </section>;
}

export function LiquidGlassLink({ href, children, emphasis = false }: { href: string; children: ReactNode; emphasis?: boolean }) {
  return <Link href={href} className={styles.liquidLink} data-emphasis={emphasis}><span>{children}</span><span aria-hidden="true">↗</span></Link>;
}
