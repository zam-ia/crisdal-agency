"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PortfolioDraftInput, PortfolioMedia, PortfolioProject, PortfolioStatus } from "../../lib/commercial/portfolio";
import { parseExternalVideoUrl, slugifyPortfolioTitle, portfolioDraftInputSchema, publicationIssues } from "../../lib/commercial/portfolio";
import type { PortfolioCategory } from "../../lib/commercial/portfolio-repository";
import { useUnsavedNavigation } from "../../ui/os/use-unsaved-navigation";
import {limaDateTimeInput,limaDateTimeToIso} from "../../lib/os/form-safeguards";
import styles from "./portfolio-admin.module.css";

type LoadResult = { projects: PortfolioProject[]; categories: PortfolioCategory[]; error?: string };
type UploadItem = { id: string; file: File; alt: string; orientation: "portrait"|"landscape"|"square"; progress: number; intentId?: string; state: "pending"|"uploading"|"done"|"error"; error?: string };
const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const maxImageBytes = 12 * 1024 * 1024;
const empty = (categoryId = ""): PortfolioDraftInput => ({ slug: "", title: "", categoryId, clientName: null, clientDisplayAuthorized: false, year: null, description: "", objective: "", serviceType: "Cobertura de evento", featured: false, coverAssetId: null, consentStatus: "missing", consentScope: "", consentEvidenceReference: "", consentAuthorizedAt: null });

async function api(body?: unknown) { const response = await fetch("/api/panel/portfolio/projects", body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined); const result = await response.json(); if (!response.ok) throw new Error(result.error || "No se pudo completar la operación."); return result; }
async function uploadApi(body: unknown) { const response = await fetch("/api/panel/portfolio/uploads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const result = await response.json(); if (!response.ok) throw Object.assign(new Error(result.error || "No se pudo procesar la imagen."), { status: response.status }); return result; }

function validInformation(editor: PortfolioDraftInput) {
  return portfolioDraftInputSchema.safeParse({
    ...editor,
    title: editor.title.trim(),
    description: editor.description.trim(),
    serviceType: editor.serviceType.trim(),
  }).success;
}

function draftOf(project: PortfolioProject): PortfolioDraftInput {
  const { id, slug, title, categoryId, clientName, clientDisplayAuthorized, year, description, objective, serviceType, featured, coverAssetId, consentStatus, consentScope, consentEvidenceReference, consentAuthorizedAt } = project;
  return { id, slug, title, categoryId, clientName, clientDisplayAuthorized, year, description, objective, serviceType, featured, coverAssetId, consentStatus, consentScope, consentEvidenceReference, consentAuthorizedAt };
}

function putImage(url: string, file: File, onProgress: (progress: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.timeout = 120_000;
    request.setRequestHeader("Content-Type", file.type);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(10 + Math.round(75 * event.loaded / event.total));
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error("La transferencia privada fue rechazada."));
    };
    request.onerror = request.ontimeout = request.onabort = () => reject(new Error("Se interrumpió la transferencia. Puedes reintentar."));
    request.send(file);
  });
}

function UploadPreview({ file }: { file: File }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const image = ref.current;
    if (!image) return;
    const url = URL.createObjectURL(file);
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <img ref={ref} className={styles.queueThumb} alt="" />;
}

