/* eslint-disable @next/next/no-img-element */
"use client";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import type { GalleryAsset, GalleryInput, GalleryRecord } from "../../lib/deliveries/domain";
import styles from "./deliveries-admin.module.css";

const eventTypes: GalleryInput["eventType"][] = ["Boda","Quinceaños","Evento corporativo","Celebración","Bautizo","Pedida de mano","Sesión fotográfica","Otro"];
const initial = (): GalleryInput => ({ title: "", eventType: "Boda", description: "", allowDownloads: false });
async function api<T>(url: string, data?: unknown): Promise<T> {
  const response = await fetch(url, data ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) } : undefined);
  const result = await response.json().catch(() => ({ error: "Respuesta inesperada del servidor." }));
  if (!response.ok) throw new Error(result.error || "No se pudo completar la acción.");
  return result as T;
}
type AdminGalleryAsset = GalleryAsset & { thumbnailUrl?: string | null };
type GalleryDetails = { gallery: GalleryRecord; assets: AdminGalleryAsset[] };
export function DeliveriesAdmin() {
  const [projects,setProjects]=useState<{id:string;title:string}[]>([]);
  const [galleries, setGalleries] = useState<GalleryRecord[]>([]);
  const [editor, setEditor] = useState<GalleryInput | null>(null);
  const [current, setCurrent] = useState<GalleryRecord | null>(null);
  const [assets, setAssets] = useState<AdminGalleryAsset[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadState, setUploadState] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [video, setVideo] = useState({ title: "", url: "" });
  const refresh = async () => {
    const result = await api<{ galleries: GalleryRecord[]; projects:{id:string;title:string}[] }>("/api/panel/deliveries");
    setGalleries(result.galleries); setProjects(result.projects);
    setError("");
  };
  useEffect(() => {
    void api<{ galleries: GalleryRecord[]; projects:{id:string;title:string}[] }>("/api/panel/deliveries")
      .then((data) => {setGalleries(data.galleries);setProjects(data.projects);})
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Módulo no activado."));
  }, []);
  async function openGallery(id: string) {
    setBusy(true); setNotice(""); setShareUrl("");
    try {
      const data = await api<GalleryDetails>(`/api/panel/deliveries?id=${encodeURIComponent(id)}`);
      setCurrent(data.gallery); setAssets(data.assets);
      setEditor({ id: data.gallery.id, projectId:data.gallery.projectId??null, title: data.gallery.title, eventType: data.gallery.eventType, description: data.gallery.description, allowDownloads: data.gallery.allowDownloads });
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "No se pudo abrir."); }
    finally { setBusy(false); }
  }
  async function save() {
    if (!editor) return;
    setBusy(true); setNotice("");
    try {
      const result = await api<{ gallery: GalleryRecord }>("/api/panel/deliveries", { action: "save", gallery: editor });
      setCurrent(result.gallery); setEditor((old) => old ? { ...old, id: result.gallery.id } : null);
      setNotice("Galería guardada. Ya puedes subir fotografías o añadir un video.");
      await refresh();
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "No se pudo guardar."); }
    finally { setBusy(false); }
  }
  async function publication(publish: boolean) {
    if (!current) return;
    if (publish && current.status === "published" && !window.confirm("Se generará un enlace nuevo y el anterior dejará de funcionar. ¿Continuar?")) return;
    if (!publish && !window.confirm("¿Despublicar esta entrega y revocar el enlace privado?")) return;
    setBusy(true); setNotice("");
    try {
      if (publish) {
        const result = await api<{ gallery: GalleryRecord; token: string }>("/api/panel/deliveries", { action: "publish", id: current.id });
        setCurrent(result.gallery);
        setShareUrl(`${window.location.origin}/entregas/${result.token}`);
        setNotice("Enlace generado. Cópialo ahora: por seguridad, no se almacena en texto legible.");
      } else {
        await api("/api/panel/deliveries", { action: "unpublish", id: current.id });
        setShareUrl(""); setNotice("Enlace revocado. Las copias temporales ya emitidas pueden durar algunos minutos.");
        await openGallery(current.id);
      }
      await refresh();
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "No se pudo actualizar la entrega."); }
    finally { setBusy(false); }
  }
  async function upload(files: FileList | null) {
    if (!current || !files?.length) return;
    setBusy(true); setNotice("");
    const all = Array.from(files);
    let completed = 0;
    for (const [index, file] of all.entries()) {
      setUploadState(`Subiendo ${index + 1} de ${all.length}: ${file.name}`);
      try {
        if (file.size > 12 * 1024 * 1024) throw new Error("La imagen supera 12 MB.");
        const signed = await api<{
          intentId: string; storagePath: string; token: string;
          uploadConfig: { url: string; publishableKey: string };
        }>("/api/panel/deliveries/uploads", {
          action: "sign", galleryId: current.id, fileName: file.name,
          mimeType: file.type, sizeBytes: file.size,
        });
        const client = createClient(signed.uploadConfig.url, signed.uploadConfig.publishableKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { error: uploadError } = await client.storage.from("crisdal-private-media")
          .uploadToSignedUrl(signed.storagePath, signed.token, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        await api("/api/panel/deliveries/uploads", {
          action: "confirm", galleryId: current.id, intentId: signed.intentId,
          alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        });
        completed++;
      } catch (reason) {
        setNotice(`Se cargaron ${completed} de ${all.length} archivos. Error en ${file.name}: ${reason instanceof Error ? reason.message : "error desconocido"}`);
        break;
      }
    }
    setUploadState("");
    const partialMessage = completed < all.length ? "Algunos archivos no se pudieron cargar. Puedes reintentar únicamente los pendientes." : "";
    await openGallery(current.id);
    if (completed === all.length) setNotice(`${completed} fotografía(s) cargada(s) en almacenamiento privado.`);
    else setNotice(`${completed} de ${all.length} fotografías cargadas. ${partialMessage}`);
    setBusy(false);
  }
  async function addVideo() {
    if (!current) return;
    setBusy(true); setNotice("");
    try {
      await api("/api/panel/deliveries", { action: "video", galleryId: current.id, title: video.title, url: video.url });
      setVideo({ title: "", url: "" });
      await openGallery(current.id);
      setNotice("Video enlazado. Su privacidad depende de la configuración del proveedor.");
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "No se pudo agregar el video."); }
    finally { setBusy(false); }
  }
  async function removeAsset(assetId: string) {
    if (!current || !window.confirm("¿Eliminar este medio de la entrega? Esta acción no es reversible.")) return;
    setBusy(true);
    try {
      await api("/api/panel/deliveries", { action: "removeAsset", galleryId: current.id, assetId });
      await openGallery(current.id);
      setNotice("Medio retirado.");
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "No se pudo retirar."); }
    finally { setBusy(false); }
  }
  async function moveAsset(index: number, change: number) {
    if (!current) return;
    const j = index + change; if (j < 0 || j >= assets.length) return;
    const ids = assets.map((asset) => asset.id);
    [ids[index], ids[j]] = [ids[j], ids[index]];
    setBusy(true);
    try {
      await api("/api/panel/deliveries", { action: "reorder", galleryId: current.id, assetIds: ids });
      await openGallery(current.id);
      setNotice("Orden actualizado.");
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "No se pudo ordenar."); }
    finally { setBusy(false); }
  }
  return <main className={styles.page}>
    <header className={styles.header}><div><span className={styles.eyebrow}>CRISDAL OS · EXPERIENCIA DEL CLIENTE</span><h1>Entregas privadas</h1><p>Presenta fotografías y videos, recibe selecciones de favoritos y controla los accesos.</p></div><button type="button" className={styles.primary} onClick={() => { setEditor(initial()); setCurrent(null); setAssets([]); setShareUrl(""); setNotice(""); }}>Nueva entrega</button></header>
    {error ? <div className={styles.alert} role="alert"><strong>Activación pendiente</strong><p>{error} No se muestra contenido ficticio.</p></div> : null}
    {notice ? <div className={styles.notice} role="status">{notice}</div> : null}
    <section className={styles.galleryList} aria-label="Entregas creadas">
      {galleries.map((gallery) => <button type="button" key={gallery.id} onClick={() => void openGallery(gallery.id)} aria-pressed={current?.id === gallery.id}>
        <span className={styles.meta}>{gallery.eventType} · {gallery.status === "published" ? "Compartida" : "Borrador"}</span>
        <strong>{gallery.title}</strong>
        <small>{gallery.expiresAt ? `Caduca: ${new Date(gallery.expiresAt).toLocaleDateString("es-PE")}` : "No publicada"}</small>
      </button>)}
      {!error && !galleries.length ? <div className={styles.empty}><h2>Sin entregas todavía</h2><p>Crea la primera cuando tengas material del cliente listo para compartir.</p></div> : null}
    </section>
    {editor ? <section className={styles.editor} aria-label="Editor de entrega">
      <div className={styles.editorTop}><div><span className={styles.eyebrow}>EDITOR DE ENTREGA</span><h2>{editor.id ? "Editar entrega" : "Crear entrega"}</h2></div><button type="button" className={styles.secondary} onClick={() => setEditor(null)}>Cerrar</button></div>
      <div className={styles.formGrid}>
        <label>Título<input value={editor.title} maxLength={150} placeholder="Ej. Nuestra historia" onChange={(e) => setEditor({ ...editor, title: e.target.value })}/></label>
        <label>Proyecto asociado (opcional)<select value={editor.projectId??""} disabled={current?.status==="published"} onChange={e=>setEditor({...editor,projectId:e.target.value||null})}><option value="">Sin proyecto asociado</option>{editor.projectId&&!projects.some(p=>p.id===editor.projectId)&&<option value={editor.projectId}>Proyecto asociado anteriormente</option>}{projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
        <label>Tipo de evento<select value={editor.eventType} onChange={(e) => setEditor({ ...editor, eventType: e.target.value as GalleryInput["eventType"] })}>{eventTypes.map((event) => <option key={event}>{event}</option>)}</select></label>
        <label className={styles.full}>Mensaje para el cliente<textarea value={editor.description} maxLength={1800} rows={3} onChange={(e) => setEditor({ ...editor, description: e.target.value })}/></label>
        <label className={styles.check}><input type="checkbox" checked={editor.allowDownloads} onChange={(e) => setEditor({ ...editor, allowDownloads: e.target.checked })}/> Permitir descarga individual de fotografías originales</label>
      </div>
      <div className={styles.toolbar}><button type="button" className={styles.primary} disabled={busy || !editor.title.trim()} onClick={() => void save()}>{busy ? "Procesando..." : "Guardar entrega"}</button></div>
      {current && <><div className={styles.step}><div><h3>Fotografías</h3><p>Selecciona varios archivos JPG, PNG, WebP o AVIF. Máximo 12 MB cada uno. Los originales permanecen privados.</p></div><label className={styles.upload}>Elegir fotografías<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} onChange={(e) => { void upload(e.target.files); e.target.value = ""; }}/></label></div>
        {uploadState ? <p role="status" className={styles.uploadStatus}>{uploadState}</p> : null}
        <div className={styles.assetGrid}>{assets.map((asset, index) => <article key={asset.id}>{asset.kind === "image" && asset.thumbnailUrl ? <img className={styles.assetPreview} src={asset.thumbnailUrl} alt={asset.alt || asset.title || "Vista previa privada"} referrerPolicy="no-referrer"/> : null}<span className={styles.meta}>{asset.kind === "image" ? "FOTO" : "VIDEO"} · {asset.favorite ? "Favorita del cliente" : "Sin selección"}</span><h4>{asset.title || asset.originalName || "Medio"}</h4><div className={styles.assetActions}><button type="button" disabled={busy || index === 0} onClick={() => void moveAsset(index, -1)}>↑</button><button type="button" disabled={busy || index === assets.length - 1} onClick={() => void moveAsset(index, 1)}>↓</button><button type="button" disabled={busy} onClick={() => void removeAsset(asset.id)}>Quitar</button></div></article>)}</div>
        <div className={styles.step}><div><h3>Video relacionado</h3><p>Pega un enlace autorizado de YouTube o Vimeo. El reproductor se abre en la plataforma original.</p></div><div className={styles.videoForm}><label>Título<input value={video.title} onChange={(e) => setVideo({ ...video, title: e.target.value })}/></label><label>URL<input type="url" placeholder="https://vimeo.com/..." value={video.url} onChange={(e) => setVideo({ ...video, url: e.target.value })}/></label><button type="button" disabled={busy || !video.title || !video.url} onClick={() => void addVideo()}>Añadir video</button></div></div>
        <div className={styles.publication}><div><h3>Compartir entrega</h3><p>El enlace privado dura 30 días. El anterior se revoca al generar uno nuevo. No se publicará en buscadores.</p></div><div className={styles.toolbar}><button type="button" disabled={busy || !assets.length} className={styles.primary} onClick={() => void publication(true)}>{current.status === "published" ? "Regenerar enlace" : "Publicar y generar enlace"}</button>{current.status === "published" ? <button type="button" disabled={busy} onClick={() => void publication(false)}>Revocar enlace</button> : null}</div>
          {shareUrl ? <div className={styles.share}><input readOnly value={shareUrl} aria-label="Enlace privado de entrega"/><button type="button" onClick={() => void navigator.clipboard.writeText(shareUrl).then(() => setNotice("Enlace copiado.")).catch(() => setNotice("Copia el enlace manualmente."))}>Copiar enlace</button><a href={shareUrl} target="_blank" rel="noopener noreferrer">Abrir vista del cliente</a></div> : null}
        </div></>}
    </section> : null}
  </main>;
}
