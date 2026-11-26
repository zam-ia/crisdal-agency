"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PortfolioDraftInput, PortfolioMedia, PortfolioProject, PortfolioStatus } from "../../lib/commercial/portfolio";
import { slugifyPortfolioTitle } from "../../lib/commercial/portfolio";
import type { PortfolioCategory } from "../../lib/commercial/portfolio-repository";
import styles from "./portfolio-admin.module.css";

type LoadResult = { projects: PortfolioProject[]; categories: PortfolioCategory[]; error?: string };
const empty = (categoryId = ""): PortfolioDraftInput => ({ slug: "", title: "", categoryId, clientName: null, clientDisplayAuthorized: false, year: null, description: "", objective: "", serviceType: "Producción audiovisual", featured: false, coverAssetId: null, consentStatus: "missing", consentScope: "", consentEvidenceReference: "", consentAuthorizedAt: null });

async function api(body?: unknown) {
  const response = await fetch("/api/panel/portfolio/projects", body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "No se pudo completar la operación.");
  return result;
}

export function PortfolioAdmin() {
  const [data, setData] = useState<LoadResult>({ projects: [], categories: [] });
  const [editor, setEditor] = useState<PortfolioDraftInput | null>(null);
  const [media, setMedia] = useState<PortfolioMedia[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [video, setVideo] = useState({ url: "", posterUrl: "", alt: "", orientation: "landscape" as const });
  const load = useCallback(async () => { try { setData(await api()); } catch (error) { setData({ projects: [], categories: [], error: error instanceof Error ? error.message : "Módulo no disponible." }); } }, []);
  useEffect(() => {
    let active = true;
    void api().then((result) => { if (active) setData(result); }).catch((error) => { if (active) setData({ projects: [], categories: [], error: error instanceof Error ? error.message : "Módulo no disponible." }); });
    return () => { active = false; };
  }, []);

  function edit(project: PortfolioProject) {
    setEditor({ id: project.id, slug: project.slug, title: project.title, categoryId: project.categoryId, clientName: project.clientName, clientDisplayAuthorized: project.clientDisplayAuthorized, year: project.year, description: project.description, objective: project.objective, serviceType: project.serviceType, featured: project.featured, coverAssetId: project.coverAssetId, consentStatus: project.consentStatus, consentScope: project.consentScope, consentEvidenceReference: project.consentEvidenceReference, consentAuthorizedAt: project.consentAuthorizedAt });
    setMedia(project.media); setNotice("");
  }
  async function save() {
    if (!editor) return; setBusy(true); setNotice("");
    try { const result = await api({ action: "save", project: editor }); edit(result.project); setNotice("Borrador guardado."); await load(); } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo guardar."); } finally { setBusy(false); }
  }
  async function changeStatus(status: PortfolioStatus) {
    if (!editor?.id) return; setBusy(true);
    try { const result = await api({ action: "status", id: editor.id, status }); edit(result.project); setNotice(status === "published" ? "Proyecto publicado." : status === "archived" ? "Proyecto archivado sin eliminar material." : "Proyecto retirado a borrador."); await load(); } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo cambiar el estado."); } finally { setBusy(false); }
  }
  function upload(file: File, alt: string, orientation: string) {
    if (!editor?.id) { setNotice("Guarda primero el proyecto antes de subir medios."); return; }
    const form = new FormData(); form.set("file", file); form.set("projectId", editor.id); form.set("alt", alt); form.set("orientation", orientation);
    const xhr = new XMLHttpRequest(); xhr.open("POST", "/api/panel/portfolio/media"); setProgress(1); setBusy(true);
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) setProgress(Math.round(event.loaded / event.total * 100)); };
    xhr.onload = () => { setBusy(false); setProgress(0); const result = JSON.parse(xhr.responseText || "{}"); if (xhr.status >= 200 && xhr.status < 300) { setMedia((current) => [...current, result.media]); setNotice("Imagen optimizada y cargada. Selecciona la portada y guarda."); void load(); } else setNotice(result.error || "No se pudo cargar la imagen."); };
    xhr.onerror = () => { setBusy(false); setProgress(0); setNotice("La carga se interrumpió."); }; xhr.send(form);
  }
  async function addVideo() {
    if (!editor?.id) return; setBusy(true);
    try { const result = await api({ action: "video", id: editor.id, url: video.url, posterUrl: video.posterUrl || null, alt: video.alt, orientation: video.orientation }); setMedia((current) => [...current, result.media]); setVideo({ url: "", posterUrl: "", alt: "", orientation: "landscape" }); setNotice("Video añadido."); } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo añadir el video."); } finally { setBusy(false); }
  }
  async function move(index: number, direction: -1 | 1) {
    if (!editor?.id) return; const target = index + direction; if (target < 0 || target >= media.length) return;
    const next = [...media]; [next[index], next[target]] = [next[target], next[index]]; setMedia(next);
    try { await api({ action: "reorder", id: editor.id, mediaIds: next.map((item) => item.id) }); setNotice("Orden actualizado."); } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo reordenar."); }
  }

  return <main className={styles.page}>
    <header className={styles.header}><div><p>CRISDAL OS · CONTENIDO</p><h1>Portafolio</h1><span>Proyectos reales, autorización documentada y medios listos para compartir.</span></div><button type="button" onClick={() => { setEditor(empty(data.categories[0]?.id)); setMedia([]); }}>Nuevo proyecto</button></header>
    {data.error ? <div className={styles.warning}><strong>Activación pendiente</strong><p>{data.error} El código está listo, pero no se simula persistencia.</p></div> : null}
    {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
    <section className={styles.projects}>{data.projects.map((project) => <button type="button" onClick={() => edit(project)} key={project.id}><span data-status={project.status}>{project.status}</span><h2>{project.title}</h2><p>{project.categoryName} · {project.media.length} medios</p></button>)}{!data.error && !data.projects.length ? <div className={styles.emptyState}><h2>Sin proyectos todavía</h2><p>Crea el primero cuando tengas material real y autorización respaldada.</p></div> : null}</section>
    {editor ? <section className={styles.editor} aria-label="Editor de proyecto">
      <div className={styles.editorHead}><div><p>{editor.id ? "Editar proyecto" : "Nuevo proyecto"}</p><h2>{editor.title || "Proyecto sin título"}</h2></div><button type="button" onClick={() => setEditor(null)} aria-label="Cerrar editor">Cerrar</button></div>
      <div className={styles.formGrid}>
        <label>Título<input value={editor.title} onChange={(event) => setEditor({ ...editor, title: event.target.value, slug: editor.id ? editor.slug : slugifyPortfolioTitle(event.target.value) })} /></label>
        <label>Slug<input value={editor.slug} onChange={(event) => setEditor({ ...editor, slug: slugifyPortfolioTitle(event.target.value) })} /></label>
        <label>Categoría<select value={editor.categoryId} onChange={(event) => setEditor({ ...editor, categoryId: event.target.value })}>{data.categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label>Tipo de servicio<input value={editor.serviceType} onChange={(event) => setEditor({ ...editor, serviceType: event.target.value })} /></label>
        <label>Cliente (opcional)<input value={editor.clientName || ""} onChange={(event) => setEditor({ ...editor, clientName: event.target.value || null })} /></label>
        <label>Año<input type="number" min="2000" max="2100" value={editor.year || ""} onChange={(event) => setEditor({ ...editor, year: event.target.value ? Number(event.target.value) : null })} /></label>
        <label className={styles.wide}>Descripción<textarea value={editor.description} onChange={(event) => setEditor({ ...editor, description: event.target.value })} /></label>
        <label className={styles.wide}>Objetivo de producción<textarea value={editor.objective} onChange={(event) => setEditor({ ...editor, objective: event.target.value })} /></label>
        <label className={styles.check}><input type="checkbox" checked={editor.featured} onChange={(event) => setEditor({ ...editor, featured: event.target.checked })} /> Proyecto destacado</label>
        <label className={styles.check}><input type="checkbox" checked={editor.clientDisplayAuthorized} onChange={(event) => setEditor({ ...editor, clientDisplayAuthorized: event.target.checked })} /> Nombre del cliente autorizado</label>
      </div>
      <fieldset><legend>Autorización de publicación</legend><p>La selección no sustituye el respaldo legal. Registra una referencia verificable.</p><div className={styles.formGrid}>
        <label>Estado<select value={editor.consentStatus} onChange={(event) => setEditor({ ...editor, consentStatus: event.target.value as PortfolioDraftInput["consentStatus"] })}><option value="missing">Sin respaldo</option><option value="pending">Pendiente</option><option value="verified">Verificada</option><option value="revoked">Revocada</option></select></label>
        <label>Fecha<input type="datetime-local" value={editor.consentAuthorizedAt?.slice(0,16) || ""} onChange={(event) => setEditor({ ...editor, consentAuthorizedAt: event.target.value ? new Date(event.target.value).toISOString() : null })} /></label>
        <label className={styles.wide}>Alcance autorizado<textarea value={editor.consentScope} onChange={(event) => setEditor({ ...editor, consentScope: event.target.value })} /></label>
        <label className={styles.wide}>Referencia del respaldo<input value={editor.consentEvidenceReference} onChange={(event) => setEditor({ ...editor, consentEvidenceReference: event.target.value })} placeholder="Contrato, correo o documento interno" /></label>
      </div></fieldset>
      <div className={styles.actions}><button type="button" disabled={busy} onClick={() => void save()}>Guardar borrador</button>{editor.id ? <><button type="button" disabled={busy} onClick={() => void changeStatus("published")}>Publicar</button><button type="button" disabled={busy} onClick={() => void changeStatus("draft")}>Despublicar</button><button type="button" disabled={busy} onClick={() => void changeStatus("archived")}>Archivar</button><a href={`/portafolio/${editor.slug}`} target="_blank" rel="noopener noreferrer">Vista previa pública</a><button type="button" onClick={() => void navigator.clipboard.writeText(`${window.location.origin}/portafolio/${editor.slug}`).then(() => setNotice("Enlace copiado."))}>Copiar enlace</button></> : null}</div>
      {editor.id ? <><section className={styles.mediaSection}><h3>Fotografías</h3><UploadForm busy={busy} progress={progress} onUpload={upload} />
        <div className={styles.mediaList}>{media.map((item, index) => <article key={item.id}><span>{item.kind} · {item.orientation}</span><p>{item.alt}</p><div><button type="button" onClick={() => void move(index,-1)} disabled={index===0}>Subir</button><button type="button" onClick={() => void move(index,1)} disabled={index===media.length-1}>Bajar</button>{item.kind === "image" ? <button type="button" onClick={() => setEditor({ ...editor, coverAssetId: item.id })}>{editor.coverAssetId === item.id ? "Portada actual" : "Usar como portada"}</button> : null}</div></article>)}</div>
      </section><section className={styles.mediaSection}><h3>Video externo aprobado</h3><div className={styles.formGrid}><label>URL YouTube o Vimeo<input value={video.url} onChange={(event) => setVideo({ ...video, url: event.target.value })} /></label><label>Poster (URL opcional)<input value={video.posterUrl} onChange={(event) => setVideo({ ...video, posterUrl: event.target.value })} /></label><label>Texto alternativo<input value={video.alt} onChange={(event) => setVideo({ ...video, alt: event.target.value })} /></label><label>Orientación<select value={video.orientation} onChange={(event) => setVideo({ ...video, orientation: event.target.value as typeof video.orientation })}><option value="landscape">16:9</option><option value="portrait">9:16</option><option value="square">Cuadrado</option></select></label></div><button type="button" disabled={busy || !video.url || !video.alt} onClick={() => void addVideo()}>Añadir video</button><p>Los videos pesados permanecen en un proveedor aprobado; no se cargan automáticamente a Vercel o Supabase.</p></section></> : null}
    </section> : null}
  </main>;
}

function UploadForm({ busy, progress, onUpload }: { busy: boolean; progress: number; onUpload: (file: File, alt: string, orientation: string) => void }) {
  const [file, setFile] = useState<File | null>(null); const [alt, setAlt] = useState(""); const [orientation, setOrientation] = useState("landscape");
  const preview = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  return <div className={styles.upload}>{preview ? <img className={styles.uploadPreview} src={preview} alt="Previsualización local antes de subir" /> : null}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setFile(event.target.files?.[0] || null)} /><input aria-label="Texto alternativo" placeholder="Describe la fotografía" value={alt} onChange={(event) => setAlt(event.target.value)} /><select aria-label="Orientación" value={orientation} onChange={(event) => setOrientation(event.target.value)}><option value="landscape">Horizontal</option><option value="portrait">Vertical</option><option value="square">Cuadrada</option></select><button type="button" disabled={busy || !file || alt.length < 3} onClick={() => file && onUpload(file,alt,orientation)}>Subir imagen</button>{progress ? <progress value={progress} max="100">{progress}%</progress> : null}</div>;
}