export function PortfolioAdmin({ startCreating = false }: { startCreating?: boolean }) {
  const [data, setData] = useState<LoadResult>({ projects: [], categories: [] });
  const [editor, setEditor] = useState<PortfolioDraftInput | null>(() => startCreating ? empty() : null);
  const [media, setMedia] = useState<PortfolioMedia[]>([]);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [dirty, setDirty] = useState(false); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false);
  const [video, setVideo] = useState({ url: "", posterUrl: "", alt: "", title: "", provider: "youtube" as "youtube"|"vimeo"|"tiktok"|"facebook"|"instagram", embedMode: "embed" as "embed"|"external", orientation: "landscape" as "landscape"|"portrait"|"square" });
  const load = useCallback(async () => { try { setData(await api()); } catch (error) { setData({ projects: [], categories: [], error: error instanceof Error ? error.message : "Módulo no disponible." }); } }, []);
  useEffect(() => {
    let active = true;
    void api().then((result: LoadResult) => { if (active) setData(result); })
      .catch(() => { if (active) setData({ projects: [], categories: [], error: "No se pudo cargar el portafolio." }); });
    return () => { active = false; };
  }, []);
  const [attempted, setAttempted] = useState(false);
  const editing=Boolean(editor);
  const pageTitle=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{if(editing){pageTitle.current?.focus({preventScroll:true});pageTitle.current?.scrollIntoView({block:"start",behavior:"auto"});}},[editing]);
  const writing = useRef(false);
  const hasPending = uploads.some((item) => item.state !== "done");
  const pendingVideo = Boolean(video.url || video.title || video.alt || video.posterUrl);
  const unsaved = dirty || hasPending || pendingVideo;
  const issues = editor ? publicationIssues({ ...editor, media }) : [];
  const leaveState = useCallback(() => ({
    writing: writing.current,
    warning: unsaved ? "Hay cambios sin guardar. ¿Quieres salir de este proyecto?" : "",
  }), [unsaved]);
  useUnsavedNavigation(leaveState);

  const update = (value: Partial<PortfolioDraftInput>) => {
    if(writing.current)return;
    setEditor((current) => current ? { ...current, ...value } : null);
    setDirty(true);
  };

  function switchProject(project?: PortfolioProject) {
    if (writing.current || (unsaved && !window.confirm("Hay cambios o archivos sin guardar. ¿Deseas continuar?"))) return;
    setEditor(project ? draftOf(project) : empty());
    setMedia(project?.media ?? []);
    setUploads([]);
    setVideo((current) => ({ ...current, url: "", title: "", alt: "", posterUrl: "" }));
    setAttempted(false);
    setDirty(false);
    setNotice("");
  }

  function focusSection(id:string){ const el=document.getElementById(id);el?.focus({preventScroll:true});el?.scrollIntoView({block:"start",behavior:"auto"}); }

  function closeEditor(){
    if(writing.current || (unsaved && !window.confirm("Hay cambios o archivos sin guardar. ¿Salir del proyecto?")))return;
    setEditor(null);setUploads([]);setDirty(false);setAttempted(false);setVideo(current=>({...current,url:"",title:"",alt:"",posterUrl:""}));
  }

  async function persist() {
    if (!editor) return null;
    if (!validInformation(editor)) {
      setAttempted(true);
      focusSection("portfolio-information");
      throw new Error("Revisa los campos señalados antes de guardar.");
    }
    const { project } = await api({ action: "save", project: editor }) as { project: PortfolioProject };
    setEditor(draftOf(project));
    setMedia(project.media);
    setDirty(false);
    return project;
  }

  async function save() {
    if (writing.current) return;
    writing.current = true;
    setBusy(true);
    setNotice("");
    try {
      await persist();
      setNotice("Avance guardado.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }

  async function changeStatus(status: PortfolioStatus) {
    if (!editor || writing.current) return;
    if (status === "published" && hasPending) {
      focusSection("portfolio-photos");
      setNotice("Completa o retira las cargas pendientes antes de publicar.");
      return;
    }
    if (status === "published" && pendingVideo) {
      focusSection("portfolio-social");
      setNotice("Añade el enlace social pendiente o borra sus campos antes de publicar.");
      return;
    }
    if (status === "published" && issues.length) {
      setNotice(issues.join(" "));
      return;
    }

    writing.current = true;
    setBusy(true);
    try {
      const projectId = editor.id && !dirty ? editor.id : (await persist())?.id;
      if (!projectId) return;
      const { project } = await api({ action: "status", id: projectId, status }) as { project: PortfolioProject };
      setEditor(draftOf(project));
      setMedia(project.media);
      setNotice(status === "published" ? "Proyecto publicado." : "Proyecto retirado del portafolio.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo cambiar el estado.");
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }

  function enqueue(files: File[]) {
    if (!editor || writing.current) return;
    const valid = files.filter((file) => allowedTypes.includes(file.type) && file.size > 0 && file.size <= maxImageBytes);
    setUploads((current) => [
      ...current,
      ...valid
        .filter((file) => !current.some((item) => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified))
        .map((file): UploadItem => ({ id: crypto.randomUUID(), file, alt: "Fotografía de " + (editor.title || "evento"), orientation: "landscape", progress: 0, state: "pending" })),
    ]);
    if (valid.length !== files.length) setNotice("Algunas imágenes se omitieron. Selecciona JPG, PNG, WebP o AVIF de hasta 12 MB.");
  }

  function patchUpload(id: string, partial: Partial<UploadItem>) {
    setUploads((current) => current.map((item) => item.id === id ? { ...item, ...partial } : item));
  }

  async function uploadPending() {
    if (!editor || writing.current) return;
    const batch = uploads.filter((item) => item.state === "pending" || item.state === "error");
    if (!batch.length) return;
    writing.current = true;
    setBusy(true);
    setNotice("");
    let failed = 0;
    try {
      const projectId = editor.id && !dirty ? editor.id : (await persist())?.id;
      if (!projectId) return;
      for (const item of batch) {
        patchUpload(item.id, { state: "uploading", progress: 5, error: undefined });
        try {
          let intentId = item.intentId;
          if (!intentId) {
            const signed = await uploadApi({ action: "sign", projectId, fileName: item.file.name, mimeType: item.file.type, sizeBytes: item.file.size });
            await putImage(signed.signedUrl, item.file, (progress) => patchUpload(item.id, { progress }));
            intentId = signed.intentId;
            patchUpload(item.id, { intentId, progress: 90 });
          }
          const { media: confirmed } = await uploadApi({ action: "confirm", projectId, intentId, alt: item.alt.trim() || "Fotografía de evento", orientation: item.orientation }) as { media: PortfolioMedia };
          setMedia((current) => current.some((existing) => existing.id === confirmed.id) ? current : [...current, confirmed]);
          patchUpload(item.id, { state: "done", progress: 100 });
        } catch (error) {
          failed++;
          const message = error instanceof Error ? error.message : "Carga interrumpida.";
          const status = error && typeof error === "object" && "status" in error ? error.status : null;
          const reset = status === 404 || status === 415 || /autorización de carga expiró/i.test(message);
          patchUpload(item.id, { state: "error", error: message, ...(reset ? { intentId: undefined } : {}) });
        }
      }
      setNotice(failed ? "Revisa los archivos que requieren un reintento." : "Todas las fotografías seleccionadas quedaron guardadas.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Guarda primero los datos del proyecto.");
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }

  async function runMediaMutation(work:()=>Promise<void>,fallback:string){
    if(writing.current)return;
    writing.current=true;setBusy(true);
    try{await work();}catch(error){setNotice(error instanceof Error?error.message:fallback);}
    finally{writing.current=false;setBusy(false);}
  }
  async function addVideo(){
    if(!editor)return;
    await runMediaMutation(async()=>{
      const parsed=parseExternalVideoUrl(video.url);
      if(!parsed)throw new Error("Usa una URL HTTPS compatible de Instagram, Facebook, TikTok, YouTube o Vimeo.");
      const projectId=editor.id&&!dirty?editor.id:(await persist())?.id;
      if(!projectId)return;
      const payload={...video,title:video.title.trim()||("Publicación de "+editor.title).slice(0,180),alt:video.alt.trim()||("Contenido de "+editor.title).slice(0,240),url:parsed.canonicalUrl,provider:parsed.provider,embedMode:parsed.embedUrl?video.embedMode:"external"};
      const result=await api({action:"video",id:projectId,...payload,posterUrl:video.posterUrl||null});
      setMedia(current=>current.some(item=>item.id===result.media.id)?current:[...current,result.media]);
      setVideo({url:"",posterUrl:"",alt:"",title:"",provider:"youtube",embedMode:"embed",orientation:"landscape"});
      setNotice("Enlace guardado. Comprueba su reproducción en la vista pública después de publicar.");await load();
    },"No se pudo añadir la publicación.");
  }
  async function move(id:string,direction:-1|1){
    if(!editor?.id)return;
    const index=media.findIndex(entry=>entry.id===id),target=index+direction;
    if(index<0||target<0||target>=media.length)return;
    const next=[...media];[next[index],next[target]]=[next[target],next[index]];
    await runMediaMutation(async()=>{await api({action:"reorder",id:editor.id,mediaIds:next.map(item=>item.id)});setMedia(next);setNotice("Orden confirmado.");},"No se pudo reordenar.");
  }
  async function unlink(item:PortfolioMedia){
    if(!editor?.id||writing.current||!confirm(`¿Quitar ${item.alt} de este proyecto? El original privado no se elimina.`))return;
    await runMediaMutation(async()=>{
      await api({action:"unlink",id:editor.id,mediaId:item.id});
      setMedia(current=>current.filter(x=>x.id!==item.id));
      if(editor.coverAssetId===item.id){setEditor(current=>current?{...current,coverAssetId:null}:null);setDirty(true);}
      setNotice("Medio retirado del proyecto.");await load();
    },"No se pudo retirar el medio.");
  }
  async function saveCategories(next:PortfolioCategory[]){
    await runMediaMutation(async()=>{await api({action:"categories",updates:next.map((item,index)=>({id:item.id,visible:item.visible!==false,sortOrder:(index+1)*10}))});setData(current=>({...current,categories:next}));setNotice("Orden y visibilidad de categorías confirmados.");},"No se pudo guardar la configuración de categorías.");
  }
  const preview = useMemo(() => media.find((item) => item.id === editor?.coverAssetId), [media, editor?.coverAssetId]);

  const parsedSocial=parseExternalVideoUrl(video.url);
  const photosCount=media.filter(item=>item.kind==="image").length;
  const socialCount=media.length-photosCount;
  const categoryOptions=[...data.categories].sort((a,b)=>Number(/comercial|producto|empresarial|reels|contenido|behind/i.test(a.name))-Number(/comercial|producto|empresarial|reels|contenido|behind/i.test(b.name)));
  return <div className={styles.page}>
    <header className={styles.header}><div><p>CRISDAL OS · PORTAFOLIO</p><h1 ref={pageTitle} tabIndex={-1}>{editor?(editor.id?"Editar trabajo":"Nuevo trabajo"):"Portafolio"}</h1><span>{editor?"Añade fotos y enlaces sociales desde una sola pantalla.":"Organiza y publica los trabajos que tus clientes podrán ver."}</span></div>{editor?<button type="button" className={styles.secondary} disabled={busy} onClick={closeEditor}>Volver al portafolio</button>:<button type="button" disabled={busy||Boolean(data.error)||!data.categories.length} onClick={()=>switchProject()}>+ Nuevo trabajo</button>}</header>
    {data.error&&<div className={styles.warning} role="alert"><strong>No se pudo cargar el portafolio</strong><p>{data.error}</p><button type="button" className={styles.secondary} onClick={()=>void load()}>Reintentar</button></div>}
    {notice&&!editor&&<p className={styles.notice} role="status">{notice}</p>}
    {!editor?<><section className={styles.projects}>{data.projects.map(project=><button type="button" disabled={busy} onClick={()=>switchProject(project)} key={project.id}><span data-status={project.status}>{({draft:"Borrador",published:"Publicado",archived:"Archivado"})[project.status]}</span><h2>{project.title}</h2><p>{project.categoryName} · {project.media.length} medios</p></button>)}{!data.error&&!data.projects.length&&<div className={styles.emptyState}><h2>Aún no tienes trabajos</h2><p>Sube tus fotografías o pega enlaces de redes sociales. Puedes guardar un borrador antes de publicar.</p><button className={styles.primary} type="button" disabled={!data.categories.length} onClick={()=>switchProject()}>Crear mi primer trabajo</button></div>}</section>
      <details className={styles.categorySettings}><summary>Administrar categorías del portafolio</summary><p>Estos ajustes cambian el orden y visibilidad de las categorías en todo el sitio, no solo en un trabajo.</p><fieldset disabled={busy} className={styles.stepFields}><div className={styles.choiceGrid}>{data.categories.map((category, index) => <article key={category.id} data-selected={false} data-hidden={category.visible === false}><div className={styles.categoryLabel}><strong>{category.name}</strong><span>{category.visible === false ? "Oculta en el sitio" : "Visible en el sitio"}</span></div><div><button type="button" disabled={index === 0} onClick={() => { const next=[...data.categories];[next[index-1],next[index]]=[next[index],next[index-1]];void saveCategories(next); }} aria-label={"Mover arriba "+category.name}>↑</button><button type="button" disabled={index === data.categories.length-1} onClick={() => { const next=[...data.categories];[next[index+1],next[index]]=[next[index],next[index+1]];void saveCategories(next); }} aria-label={"Mover abajo "+category.name}>↓</button><button type="button" onClick={() => void saveCategories(data.categories.map((item) => item.id === category.id ? { ...item, visible: item.visible === false } : item))}>{category.visible === false ? "Mostrar" : "Ocultar"}</button></div></article>)}</div></fieldset></details></>
    :<section className={styles.workspace} aria-label="Editor de portafolio" aria-busy={busy}>
      <div className={styles.workspaceTop}><div><strong>{editor.title||"Trabajo sin nombre"}</strong><p>{editor.id?"Proyecto guardado":"Borrador nuevo"} · {photosCount} fotos · {socialCount} enlaces</p></div><button type="button" className={styles.secondary} disabled={busy} onClick={()=>void save()}>{busy?"Procesando…":"Guardar datos"}</button></div>
      {notice&&<p className={styles.notice} role="status">{notice}</p>}
      <fieldset disabled={busy} className={styles.stepFields}>
        <div className={styles.workspaceGrid}>
          <section id="portfolio-information" tabIndex={-1} className={styles.workCard}><h2>1. Datos del trabajo</h2>{attempted&&!validInformation(editor)&&<p role="alert">Completa la categoría, nombre y descripción del trabajo antes de guardar archivos o enlaces. Tus selecciones se conservan.</p>}<label className={styles.categoryField}>Tipo de evento *<select value={editor.categoryId} aria-invalid={attempted&&!editor.categoryId} onChange={e=>update({categoryId:e.target.value})}><option value="">Selecciona una categoría</option>{categoryOptions.map(category=><option key={category.id} value={category.id}>{category.name}{category.visible===false?" (oculta)":""}</option>)}</select></label><ProjectInformation editor={editor} update={update} attempted={attempted}/></section>
          <div className={styles.mediaColumn}>
            <section id="portfolio-photos" tabIndex={-1} className={styles.workCard}><h2>2. Fotografías</h2><p>Sube una selección de tus mejores imágenes o continúa con enlaces sociales.</p>
        <div className={styles.upload} data-busy={busy} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); enqueue(Array.from(event.dataTransfer.files)); }}>
          <label>Seleccionar fotografías <input type="file" multiple disabled={busy} accept={allowedTypes.join(",")} onChange={(event) => { enqueue(Array.from(event.target.files ?? [])); event.target.value = ""; }} /></label>
          <p>Arrastra archivos aquí o elígelos desde tu equipo. JPG, PNG, WebP o AVIF, hasta 12 MB por foto.</p>
          <button type="button" disabled={busy || !hasPending} onClick={() => void uploadPending()}>{busy ? "Procesando…" : uploads.some((item) => item.state === "error") ? "Subir y reintentar pendientes" : "Subir seleccionadas"}</button>
        </div>
        {uploads.length > 0 && <><progress aria-label="Progreso de todas las fotografías" value={uploads.reduce((sum, item) => sum + item.progress, 0) / uploads.length} max={100} /><div className={styles.uploadQueue}>{uploads.map((item) => <article key={item.id}>
          <UploadPreview file={item.file} />
          <strong>{item.file.name}</strong>
          <span>{Math.round(item.file.size / 1024)} KB · {({ pending: "Lista", uploading: "Subiendo", done: "Guardada", error: "Reintentar" })[item.state]}</span>
          <input aria-label={"Descripción de " + item.file.name} disabled={busy || item.state === "done"} maxLength={240} value={item.alt} onChange={(event) => patchUpload(item.id, { alt: event.target.value })} />
          <progress aria-label={"Carga de " + item.file.name} value={item.progress} max={100} />
          <select aria-label={"Orientación de " + item.file.name} disabled={busy || item.state === "done"} value={item.orientation} onChange={(event) => patchUpload(item.id, { orientation: event.target.value as UploadItem["orientation"] })}><option value="landscape">Horizontal</option><option value="portrait">Vertical</option><option value="square">Cuadrada</option></select>
          {item.state !== "done" && <button type="button" disabled={busy} onClick={() => setUploads((current) => current.filter((entry) => entry.id !== item.id))}>Quitar de la cola</button>}
          {item.error && <em>{item.error}</em>}
        </article>)}</div></>}
        
      </section>
            <section id="portfolio-social" tabIndex={-1} className={styles.workCard}><h2>3. Enlaces de redes sociales</h2><div className={styles.socialIntro}><span>Instagram</span><span>Facebook</span><span>TikTok</span><span>YouTube</span><span>Vimeo</span></div>
          <div className={styles.formGrid}><label className={styles.wide}>Enlace de la publicación<input type="url" placeholder="https://www.instagram.com/p/..." value={video.url} onChange={e=>{const parsed=parseExternalVideoUrl(e.target.value);setVideo({...video,url:e.target.value,provider:parsed?.provider||video.provider,embedMode:parsed?.embedUrl?"embed":"external",orientation:parsed?.contentType==="reel"||parsed?.provider==="tiktok"?"portrait":"landscape"});}}/><small>Pega la dirección original de una publicación pública, no el perfil.</small></label></div>
          {video.url.trim()&&<p className={styles.socialStatus} role="status">{parsedSocial?("Red reconocida: "+parsedSocial.provider+(parsedSocial.embedUrl?" · reproducción según compatibilidad y consentimiento":" · abrir publicación original")):"No se reconoce este enlace. Copia la dirección completa de la publicación."}</p>}
          <details className={styles.optionalFields}><summary>Personalizar publicación (opcional)</summary><div className={styles.formGrid}>
          <label className={styles.wide}>Título<input maxLength={180} placeholder="Ej.: Resumen de la boda" value={video.title} onChange={e=>setVideo({...video,title:e.target.value})}/><small>Si está vacío se utiliza el nombre del trabajo.</small></label>
          <label className={styles.wide}>Descripción accesible<input maxLength={240} placeholder="Ej.: La pareja durante la ceremonia" value={video.alt} onChange={e=>setVideo({...video,alt:e.target.value})}/></label>
          <label className={styles.wide}>Imagen propia de portada (URL opcional)<input type="url" value={video.posterUrl} onChange={e=>setVideo({...video,posterUrl:e.target.value})}/></label>
          <label>Presentación<select value={video.embedMode} onChange={e=>setVideo({...video,embedMode:e.target.value as typeof video.embedMode})}><option value="embed" disabled={!parsedSocial?.embedUrl}>Reproducir si es compatible</option><option value="external">Abrir publicación original</option></select></label>
          <label>Formato<select value={video.orientation} onChange={e=>setVideo({...video,orientation:e.target.value as typeof video.orientation})}><option value="landscape">Horizontal</option><option value="portrait">Vertical</option><option value="square">Cuadrado</option></select></label>
          </div></details>
          <div className={styles.localActions}><button className={styles.primary} type="button" disabled={busy||!parsedSocial} onClick={()=>void addVideo()}>Añadir enlace</button>{pendingVideo&&<button className={styles.secondary} type="button" onClick={()=>setVideo(current=>({...current,url:"",title:"",alt:"",posterUrl:""}))}>Limpiar</button>}</div>
          <p className={styles.microcopy}>No se descarga el video. Si no puede reproducirse aquí, se mostrará un enlace al original. Puedes añadir varios enlaces, uno por vez.</p></section>
          </div>
          <section className={styles.workCard+" "+styles.spanWorkspace}><h2>4. Contenido y portada</h2><p>Elige la imagen o publicación que representará el trabajo. Puedes ordenar o quitar archivos guardados.</p><div className={styles.coverStep}>{preview ? preview.kind === "image" || preview.posterUrl ? <img src={preview.posterUrl || preview.url} alt={preview.alt}/> : <div><strong>{preview.title || preview.alt}</strong><p>Portada social sin miniatura propia. La ficha pública mostrará una composición segura del proveedor.</p></div> : <div><strong>Elige una portada</strong><p>Selecciona una fotografía o publicación autorizada.</p></div>}</div><MediaList media={media} editor={editor} setCover={id=>update({coverAssetId:id})} move={move} unlink={unlink}/></section>
          <section className={styles.workCard}><h2>5. Permiso para publicar</h2><div className={styles.authorizationFields}><p>Registra una referencia verificable; la selección no sustituye el respaldo legal.</p><div className={styles.formGrid}><label>Estado<select value={editor.consentStatus} onChange={(e) => update({ consentStatus: e.target.value as PortfolioDraftInput["consentStatus"] })}><option value="missing">Sin respaldo</option><option value="pending">Pendiente</option><option value="verified">Verificada</option><option value="revoked">Revocada</option></select></label><label>Fecha y hora de autorización (Perú)<small>Cuándo recibiste el permiso real, no la fecha del evento.</small><input type="datetime-local" value={limaDateTimeInput(editor.consentAuthorizedAt)} onChange={(e) => update({ consentAuthorizedAt: limaDateTimeToIso(e.target.value) })}/></label><label className={styles.wide}>¿Qué te permitieron publicar?<small>Ej.: selección de fotos del evento en nuestra web. Escribe el alcance real.</small><textarea rows={3} value={editor.consentScope} onChange={(e) => update({ consentScope: e.target.value })}/></label><label className={styles.wide}>¿Dónde se conserva el permiso?<small>Referencia interna al contrato o autorización. No pegues documentos ni datos privados.</small><input value={editor.consentEvidenceReference} onChange={(e) => update({ consentEvidenceReference: e.target.value })}/></label></div></div></section>
          <section className={styles.workCard}><h2>6. Revisión y publicación</h2><div className={styles.publishReview}><p>Publicar requiere portada del trabajo, autorización verificada, fecha y referencia del respaldo. Si muestras el nombre del cliente, también necesitas permiso específico.</p>{(issues.length > 0 || hasPending || pendingVideo) && <ul className={styles.publicationIssues}>{issues.map((issue) => <li key={issue}>{issue}</li>)}{hasPending && <li>Completa las fotografías pendientes.</li>}{pendingVideo && <li>Añade el enlace social pendiente o borra sus campos.</li>}</ul>}<dl><div><dt>Proyecto</dt><dd>{editor.title || "Pendiente"}</dd></div><div><dt>Medios</dt><dd>{media.length}</dd></div><div><dt>Portada</dt><dd>{preview ? "Lista" : "Pendiente"}</dd></div><div><dt>Autorización</dt><dd>{({missing:"Sin respaldo",pending:"Pendiente",verified:"Verificada",revoked:"Revocada"})[editor.consentStatus]}</dd></div></dl><label className={styles.check}><input type="checkbox" checked={editor.featured} onChange={(e) => update({ featured: e.target.checked })}/> Destacar en la portada</label><div className={styles.actions}><button type="button" disabled={busy || hasPending || pendingVideo || issues.length > 0 || !validInformation(editor)} onClick={() => void changeStatus("published")}>Publicar</button>{editor.id&&data.projects.some(project=>project.id===editor.id&&project.status==="published")&&<button type="button" className={styles.secondary} disabled={busy} onClick={() => void changeStatus("draft")}>Despublicar</button>}{editor.id&&<button type="button" className={styles.secondary} disabled={busy} onClick={() => void changeStatus("archived")}>Archivar</button>}{data.projects.some((project) => project.id === editor.id && project.status === "published") && <><a href={`/portafolio/${editor.slug}`} target="_blank" rel="noopener noreferrer">Vista pública</a><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(new URL(`/portafolio/${editor.slug}`, window.location.origin).href); setNotice("Enlace copiado."); } catch { setNotice("Abre la vista pública y copia la dirección."); } }}>Copiar enlace</button></>}</div></div></section>
        </div>
        <div className={styles.workspaceFooter}><p>{hasPending||pendingVideo?"Hay archivos o enlaces pendientes de añadir.":dirty?"Tienes cambios sin guardar.":"Guarda el trabajo antes de salir."}</p><div className={styles.localActions}><button className={styles.secondary} type="button" disabled={busy} onClick={closeEditor}>Volver</button><button className={styles.primary} type="button" disabled={busy} onClick={()=>void save()}>Guardar borrador</button></div></div>
      </fieldset>
    </section>}
  </div>;
}

