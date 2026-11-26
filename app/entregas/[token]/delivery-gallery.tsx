"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react";
import type { PrivateGalleryView } from "../../lib/deliveries/domain";
import styles from "./delivery-gallery.module.css";

export function DeliveryGallery({ token, gallery }: { token: string; gallery: PrivateGalleryView }) {
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set(gallery.assets.filter((item) => item.favorite).map((item) => item.id)));
  const [mode, setMode] = useState<"all" | "favorites">("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pendingFavorites = useRef(new Set<string>());
  const images = useMemo(() => gallery.assets.filter((item) => item.kind === "image"), [gallery.assets]);
  const videos = useMemo(() => gallery.assets.filter((item) => item.kind === "video"), [gallery.assets]);
  const visible = mode === "favorites" ? images.filter((item) => favorites.has(item.id)) : images;
  const activeIndex = visible.findIndex((item) => item.id === activeId);
  const current = activeIndex >= 0 ? visible[activeIndex] : null;
  const active = Boolean(current);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!active || !dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, [active]);

  useEffect(() => {
    if (!active) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight" && visible.length) setActiveId((value) => visible[(visible.findIndex((x) => x.id === value) + 1) % visible.length]?.id || null);
      if (event.key === "ArrowLeft" && visible.length) setActiveId((value) => visible[(visible.findIndex((x) => x.id === value) - 1 + visible.length) % visible.length]?.id || null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, visible]);

  async function setFavorite(assetId: string) {
    if (pendingFavorites.current.has(assetId)) return;
    pendingFavorites.current.add(assetId);
    const nextValue = !favorites.has(assetId);
    setFavorites((currentFavorites) => {
      const optimistic = new Set(currentFavorites);
      if (nextValue) optimistic.add(assetId); else optimistic.delete(assetId);
      return optimistic;
    });
    if (!nextValue && mode === "favorites" && activeId === assetId) setActiveId(null);
    setBusy((old) => new Set([...old, assetId]));
    try {
      const response = await fetch(`/api/deliveries/${token}/favorites`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId, favorite: nextValue }),
      });
      if (!response.ok) throw new Error("No se pudo actualizar el favorito.");
      setNotice(nextValue ? "Fotografía añadida a tu selección." : "Fotografía retirada de tu selección.");
    } catch {
      setFavorites((currentFavorites) => {
        const restored = new Set(currentFavorites);
        if (nextValue) restored.delete(assetId); else restored.add(assetId);
        return restored;
      });
      setNotice("No se guardó el cambio. Inténtalo nuevamente.");
    } finally {
      pendingFavorites.current.delete(assetId);
      setBusy((old) => { const result = new Set(old); result.delete(assetId); return result; });
    }
  }
  const expires = new Intl.DateTimeFormat("es-PE", { dateStyle: "long", timeZone: "America/Lima" }).format(new Date(gallery.expiresAt));
  return <main className={styles.page}>
    <header className={styles.nav}>
      {/* Keep a full document navigation between private deliveries and marketing. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className={styles.brand} rel="noreferrer">CRISDAL <span>AGENCY</span></a>
      <span className={styles.private}>GALERÍA PRIVADA</span>
    </header>
    <section className={styles.hero}>
      <p className={styles.eyebrow}>{gallery.eventType} · Entrega exclusiva</p>
      <h1>{gallery.title}</h1>
      <p className={styles.intro}>{gallery.description || "Una colección de imágenes para volver a cada momento."}</p>
      <div className={styles.heroMeta}><span>{images.length} fotografías</span>{videos.length ? <span>{videos.length} videos</span> : null}<span>Acceso hasta el {expires}</span></div>
    </section>
    <section className={styles.gallerySection} aria-label="Galería del evento">
      <div className={styles.tools}>
        <div><h2>Tu colección</h2><p>Selecciona tus favoritas o abre una imagen para verla más grande.</p></div>
        <div className={styles.filters} role="group" aria-label="Filtrar fotografías">
          <button type="button" aria-pressed={mode === "all"} onClick={() => { setMode("all"); setActiveId(null); }}>Todas</button>
          <button type="button" aria-pressed={mode === "favorites"} onClick={() => { setMode("favorites"); setActiveId(null); }}>Favoritas ({favorites.size})</button>
        </div>
      </div>
      {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
      {!visible.length ? <div className={styles.empty}>Todavía no hay fotografías en esta selección. Usa “Todas” para explorar la galería.</div> :
      <div className={styles.grid}>{visible.map((image, i) => <article className={styles.photoCard} key={image.id}>
        <button type="button" className={styles.openPhoto} onClick={() => setActiveId(image.id)} aria-label={`Ampliar ${image.alt || image.title || `fotografía ${i+1}`}`}>
          {image.thumbUrl ? <img src={image.thumbUrl} alt={image.alt || image.title || "Fotografía del evento"} loading={i < 4 ? "eager" : "lazy"} referrerPolicy="no-referrer"/> : <span>Fotografía temporalmente no disponible</span>}
        </button>
        <div className={styles.cardActions}>
          <button type="button" onClick={() => void setFavorite(image.id)} disabled={busy.has(image.id)} aria-pressed={favorites.has(image.id)} aria-label={favorites.has(image.id) ? "Retirar de favoritas" : "Añadir a favoritas"}>
            <span aria-hidden>{favorites.has(image.id) ? "♥" : "♡"}</span> {favorites.has(image.id) ? "Seleccionada" : "Favorita"}
          </button>
          {gallery.allowDownloads ? <a href={`/api/deliveries/${token}/download/${image.id}`} referrerPolicy="no-referrer" title="Descargar fotografía original">Descargar</a> : null}
        </div>
      </article>)}</div>}
    </section>
    {videos.length ? <section className={styles.videoSection} aria-label="Videos del evento"><div><p className={styles.eyebrow}>EN MOVIMIENTO</p><h2>Vuelve a vivirlo.</h2></div><div className={styles.videos}>{videos.map((video) => video.externalUrl ?
      <a key={video.id} href={video.externalUrl} target="_blank" rel="noopener noreferrer" className={styles.videoCard}><span>VIDEO</span><strong>{video.title}</strong><small>Reproducir en plataforma original</small></a> : null)}</div></section> : null}
    <footer className={styles.footer}><p>Una entrega de Crisdal Agency. Este enlace es privado: evita reenviarlo a personas no autorizadas.</p><p>Las selecciones se guardan para esta galería y las verán las personas que tengan el enlace.</p><p>Si una imagen deja de cargar después de permanecer abierta mucho tiempo, actualiza la página para renovar el acceso temporal.</p></footer>
    {current && <dialog ref={dialogRef} className={styles.lightbox} aria-label="Visualizador de fotografía" onCancel={(event) => { event.preventDefault(); setActiveId(null); }}>
      <div className={styles.lightTop}><span>{activeIndex + 1} de {visible.length}</span><button type="button" onClick={() => setActiveId(null)}>Cerrar ×</button></div>
      {current.previewUrl ? <img src={current.previewUrl} alt={current.alt || current.title || "Fotografía ampliada"} referrerPolicy="no-referrer"/> : <p>Imagen no disponible.</p>}
      <div className={styles.lightBottom}>
        <button type="button" onClick={() => setActiveId(visible[(activeIndex - 1 + visible.length) % visible.length]?.id || null)}>← Anterior</button>
        <button type="button" onClick={() => void setFavorite(current.id)} aria-pressed={favorites.has(current.id)}>{favorites.has(current.id) ? "♥ Seleccionada" : "♡ Favorita"}</button>
        <button type="button" onClick={() => setActiveId(visible[(activeIndex + 1) % visible.length]?.id || null)}>Siguiente →</button>
      </div>
    </dialog>}
  </main>;
}