function ProjectInformation({editor,update,attempted}:{editor:PortfolioDraftInput;update:(value:Partial<PortfolioDraftInput>)=>void;attempted:boolean}){
 const titleError=attempted&&editor.title.trim().length<3, descriptionError=attempted&&editor.description.trim().length<20, serviceError=attempted&&editor.serviceType.trim().length<2;
 const slugError=attempted&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(editor.slug);
 const yearError=attempted&&editor.year!==null&&(!Number.isInteger(editor.year)||editor.year<2000||editor.year>2100);
 return <div className={styles.information}>
  <div className={styles.stepGuide}><h3>Cuéntanos qué trabajo realizaste</h3><p>Completa los campos con * para guardar. El resto es opcional. Los datos de este paso forman parte de la ficha pública cuando la publiques.</p></div>
  <div className={styles.formGrid}>
   <label className={styles.wide}>Nombre del trabajo *<input maxLength={180} placeholder="Ej.: Boda · Cobertura de fotografía y video" value={editor.title} aria-invalid={titleError} aria-describedby="title-help" onChange={e=>update({title:e.target.value,slug:editor.id?editor.slug:slugifyPortfolioTitle(e.target.value).replace(/-+$/,"")})}/><small id="title-help">{titleError?"Escribe al menos 3 caracteres.":"Así aparecerá el trabajo en tu portafolio. Evita nombres personales si no tienes permiso."}</small></label>
   <label>Servicio realizado *<input maxLength={180} list="crisdal-service-options" placeholder="Ej.: Fotografía y video" value={editor.serviceType} aria-invalid={serviceError} aria-describedby="service-help" onChange={e=>update({serviceType:e.target.value})}/><datalist id="crisdal-service-options"><option value="Fotografía y video"/><option value="Fotografía profesional"/><option value="Video profesional"/><option value="Cobertura audiovisual"/></datalist><small id="service-help">{serviceError?"Escribe el servicio realizado.":"Selecciona una sugerencia o escribe tu propio servicio."}</small></label>
   <label className={styles.shortField}>Año (opcional)<input type="number" inputMode="numeric" min={2000} max={2100} placeholder="2026" value={editor.year??""} aria-invalid={yearError} aria-describedby="year-help" onChange={e=>update({year:e.target.value?Number(e.target.value):null})}/><small id="year-help">{yearError?"Escribe un año entre 2000 y 2100, o déjalo vacío.":"Año en que se realizó."}</small></label>
   <label className={styles.wide}>Descripción del trabajo *<textarea rows={3} maxLength={4000} placeholder="Ej.: Documentamos la ceremonia, los retratos de la pareja y los momentos más especiales de la recepción." value={editor.description} aria-invalid={descriptionError} aria-describedby="description-help" onChange={e=>update({description:e.target.value})}/><small id="description-help">{descriptionError?"Escribe al menos 20 caracteres.":"Explica qué se cubrió y qué hicimos. Con 2–3 frases suele bastar."} · {editor.description.length}/4000</small></label>
  </div>
  <details className={styles.optionalFields} open={slugError?true:undefined}><summary>Detalles opcionales y enlace público</summary><div className={styles.formGrid}>
   <label className={styles.wide}>Frase destacada (antes «Objetivo»)<input maxLength={1600} placeholder="Ej.: Una historia para recordar toda la vida." value={editor.objective} onChange={e=>update({objective:e.target.value})}/><small>Es un subtítulo público de la galería. Si lo dejas vacío, el sitio utiliza una frase por categoría.</small></label>
   <label className={styles.wide}>Enlace del trabajo<input value={editor.slug} readOnly={Boolean(editor.id)} aria-invalid={slugError} placeholder="se-genera-desde-el-titulo" onChange={e=>update({slug:slugifyPortfolioTitle(e.target.value).replace(/-+$/,"")})}/><small>{editor.id?"El enlace se conserva aunque cambies el título, para no romper links compartidos.":"Se genera automáticamente desde el título; solo cámbialo si necesitas un enlace diferente."}</small><span className={styles.urlPreview}>/portafolio/{editor.slug||"nombre-del-trabajo"}</span></label>
   <label className={styles.wide}>Nombre del cliente (opcional)<input maxLength={180} placeholder="Solo si se autorizó su publicación" value={editor.clientName??""} onChange={e=>update({clientName:e.target.value||null, ...(!e.target.value?{clientDisplayAuthorized:false}:{})})}/><small>Si no hay permiso específico para mostrar el nombre, déjalo vacío. No es un campo de CRM.</small></label>
   {editor.clientName&&<label className={styles.check}><input type="checkbox" checked={editor.clientDisplayAuthorized} onChange={e=>update({clientDisplayAuthorized:e.target.checked})}/> Tengo autorización específica para publicar este nombre.</label>}
  </div></details>
 </div>;
}

function MediaList({ media, editor, setCover, move, unlink }: { media: PortfolioMedia[]; editor: PortfolioDraftInput; setCover: (id: string) => void; move: (id: string, direction: -1|1) => Promise<void>; unlink: (item: PortfolioMedia) => Promise<void> }) { return <div className={styles.mediaList}>{media.map((item, index) => <article key={item.id}>{item.kind === "image" ? <img src={item.posterUrl || item.url} alt={item.alt}/> : <span className={styles.videoBadge}>{item.provider || "video"}</span>}<p>{item.alt}</p><div><button type="button" onClick={() => void move(item.id, -1)} disabled={index === 0}>Subir</button><button type="button" onClick={() => void move(item.id, 1)} disabled={index === media.length - 1}>Bajar</button><button type="button" aria-pressed={editor.coverAssetId===item.id} onClick={() => setCover(item.id)}>{editor.coverAssetId === item.id ? "Portada elegida" : "Usar como portada"}</button><button type="button" onClick={() => void unlink(item)}>Quitar</button></div></article>)}</div>; }
